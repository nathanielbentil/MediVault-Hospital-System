<?php

namespace App\Services;

class PasswordService
{
    /**
     * Hash a raw password using HMAC Pepper + Argon2id.
     */
    public static function hash(string $plainPassword, ?string $pepperVersion = null): array
    {
        $version = $pepperVersion ?? config('security.pepper.current_version', 'v1');
        $pepper = config("security.pepper.versions.{$version}", '');

        if (empty($pepper)) {
            $pepper = env('PEPPER_V1', '58ccdb65b61dfa1586e00d6cf4268f24d09d0c4ad69e7cfb555184c3fc02f91e');
        }

        // Layer 1: Apply server-side HMAC Pepper (256-bit entropy)
        $peppered = hash_hmac('sha256', $plainPassword, $pepper);

        // Layer 2: Argon2id Memory-Hard Hashing with OWASP Parameters
        $options = [
            'memory_cost' => (int) config('security.argon2id.memory', 65536),
            'time_cost' => (int) config('security.argon2id.time', 4),
            'threads' => (int) config('security.argon2id.threads', 2),
        ];

        $hash = password_hash($peppered, PASSWORD_ARGON2ID, $options);
        $salt = self::extractSalt($hash);

        return [
            'hash' => $hash,
            'salt' => $salt,
            'pepper_version' => $version,
        ];
    }

    /**
     * Extract the explicit cryptographic salt from an Argon2id Modular Crypt Format string.
     */
    public static function extractSalt(string $hash): string
    {
        $parts = explode('$', $hash);
        // In $argon2id$v=19$m=65536,t=4,p=2$SALT$HASH
        return isset($parts[4]) ? $parts[4] : substr(hash('sha256', $hash), 0, 22);
    }

    /**
     * Verify a plain password against an existing hash and pepper version.
     */
    public static function verify(string $plainPassword, string $hash, string $pepperVersion = 'v1'): bool
    {
        $pepper = config("security.pepper.versions.{$pepperVersion}", '');

        if (empty($pepper)) {
            $pepper = env('PEPPER_V1', '58ccdb65b61dfa1586e00d6cf4268f24d09d0c4ad69e7cfb555184c3fc02f91e');
        }

        // 1. Standard HMAC Pepper + Argon2id
        $peppered = hash_hmac('sha256', $plainPassword, $pepper);
        if (password_verify($peppered, $hash)) {
            return true;
        }

        // 2. Direct Argon2id check (if hash was created without pepper)
        if (password_verify($plainPassword, $hash)) {
            return true;
        }

        // 3. Tolerant check for accidental leading/trailing whitespace
        $trimmed = trim($plainPassword);
        if ($trimmed !== $plainPassword) {
            $trimmedPeppered = hash_hmac('sha256', $trimmed, $pepper);
            if (password_verify($trimmedPeppered, $hash) || password_verify($trimmed, $hash)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a password hash needs rehashing (e.g. if algorithm parameters or pepper version changed).
     */
    public static function needsRehash(string $hash, string $userPepperVersion): bool
    {
        $currentVersion = config('security.pepper.current_version', 'v1');
        if ($userPepperVersion !== $currentVersion) {
            return true; // Pepper was rotated; rehash needed on next login
        }

        $options = [
            'memory_cost' => (int) config('security.argon2id.memory', 65536),
            'time_cost' => (int) config('security.argon2id.time', 4),
            'threads' => (int) config('security.argon2id.threads', 2),
        ];

        return password_needs_rehash($hash, PASSWORD_ARGON2ID, $options);
    }
}
