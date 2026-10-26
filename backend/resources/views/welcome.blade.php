<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full bg-slate-950 text-slate-100">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MediVault - Hospital Management & Clinical EHR Platform</title>
    
    <!-- Tailwind CSS CDN & Alpine.js -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        hospital: {
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
        .glass-card {
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
    </style>
</head>
<body class="min-h-full font-sans antialiased selection:bg-cyan-500 selection:text-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.2),rgba(255,255,255,0))]">
    
    <!-- Top Navigation -->
    <header class="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex h-20 items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="h-11 w-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20">
                        <div class="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl">
                            🏥
                        </div>
                    </div>
                    <div>
                        <span class="text-xl font-black tracking-tight text-white block">Medi<span class="text-cyan-400">Vault</span></span>
                        <span class="text-[10px] uppercase font-bold tracking-widest text-cyan-400 block">Hospital Management & EHR</span>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <a href="{{ route('login') }}" class="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:from-cyan-500 hover:to-teal-400 transition-all flex items-center gap-2">
                        <span>Staff Portal Login</span>
                        <span>&rarr;</span>
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div class="text-center max-w-3xl mx-auto">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6">
                <span>🏥</span>
                <span>Hospital Management System & Clinical EHR Platform</span>
            </div>
            
            <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                Hospital Clinical EHR. <br>
                <span class="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                    Streamlined In-Patient & Clinical Care.
                </span>
            </h1>
            
            <p class="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed">
                Comprehensive healthcare management platform delivering patient admissions, ward bed logistics, clinical consultations, bedside nursing observations, and digital pharmacy dispensary management.
            </p>

            <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="{{ route('login') }}" class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 hover:from-cyan-500 hover:to-teal-400 transition-all flex items-center justify-center gap-2">
                    <span>Enter Hospital Staff Portal</span>
                    <span>&rarr;</span>
                </a>
            </div>
        </div>

        <!-- 6 Role Feature Cards -->
        <div class="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Card 1 -->
            <div class="glass-card p-6 rounded-2xl border border-slate-800">
                <div class="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-xl mb-4">
                    👑
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Chief Medical Director</h3>
                <p class="text-xs text-purple-300 font-medium mb-3">Executive Administration</p>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Overall hospital governance, medical personnel administration, institutional configuration snapshots, and operational oversight.
                </p>
            </div>

            <!-- Card 2 -->
            <div class="glass-card p-6 rounded-2xl border border-slate-800">
                <div class="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-xl mb-4">
                    📋
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Hospital Operations Manager</h3>
                <p class="text-xs text-emerald-300 font-medium mb-3">Practice Administration</p>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Patient admissions, ward and bed capacity allocation, clinical directory oversight, and staff scheduling.
                </p>
            </div>

            <!-- Card 3 -->
            <div class="glass-card p-6 rounded-2xl border border-slate-800">
                <div class="h-10 w-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-xl mb-4">
                    🩺
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Attending Physician</h3>
                <p class="text-xs text-cyan-300 font-medium mb-3">Clinical Doctor Role</p>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Patient examination, diagnosis recording, clinical treatment plan formulation, and pharmaceutical prescriptions.
                </p>
            </div>

            <!-- Card 4 -->
            <div class="glass-card p-6 rounded-2xl border border-slate-800">
                <div class="h-10 w-10 rounded-xl bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-xl mb-4">
                    💉
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Ward Nurse</h3>
                <p class="text-xs text-pink-300 font-medium mb-3">In-Patient Care</p>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Continuous vital signs tracking (BP, Pulse, Temperature, SpO2), medication administration records, and patient monitoring.
                </p>
            </div>

            <!-- Card 5 -->
            <div class="glass-card p-6 rounded-2xl border border-slate-800">
                <div class="h-10 w-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-xl mb-4">
                    💊
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Hospital Pharmacist</h3>
                <p class="text-xs text-amber-300 font-medium mb-3">Pharmacy & Dispensary</p>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Prescription verification, pharmaceutical drug dispensing, dosage validation, and medication inventory controls.
                </p>
            </div>

            <!-- Card 6 -->
            <div class="glass-card p-6 rounded-2xl border border-slate-800">
                <div class="h-10 w-10 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-xl mb-4">
                    🔍
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Quality & Records Auditor</h3>
                <p class="text-xs text-blue-300 font-medium mb-3">Regulatory Compliance Oversight</p>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Clinical record verification, historical admissions audit trails, archived patient restoration, and healthcare compliance reviews.
                </p>
            </div>
        </div>

        <!-- Enterprise Highlights -->
        <div class="mt-16 glass-card p-8 rounded-2xl border border-cyan-500/20">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                    <div class="text-3xl font-black text-cyan-400">52+</div>
                    <div class="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Active Wards & Beds</div>
                </div>
                <div>
                    <div class="text-3xl font-black text-teal-400">6 Roles</div>
                    <div class="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Hospital Governance</div>
                </div>
                <div>
                    <div class="text-3xl font-black text-emerald-400">24/7</div>
                    <div class="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Ward & Emergency Care</div>
                </div>
                <div>
                    <div class="text-3xl font-black text-purple-400">100%</div>
                    <div class="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Digital Health Records</div>
                </div>
            </div>
        </div>
    </main>
</body>
</html>
