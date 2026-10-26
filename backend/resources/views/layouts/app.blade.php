<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full bg-slate-950 text-slate-100">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Clinical Station' }} - MediVault Hospital Management & EHR</title>
    
    <!-- Tailwind CSS CDN & Alpine.js -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script src="/js/webauthn.js"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        dental: {
                            50: '#ecfeff',
                            100: '#cffafe',
                            400: '#22d3ee',
                            500: '#06b6d4',
                            600: '#0891b2',
                            700: '#0e7490',
                            800: '#155e75',
                            900: '#164e63',
                            950: '#083344',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        [x-cloak] { display: none !important; }
        .glass-card {
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .stat-card {
            background: radial-gradient(circle at top left, rgba(6, 182, 212, 0.12), transparent 70%), rgba(15, 23, 42, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
    </style>
</head>
<body class="h-full font-sans antialiased selection:bg-cyan-500 selection:text-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.12),rgba(255,255,255,0))] flex flex-col min-h-screen" x-data="{ showProfileModal: false }">
    
    <!-- Top Hospital Navbar -->
    <header class="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex h-16 items-center justify-between">
                <!-- Logo & Brand -->
                <div class="flex items-center gap-8">
                    <a href="{{ route('dashboard') }}" class="flex items-center gap-3 group">
                        <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                            <div class="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center text-lg">
                                🏥
                            </div>
                        </div>
                        <div>
                            <span class="text-lg font-black tracking-tight text-white block">Medi<span class="text-cyan-400">Vault</span></span>
                            <span class="text-[9px] uppercase font-bold tracking-widest text-cyan-500 block">Hospital Management & EHR</span>
                        </div>
                    </a>

                    <!-- Navigation Links Based on Roles -->
                    <nav class="hidden md:flex items-center gap-1 text-sm font-medium">
                        <a href="{{ route('dashboard') }}" class="px-3 py-2 rounded-lg transition-colors {{ request()->routeIs('dashboard') ? 'bg-slate-800/80 text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-900' }}">
                            Hospital Station
                        </a>

                        @if(Auth::user()->hasRole(['Admin', 'SuperAdmin']))
                            <a href="{{ route('admin.dashboard') }}" class="px-3 py-2 rounded-lg transition-colors {{ request()->routeIs('admin.dashboard') ? 'bg-purple-950/60 border border-purple-500/30 text-purple-300 font-semibold' : 'text-slate-300 hover:text-purple-300 hover:bg-slate-900' }}">
                                Staff & Roles
                            </a>
                            <a href="{{ route('admin.backups') }}" class="px-3 py-2 rounded-lg transition-colors {{ request()->routeIs('admin.backups') ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-900' }}">
                                3-2-1 Backup Vault
                            </a>
                            <a href="{{ route('audit.dashboard') }}" class="px-3 py-2 rounded-lg transition-colors {{ request()->routeIs('audit.*') ? 'bg-amber-950/60 border border-amber-500/30 text-amber-300 font-semibold' : 'text-slate-300 hover:text-amber-300 hover:bg-slate-900' }}">
                                Security Audit Trail
                            </a>
                        @endif
                    </nav>
                </div>

                <!-- Right Side: User Profile & Security Badge -->
                <div class="flex items-center gap-3">
                    <!-- User Role Badge -->
                    @php
                        $userRole = Auth::user()->role ?? Auth::user()->roles->first()?->name ?? 'Doctor';
                        $primaryRole = $userRole;
                        $isChiefAdmin = in_array($userRole, ['Admin', 'Chief Administrator', 'SuperAdmin']);
                        $isManager = in_array($userRole, ['Manager', 'Hospital Operations Manager']);
                        $badgeColor = match($userRole) {
                            'Chief Administrator', 'Administrator', 'Admin', 'SuperAdmin' => 'bg-purple-950 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20',
                            'Manager', 'Hospital Operations Manager' => 'bg-emerald-950 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20',
                            'Doctor', 'Attending Physician' => 'bg-cyan-950 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20',
                            'Nurse', 'Ward Nurse' => 'bg-pink-950 text-pink-300 border-pink-500/40 shadow-sm shadow-pink-500/20',
                            'Pharmacist', 'Hospital Pharmacist' => 'bg-amber-950 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20',
                            'Auditor', 'Compliance Auditor' => 'bg-blue-950 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-500/20',
                            default => 'bg-cyan-950 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20',
                        };
                        $roleIcon = match($userRole) {
                            'Admin', 'Chief Administrator', 'SuperAdmin' => '👑',
                            'Manager', 'Hospital Operations Manager' => '📋',
                            'Doctor', 'Attending Physician' => '🩺',
                            'Nurse', 'Ward Nurse' => '💉',
                            'Pharmacist', 'Hospital Pharmacist' => '💊',
                            'Auditor', 'Compliance Auditor' => '🔍',
                            default => '🩺'
                        };
                    @endphp
                    <!-- Information Security Report Button (Admin Only) -->
                    @if($userRole === 'Admin')
                        <a href="{{ route('security.report.pdf') }}" target="_blank" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 shadow-sm transition-all" title="View Information Security Report in Browser">
                            <span>📄</span>
                            <span>Information Security Report</span>
                        </a>
                    @endif

                    <!-- User Role Badge -->
                    <span class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border {{ $badgeColor }}">
                        <span>{{ $roleIcon }}</span>
                        <span>{{ $userRole }}</span>
                    </span>

                    <!-- User Dropdown & Profile Actions -->
                    <div class="relative" x-data="{ open: false }">
                        <button @click="open = !open" class="flex items-center gap-2 rounded-xl bg-slate-900/90 border border-slate-800 p-1.5 pr-3 hover:border-slate-700 transition-colors">
                            <div class="h-7 w-7 rounded-lg {{ $isChiefAdmin ? 'bg-gradient-to-tr from-purple-600 to-amber-500 text-white' : ($isManager ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950' : 'bg-gradient-to-tr from-cyan-600 to-teal-500 text-slate-950') }} flex items-center justify-center font-bold text-xs">
                                {{ strtoupper(substr(Auth::user()->name, 0, 1)) }}
                            </div>
                            <span class="text-xs font-semibold text-slate-200 hidden sm:inline max-w-[140px] truncate">
                                {{ Auth::user()->name }}
                            </span>
                            <svg class="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <div x-show="open" @click.away="open = false" x-cloak
                            class="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 py-1.5 shadow-2xl z-50 text-xs text-slate-200 divide-y divide-slate-800">
                            <div class="px-3 py-2">
                                <div class="font-bold text-slate-100 truncate flex items-center gap-1.5">
                                    <span>{{ $roleIcon }}</span>
                                    <span>{{ Auth::user()->name }}</span>
                                </div>
                                <div class="text-[11px] text-slate-400 truncate">{{ Auth::user()->email }}</div>
                                <div class="text-[10px] mt-1 font-semibold text-cyan-400 uppercase tracking-wider">{{ $primaryRole }}</div>
                            </div>
                            <div class="py-1">
                                <button type="button" @click="showProfileModal = true; open = false;" class="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                                    <span>{{ $isChiefAdmin ? '✏️' : '🔒' }}</span>
                                    <span>{{ $isChiefAdmin ? 'Change Staff Names & Password' : 'Change Master Password' }}</span>
                                </button>
                                <a href="{{ route('two-factor.show') }}" class="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                                    <span>🛡️</span>
                                    <span>2FA Security Setup</span>
                                </a>
                            </div>
                            <div class="py-1">
                                <form method="POST" action="{{ route('logout') }}">
                                    @csrf
                                    <button type="submit" class="w-full text-left flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-950/30">
                                        <span>🚪</span>
                                        <span>Sign Out</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Global Flash Status / Error Messages -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
        @if (session('status'))
            <div class="rounded-xl bg-cyan-950/70 p-3.5 border border-cyan-500/30 text-cyan-200 text-xs flex items-center justify-between">
                <span>✅ {{ session('status') }}</span>
                <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white">&times;</button>
            </div>
        @endif

        @if (isset($errors) && $errors->any())
            <div class="rounded-xl bg-red-950/70 p-3.5 border border-red-500/30 text-red-200 text-xs">
                <ul class="list-disc list-inside space-y-0.5">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
    </div>

    <!-- Main Content Slot -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {{ $slot }}
    </main>

    <!-- Profile & Password Change Modal (Role-Guarded) -->
    <div x-show="showProfileModal" x-cloak class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div @click.away="showProfileModal = false" class="glass-card rounded-2xl p-6 border border-slate-800 max-w-lg w-full shadow-2xl text-xs space-y-6">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 class="font-bold text-white text-sm flex items-center gap-2">
                    <span>⚙️</span>
                    <span>Staff Account Security Settings</span>
                </h3>
                <button @click="showProfileModal = false" class="text-slate-400 hover:text-white text-base">&times;</button>
            </div>

            <!-- 1. Change Display Name (Chief Admin Only) -->
            @if($isChiefAdmin)
                <form method="POST" action="{{ route('profile.update-name') }}" class="space-y-3 p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30">
                    @csrf
                    <div class="flex items-center justify-between">
                        <span class="font-bold text-purple-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <span>👑</span> 1. Change Staff Username / Name (Chief Admin Access)
                        </span>
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-300 mb-1">Display Name</label>
                        <input type="text" name="name" value="{{ Auth::user()->name }}" required class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none">
                    </div>
                    <div class="flex justify-end">
                        <button type="submit" class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-bold">Update Username</button>
                    </div>
                </form>
            @else
                <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 space-y-1">
                    <div class="flex items-center gap-1.5 font-bold text-slate-300 text-xs">
                        <span>🔒</span>
                        <span>Staff Username Locked</span>
                    </div>
                    <p class="text-[11px] text-slate-400 leading-relaxed">
                        Your staff name is set to <strong class="text-white">{{ Auth::user()->name }}</strong> ({{ $primaryRole }}). Under clinical compliance policy, username and staff identity modifications are restricted to Chief Administrator <strong>Dr. Prof. Nathaniel Bentil</strong>.
                    </p>
                </div>
            @endif

            <div class="border-t border-slate-800 pt-4">
                <!-- 2. Change Email Address Form (All Staff Members) -->
                <form method="POST" action="{{ route('profile.update-email') }}" class="space-y-3 p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                    @csrf
                    <div class="font-bold text-cyan-200 uppercase tracking-wider text-[11px] flex items-center justify-between">
                        <span class="flex items-center gap-1.5">
                            <span>📧</span>
                            <span>Update Login Email Address</span>
                        </span>
                        <span class="text-[10px] text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">All Staff</span>
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-300 mb-1">New Email Address</label>
                        <input type="email" name="email" value="{{ Auth::user()->email }}" required class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-300 mb-1">Confirm Current Password (Security Check)</label>
                        <input type="password" name="current_password" required placeholder="••••••••••••" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none">
                    </div>
                    <div class="flex justify-end">
                        <button type="submit" class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-500 text-slate-950 font-bold hover:from-cyan-500 hover:to-teal-400 transition-all">Save New Email</button>
                    </div>
                </form>
            </div>

            <div class="border-t border-slate-800 pt-4" x-data="{
                bioRegName: 'Windows Hello / Touch Biometrics',
                bioRegLoading: false,
                bioRegError: '',
                bioRegSuccess: '',
                async registerBiometric() {
                    this.bioRegLoading = true;
                    this.bioRegError = '';
                    this.bioRegSuccess = '';
                    try {
                        const result = await window.DentiVaultBiometrics.register(this.bioRegName);
                        this.bioRegSuccess = result.message || 'Fingerprint sensor registered successfully!';
                        setTimeout(() => {
                            window.location.reload();
                        }, 1200);
                    } catch (err) {
                        console.error(err);
                        this.bioRegError = err.message || 'Failed to register biometric sensor. Ensure your device supports Windows Hello or Touch ID.';
                    } finally {
                        this.bioRegLoading = false;
                    }
                }
            }">
                <div class="font-bold text-cyan-300 uppercase tracking-wider text-[11px] flex items-center justify-between mb-3">
                    <span class="flex items-center gap-1.5">
                        <span>👆</span>
                        <span>Biometric Hardware Keys & Fingerprint (WebAuthn / FIDO2)</span>
                    </span>
                    <span class="text-[10px] text-purple-400 font-semibold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">Windows Hello / Touch ID</span>
                </div>

                <!-- Existing Registered Keys -->
                @php
                    $credentials = Auth::user()->biometricCredentials;
                @endphp
                @if($credentials->count() > 0)
                    <div class="space-y-2 mb-3">
                        @foreach($credentials as $cred)
                            <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                                <div class="flex items-center gap-2.5">
                                    <div class="h-7 w-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-xs text-cyan-300">
                                        👆
                                    </div>
                                    <div>
                                        <div class="font-bold text-white text-xs">{{ $cred->name }}</div>
                                        <div class="text-[10px] text-slate-400">
                                            Added {{ $cred->created_at->format('M d, Y') }} • Used {{ $cred->sign_count }} time(s)
                                        </div>
                                    </div>
                                </div>
                                <form method="POST" action="{{ route('biometric.destroy', $cred->id) }}" onsubmit="return confirm('Revoke this biometric fingerprint?');">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="px-2 py-1 rounded-lg bg-red-950/70 hover:bg-red-900/80 border border-red-500/30 text-red-300 text-[10px] font-bold transition-all">
                                        🗑️ Revoke
                                    </button>
                                </form>
                            </div>
                        @endforeach
                    </div>
                @else
                    <p class="text-[11px] text-slate-400 mb-3">
                        No biometric keys linked yet. Register your device fingerprint to enable 1-touch passwordless sign-in!
                    </p>
                @endif

                <!-- Register New Key Section -->
                <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                    <div>
                        <label class="block font-semibold text-slate-300 mb-1 text-[11px]">Sensor Device Name</label>
                        <input type="text" x-model="bioRegName" placeholder="e.g. Clinic Laptop Windows Hello" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none">
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <span class="text-[10px] text-slate-500">TPM 2.0 / Secure Enclave Protected</span>
                        <button type="button" @click="registerBiometric()" :disabled="bioRegLoading"
                            class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/30">
                            <span x-show="!bioRegLoading">👆 Link Fingerprint</span>
                            <span x-show="bioRegLoading" x-cloak class="flex items-center gap-1">
                                <svg class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Touch Sensor Now...</span>
                            </span>
                        </button>
                    </div>

                    <div x-show="bioRegError" x-cloak class="p-2 rounded-lg bg-red-950/70 border border-red-500/40 text-[11px] text-red-300">
                        <span x-text="bioRegError"></span>
                    </div>

                    <div x-show="bioRegSuccess" x-cloak class="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[11px] text-emerald-300 font-bold">
                        <span x-text="bioRegSuccess"></span>
                    </div>
                </div>
            </div>

            <div class="border-t border-slate-800 pt-4">
                <!-- 3. Change Password Form (All Staff Members) -->
                <form method="POST" action="{{ route('profile.update-password') }}" class="space-y-3">
                    @csrf
                    <div class="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <span>🔑</span>
                        <span>Change Account Password</span>
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-400 mb-1">Current Password</label>
                        <input type="password" name="current_password" required placeholder="••••••••••••" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-400 mb-1">New Password (Min 12 characters, NIST Compliant)</label>
                        <input type="password" name="password" required placeholder="••••••••••••" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-400 mb-1">Confirm New Password</label>
                        <input type="password" name="password_confirmation" required placeholder="••••••••••••" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none">
                    </div>
                    <div class="flex justify-end">
                        <button type="submit" class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-500 text-slate-950 font-bold">Save New Password</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
