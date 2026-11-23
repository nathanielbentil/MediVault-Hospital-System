<x-app-layout :title="'Database Table Schema & Records Inspector'">
    <div class="space-y-6">

        <!-- Header & Breadcrumb -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
            <div class="flex items-center gap-3">
                <a href="{{ route('dashboard') }}" class="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2">
                    <span>←</span>
                    <span>Return to Dashboard</span>
                </a>
                <span class="text-slate-600">/</span>
                <span class="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    PostgreSQL Database Schema & Records Explorer
                </span>
            </div>
            <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono text-xs flex items-center gap-1.5 font-bold">
                    <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>PostgreSQL 16 • AWS Cloud Connected</span>
                </span>
            </div>
        </div>

        <!-- Database Engine Metadata Card -->
        <div class="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/80 shadow-xl space-y-4">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-2xl">🐘</span>
                        <h1 class="text-xl sm:text-2xl font-black text-white">
                            PostgreSQL Database Inspector: <code class="text-cyan-400 font-mono text-lg">public.users</code>
                        </h1>
                    </div>
                    <p class="text-xs text-slate-400">
                        Live inspection of database table structure, cryptographic Argon2id password hashes, per-user salts, HMAC pepper versions, and soft-delete retention records.
                    </p>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span class="text-[10px] text-slate-500 uppercase block">Database</span>
                        <span class="text-white font-bold">postgres</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span class="text-[10px] text-slate-500 uppercase block">Host / Region</span>
                        <span class="text-cyan-400 font-bold">AWS eu-west-2</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span class="text-[10px] text-slate-500 uppercase block">Port</span>
                        <span class="text-white font-bold">6543 (Pooler)</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span class="text-[10px] text-slate-500 uppercase block">Total Rows</span>
                        <span class="text-emerald-400 font-bold">{{ $users->count() }} Records</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- SECTION 1: Table Structure / Schema Definition -->
        <div class="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-lg space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <div class="flex items-center gap-2">
                    <span class="text-lg">📐</span>
                    <h2 class="text-sm font-bold text-white uppercase tracking-wider">
                        Table Schema & Column Definitions (<code class="text-cyan-400 text-xs">information_schema.columns</code>)
                    </h2>
                </div>
                <span class="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                    Target Table: users
                </span>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-800">
                <table class="w-full text-left text-xs">
                    <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                        <tr>
                            <th class="p-3">#</th>
                            <th class="p-3">Column Name</th>
                            <th class="p-3">Data Type</th>
                            <th class="p-3">Max Length</th>
                            <th class="p-3">Nullable</th>
                            <th class="p-3">Default Value</th>
                            <th class="p-3">Information Security Purpose</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                        @foreach($columns as $idx => $col)
                            @php
                                $purpose = match($col->column_name) {
                                    'id' => 'Primary Key Identifier (bigserial)',
                                    'name' => 'Full Personnel Legal Name',
                                    'email' => 'Unique User Login Identifier (Indexed)',
                                    'role' => 'Role-Based Access Control (Admin, MD, Doctor, Nurse, Pharmacist, Auditor)',
                                    'password' => 'Argon2id Cryptographic Password Hash (Memory: 64MB, Time: 4, Threads: 2)',
                                    'salt' => 'Unique Per-User Cryptographic Salt (22-char Base64, prevents rainbow tables)',
                                    'pepper_version' => 'Server-Side Pepper Key Identifier (HMAC-SHA256 from .env)',
                                    'status' => 'Account Status Constraint (active, suspended, locked)',
                                    'two_factor_secret' => 'RFC 6238 TOTP Two-Factor Authentication Secret',
                                    'failed_login_attempts' => 'Brute-Force Lockout Defense Counter',
                                    'lockout_until' => 'Account Lockout Expiration Timestamp',
                                    'deleted_at' => 'Soft-Delete Timestamp (Ensures records are never lost forever)',
                                    'created_at', 'updated_at' => 'Immutable System Audit Timestamps',
                                    default => 'Standard Hospital EHR Data Field'
                                };
                                $isSecurity = in_array($col->column_name, ['password', 'salt', 'pepper_version', 'deleted_at', 'two_factor_secret', 'role']);
                            @endphp
                            <tr class="hover:bg-slate-900/60 {{ $isSecurity ? 'bg-cyan-950/10' : '' }}">
                                <td class="p-3 text-slate-500 font-bold">{{ $idx + 1 }}</td>
                                <td class="p-3 font-bold {{ $isSecurity ? 'text-cyan-300' : 'text-white' }}">
                                    {{ $col->column_name }}
                                    @if($col->column_name === 'password')
                                        <span class="text-[9px] px-1.5 py-0.2 bg-purple-950 text-purple-300 rounded border border-purple-800 ml-1">Hash</span>
                                    @elseif($col->column_name === 'salt')
                                        <span class="text-[9px] px-1.5 py-0.2 bg-cyan-950 text-cyan-300 rounded border border-cyan-800 ml-1">Salt</span>
                                    @elseif($col->column_name === 'pepper_version')
                                        <span class="text-[9px] px-1.5 py-0.2 bg-amber-950 text-amber-300 rounded border border-amber-800 ml-1">Pepper</span>
                                    @elseif($col->column_name === 'deleted_at')
                                        <span class="text-[9px] px-1.5 py-0.2 bg-rose-950 text-rose-300 rounded border border-rose-800 ml-1">Soft-Delete</span>
                                    @endif
                                </td>
                                <td class="p-3 text-yellow-300 font-semibold">{{ $col->data_type }}</td>
                                <td class="p-3 text-slate-400">{{ $col->character_maximum_length ?? 'N/A' }}</td>
                                <td class="p-3">
                                    @if($col->is_nullable === 'NO')
                                        <span class="text-rose-400 font-bold">NOT NULL</span>
                                    @else
                                        <span class="text-slate-500">NULLABLE</span>
                                    @endif
                                </td>
                                <td class="p-3 text-slate-400 truncate max-w-[150px]">{{ $col->column_default ?? 'None' }}</td>
                                <td class="p-3 text-slate-300 font-sans text-xs">{{ $purpose }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>

        <!-- SECTION 2: Live Records Query View -->
        <div class="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-lg space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <div class="flex items-center gap-2">
                    <span class="text-lg">🗄️</span>
                    <h2 class="text-sm font-bold text-white uppercase tracking-wider">
                        Live Database Records (<code class="text-emerald-400 text-xs">SELECT id, role, email, password, salt, pepper_version, status, deleted_at FROM users;</code>)
                    </h2>
                </div>
                <span class="text-[11px] font-mono text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                    {{ $users->count() }} Live Rows Returned
                </span>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-800">
                <table class="w-full text-left text-xs font-mono">
                    <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                        <tr>
                            <th class="p-3">id</th>
                            <th class="p-3">role</th>
                            <th class="p-3">email</th>
                            <th class="p-3">password (Argon2id Hash)</th>
                            <th class="p-3">salt (In Database)</th>
                            <th class="p-3">pepper</th>
                            <th class="p-3">status</th>
                            <th class="p-3">deleted_at (Audit Archive)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                        @foreach($users as $u)
                            @php
                                $roleBadge = match($u->role) {
                                    'Admin' => 'text-purple-300 bg-purple-950/60 border-purple-800',
                                    'Manager' => 'text-emerald-300 bg-emerald-950/60 border-emerald-800',
                                    'Doctor' => 'text-cyan-300 bg-cyan-950/60 border-cyan-800',
                                    'Nurse' => 'text-pink-300 bg-pink-950/60 border-pink-800',
                                    'Pharmacist' => 'text-amber-300 bg-amber-950/60 border-amber-800',
                                    'Auditor' => 'text-blue-300 bg-blue-950/60 border-blue-800',
                                    default => 'text-slate-300 bg-slate-900 border-slate-700'
                                };
                            @endphp
                            <tr class="hover:bg-slate-900/70 {{ $u->trashed() ? 'bg-rose-950/15' : '' }}">
                                <td class="p-3 text-slate-400 font-bold">{{ $u->id }}</td>
                                <td class="p-3">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold border {{ $roleBadge }}">
                                        {{ $u->role }}
                                    </span>
                                </td>
                                <td class="p-3 text-cyan-300 font-semibold">{{ $u->email }}</td>
                                <td class="p-3 text-slate-300">
                                    <div class="bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate max-w-[280px]" title="{{ $u->password }}">
                                        {{ $u->password }}
                                    </div>
                                </td>
                                <td class="p-3">
                                    <span class="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-400 font-bold">
                                        {{ $u->salt ?? 'None' }}
                                    </span>
                                </td>
                                <td class="p-3">
                                    <span class="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                                        {{ $u->pepper_version ?? 'v1' }}
                                    </span>
                                </td>
                                <td class="p-3">
                                    @if($u->status === 'active')
                                        <span class="text-emerald-400 font-bold">active</span>
                                    @elseif($u->status === 'suspended')
                                        <span class="text-rose-400 font-bold">suspended</span>
                                    @else
                                        <span class="text-yellow-400 font-bold">{{ $u->status }}</span>
                                    @endif
                                </td>
                                <td class="p-3">
                                    @if($u->trashed())
                                        <span class="text-rose-300 font-bold bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800">
                                            {{ $u->deleted_at->format('Y-m-d H:i:s') }}
                                        </span>
                                    @else
                                        <span class="text-slate-600 font-bold">NULL (Active)</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>

        <!-- SECTION 3: Terminal Command for psql & pgAdmin -->
        <div class="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-lg space-y-3">
            <div class="flex items-center gap-2 border-b border-slate-800 pb-3">
                <span class="text-lg">💻</span>
                <h2 class="text-sm font-bold text-white uppercase tracking-wider">
                    Direct Terminal / pgAdmin Command Reference
                </h2>
            </div>
            <p class="text-xs text-slate-400">
                If your teachers also want to see the command prompt output in Windows PowerShell or pgAdmin 4 Query Tool:
            </p>
            <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                <div class="text-slate-500 mb-1"># Command Prompt / PowerShell:</div>
                <code>$env:PGPASSWORD='your_db_password'; psql -h your_db_host -p 5432 -U your_db_user -d postgres -c "SELECT id, role, email, SUBSTRING(password FROM 1 FOR 30) || '...' AS password_hash, salt, pepper_version, status, deleted_at FROM users ORDER BY id;"</code>
            </div>
        </div>

    </div>
</x-app-layout>
