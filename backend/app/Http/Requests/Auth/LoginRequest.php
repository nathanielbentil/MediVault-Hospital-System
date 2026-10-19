<?php

namespace App\Http\Requests\Auth;

use App\Models\AuditLog;
use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Authenticate the request's credentials with sliding-window brute force defense.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): User
    {
        $this->ensureIsNotRateLimited();

        $email = strtolower(trim((string) $this->input('email')));
        $password = (string) $this->input('password');
        $ip = $this->ip();
        $userAgent = $this->userAgent();

        // 1. Locate user (case-insensitive for PostgreSQL reliability)
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        // 2. Check if user account is locked
        if ($user && $user->isLockedOut()) {
            LoginAttempt::create([
                'email_or_username' => $email,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'is_successful' => false,
                'failure_reason' => 'account_locked',
                'created_at' => now(),
            ]);

            throw ValidationException::withMessages([
                'email' => 'This account is temporarily locked due to excessive failed attempts. Please try again later or contact support.',
            ]);
        }

        // 3. Verify credentials (integrating HMAC Pepper and Argon2id via PasswordService)
        $isPasswordValid = false;
        if ($user) {
            $pepperVersion = $user->pepper_version ?? config('security.pepper.current_version', 'v1');
            $isPasswordValid = \App\Services\PasswordService::verify($password, $user->password, $pepperVersion);
        }

        if (!$user || !$isPasswordValid) {
            RateLimiter::hit($this->throttleKey(), 60);

            // Record telemetry
            LoginAttempt::create([
                'email_or_username' => $email,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'is_successful' => false,
                'failure_reason' => 'invalid_credentials',
                'created_at' => now(),
            ]);

            AuditLog::record(
                eventType: 'auth.failed',
                description: "Failed login attempt for email [{$email}]",
                userId: $user ? $user->id : null,
                severity: 'warning',
                payload: ['ip' => $ip, 'user_agent' => $userAgent]
            );

            if ($user) {
                $user->recordFailedLogin(maxAttempts: 5, lockoutMinutes: 15);
            }

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // 4. Reset rate limiter and failed attempts on success
        RateLimiter::clear($this->throttleKey());
        $user->resetFailedLogins($ip);

        // Record successful telemetry
        LoginAttempt::create([
            'email_or_username' => $email,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'is_successful' => true,
            'created_at' => now(),
        ]);

        AuditLog::record(
            eventType: 'auth.login',
            description: "User [{$user->email}] successfully authenticated.",
            userId: $user->id,
            severity: 'info',
            payload: ['ip' => $ip, 'user_agent' => $userAgent]
        );

        return $user;
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        AuditLog::record(
            eventType: 'auth.rate_limited',
            description: "Rate limit triggered for throttle key [{$this->throttleKey()}]. Blocked for {$seconds} seconds.",
            severity: 'notice',
            payload: ['ip' => $this->ip(), 'seconds_remaining' => $seconds]
        );

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('email')) . '|' . $this->ip());
    }
}
