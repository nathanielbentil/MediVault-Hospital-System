<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use App\Services\PasswordService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): View
    {
        return view('auth.register');
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(RegisterRequest $request): RedirectResponse|JsonResponse
    {
        // 1. Hash password with Pepper + Argon2id
        $hashResult = PasswordService::hash($request->password);

        // 2. Resolve default clinical practitioner role
        $dentistRole = Role::where('slug', 'Doctor')->orWhere('slug', 'Dentist')->orWhere('slug', 'User')->first();

        // 3. Create user with active status, salt, and verified email
        $user = User::create([
            'name' => $request->name,
            'email' => strtolower(trim($request->email)),
            'role' => $dentistRole?->name ?? 'Doctor',
            'password' => $hashResult['hash'],
            'salt' => $hashResult['salt'],
            'pepper_version' => $hashResult['pepper_version'],
            'status' => 'active',
            'email_verified_at' => now(),
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
            'password_changed_at' => now(),
        ]);

        if ($dentistRole) {
            $user->roles()->attach($dentistRole->id, ['created_at' => now()]);
        }

        // 4. Record Audit Log
        AuditLog::record(
            eventType: 'auth.registered',
            description: "New clinical staff account registered for [{$user->email}] with role [{$dentistRole?->name}].",
            userId: $user->id,
            severity: 'notice',
            payload: ['ip' => $request->ip(), 'role' => $dentistRole?->name, 'pepper_version' => $hashResult['pepper_version']]
        );

        // 5. Fire Laravel Registered event (triggers email verification link)
        event(new Registered($user));

        // 6. Log user in with fresh session
        Auth::login($user);
        $request->session()->regenerate();

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Registration successful.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ], 201);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
