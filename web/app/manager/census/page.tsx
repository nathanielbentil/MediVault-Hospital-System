'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  BedDouble,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCircle,
  LogOut,
  Sparkles,
  Users,
  Activity,
  BarChart3,
  Stethoscope,
  Pill,
  Shield,
  Layers,
  ChevronRight,
  RefreshCw,
  Heart,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface Patient {
  id: number;
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  ward_room: string;
  admission_status: string;
  diagnosis: string;
  attending_doctor: string;
  assigned_nurse: string;
}

interface WardData {
  name: string;
  occupied: number;
  capacity: number;
  status: 'OPTIMAL' | 'ELEVATED' | 'CRITICAL';
  color: string;
}

export default function ManagerCensusPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Hospital Ward Allocation Status
  const [wards, setWards] = useState<WardData[]>([
    { name: 'General Medical Ward (Floor 2)', occupied: 38, capacity: 45, status: 'ELEVATED', color: 'blue' },
    { name: 'Surgical Post-Op Ward (Floor 3)', occupied: 22, capacity: 24, status: 'ELEVATED', color: 'amber' },
    { name: 'Intensive Care Unit - ICU (Floor 4)', occupied: 9, capacity: 10, status: 'CRITICAL', color: 'rose' },
    { name: 'Pediatric Care Unit (Floor 1)', occupied: 18, capacity: 25, status: 'OPTIMAL', color: 'emerald' },
    { name: 'Trauma & Emergency Resus (Ground)', occupied: 14, capacity: 15, status: 'CRITICAL', color: 'rose' },
  ]);

  useEffect(() => {
    fetch('/api/auth/user')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) {
          const role = (d.user.role || '').toLowerCase();
          if (role !== 'manager' && role !== 'admin') {
            router.push('/');
            return;
          }
          setUser(d.user);
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));

    fetch('/api/patients')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.patients)) {
          setPatients(d.patients);
        }
      })
      .catch(() => {});

    fetchWorkerUpdates();
  }, [router]);

  const [workerUpdates, setWorkerUpdates] = useState<any[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  const fetchWorkerUpdates = () => {
    setLoadingUpdates(true);
    fetch('/api/admin/audit?limit=20')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.logs)) {
          setWorkerUpdates(d.logs);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUpdates(false));
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const handleActivateSurgeCapacity = () => {
    setWards((prev) =>
      prev.map((w) =>
        w.name.includes('ICU')
          ? { ...w, capacity: w.capacity + 4, status: 'OPTIMAL' }
          : w.name.includes('Emergency')
          ? { ...w, capacity: w.capacity + 6, status: 'OPTIMAL' }
          : w
      )
    );
    triggerToast('Surge Buffer Capacity Activated: +10 emergency beds unlocked across ICU & ER.');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/');
  };

  const totalOccupied = wards.reduce((sum, w) => sum + w.occupied, 0);
  const totalCapacity = wards.reduce((sum, w) => sum + w.capacity, 0);
  const overallPercentage = Math.round((totalOccupied / totalCapacity) * 100);

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.patient_code.toLowerCase().includes(q) ||
      p.ward_room.toLowerCase().includes(q) ||
      p.diagnosis.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-400">
        <div className="flex flex-col items-center gap-3">
          <Building2 className="h-8 w-8 animate-spin" />
          <span className="text-sm font-mono tracking-wider">Accessing Hospital Operations Census...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-slate-900 border border-blue-400 text-white text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Top Header Navigation Bar ── */}
      <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2 group cursor-pointer shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-blue-400 group-hover:-translate-x-1 transition-transform" />
              <span>Return to Main Console</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-base shadow-md">
                <Building2 className="h-4 w-4 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-base">Medi<span className="text-blue-400">Vault</span></span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-blue-500/40 bg-blue-950 text-blue-300 font-mono font-bold">
                    Executive Directorship
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden md:block">
                  Hospital Census, Resource Allocation & Medical Operations Command
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300">
              <UserCircle className="h-4 w-4 text-blue-400" />
              <span className="font-bold">{user?.name || 'Dr. Bright Ainoo (MD)'}</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] text-blue-300 font-mono">Operations Live</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/40 hover:text-rose-400 text-slate-400 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Workstation Clearance Banner ── */}
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950/40 p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full border border-blue-500/40 bg-blue-950 text-blue-300">
                Hospital Operations Command
              </span>
              <span className="text-[10px] text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-500/30 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse inline-block mr-1.5" /> Live Census Telemetry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Hospital Ward Bed Census & Capacity Allocation
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Medical Director: <strong className="text-blue-300">{user?.name || 'Dr. Bright Ainoo (MD)'}</strong> | Real-time bed occupancy monitoring, clinical department resource routing, and emergency surge capacity control.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
            <button
              onClick={() => triggerToast('Clinical roster generated: 21 personnel confirmed on duty.')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-400 text-blue-300 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Users className="h-4 w-4" />
              <span>Shift Roster Review</span>
            </button>
            <button
              onClick={handleActivateSurgeCapacity}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              <span>Unlock Emergency Surge Beds</span>
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-blue-500/20 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Occupancy</span>
              <BedDouble className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-300 mt-2">{totalOccupied} / {totalCapacity}</div>
            <div className="text-[11px] text-blue-400/80 mt-0.5">{overallPercentage}% Overall Capacity</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ICU Status</span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-2">90% Full</div>
            <div className="text-[11px] text-rose-400/80 mt-0.5">1 Critical Bed Available</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attending Physicians</span>
              <Stethoscope className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400 mt-2">7 On Duty</div>
            <div className="text-[11px] text-cyan-400/80 mt-0.5">Round Commenced</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Turnaround Time</span>
              <Clock className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">32 Mins</div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">Bed Sanitization Cycle</div>
          </div>
        </div>

        {/* ── Ward Capacity Visual Progress Bars ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Ward Occupancy & Bed Census Matrix</h2>
              <p className="text-[11px] text-slate-400">Real-time floor census and surge pressure tracking</p>
            </div>
            <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">Dynamic Census</span>
          </div>

          <div className="space-y-4">
            {wards.map((ward, idx) => {
              const pct = Math.round((ward.occupied / ward.capacity) * 100);
              const isHigh = pct >= 90;

              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{ward.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isHigh
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {ward.status}
                      </span>
                    </div>
                    <div className="font-mono text-slate-300">
                      <strong>{ward.occupied}</strong> / {ward.capacity} Beds ({pct}%)
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? 'bg-rose-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Active In-Patient Allocation Table ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Active In-Patient Ward Directory</h2>
              <p className="text-[11px] text-slate-400">Current bed placements and clinical care team assignments</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, bed, or doctor..."
                className="w-64 pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold z-10">
                <tr>
                  <th className="py-2.5 px-3">Patient Code</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Ward / Bed</th>
                  <th className="py-2.5 px-3">Diagnosis</th>
                  <th className="py-2.5 px-3">Attending Physician</th>
                  <th className="py-2.5 px-3">Assigned Nurse</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/50">
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">{p.patient_code}</td>
                    <td className="py-3 px-3 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-200">
                        {p.ward_room}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{p.diagnosis}</td>
                    <td className="py-3 px-3 text-slate-200">{p.attending_doctor || 'Dr. Judah Owusu-Ansah'}</td>
                    <td className="py-3 px-3 text-slate-200">{p.assigned_nurse || 'Staff Nurse Beatrice'}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        ADMITTED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Clinical Worker Shift Intelligence & Cross-Department Handover ── */}
        <div className="rounded-2xl border border-blue-500/30 bg-slate-900/60 p-5 space-y-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-300">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">Clinical Worker Shift Intelligence & Department Handover</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-blue-950 text-blue-300 border border-blue-500/30">
                    MD Operational Control
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Aggregated telemetry from Attending Physicians, Shift Nurses, and Central Pharmacy
                </p>
              </div>
            </div>

            <button
              onClick={fetchWorkerUpdates}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-bold transition-all cursor-pointer border border-slate-700 hover:border-blue-400 self-start md:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingUpdates ? 'animate-spin' : ''}`} />
              <span>Refresh Worker Feed</span>
            </button>
          </div>

          {/* Departmental Intelligence Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Physicians Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4" />
                  <span>Attending Physicians</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-[10px] border border-cyan-800">4 Active</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Dr. Judah:</span>
                  <span className="font-bold text-cyan-400">14 Ward In-Patients</span>
                </div>
                <div className="flex justify-between">
                  <span>Dr. Isaac Donkoh:</span>
                  <span className="font-bold text-cyan-400">22 Ward In-Patients</span>
                </div>
                <div className="flex justify-between">
                  <span>Dr. Kofi Mensah:</span>
                  <span className="font-bold text-cyan-400">18 Ward In-Patients</span>
                </div>
                <div className="flex justify-between">
                  <span>Dr. Akua Boateng:</span>
                  <span className="font-bold text-cyan-400">12 Ward In-Patients</span>
                </div>
              </div>
            </div>

            {/* Shift Nurses Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-pink-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-pink-300">
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" />
                  <span>Bedside Nursing & MAR</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-pink-950 text-[10px] border border-pink-800">5 RNs on Duty</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1.5 pt-1">
                <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>MEWS Alert:</strong> Bed 02 (ICU) - Tachycardia recorded (HR 108 bpm). Attending Doctor alerted.
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Charge Nurse Beatrice Mensah: 100% hourly vitals completed across General & Post-Op floors.
                </div>
              </div>
            </div>

            {/* Central Pharmacy Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Pill className="h-4 w-4" />
                  <span>Dispensary & Controlled Vault</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-[10px] border border-amber-800">Reconciled</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Head Pharmacist:</span>
                  <span className="font-bold text-amber-400">Pharm. Kwame Mensah</span>
                </div>
                <div className="flex justify-between">
                  <span>Controlled Vault:</span>
                  <span className="font-bold text-emerald-400">Schedule II 100% Balanced</span>
                </div>
                <div className="flex justify-between">
                  <span>Formulary Queue:</span>
                  <span className="font-bold text-slate-200">24 Fulfillments Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Clinical Worker Submissions Stream */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                <span>Recent Clinical Worker Actions & Intake Submissions</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Auto-synced with AWS PostgreSQL</span>
            </div>

            <div className="overflow-x-auto max-h-[300px] rounded-xl border border-slate-800/80">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold z-10">
                  <tr>
                    <th className="py-2 px-3">Worker / Officer</th>
                    <th className="py-2 px-3">Clinical Action</th>
                    <th className="py-2 px-3">Operational Details</th>
                    <th className="py-2 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {loadingUpdates ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1 text-blue-400" />
                        Loading latest submissions from clinical staff...
                      </td>
                    </tr>
                  ) : workerUpdates.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No recent worker submissions found.
                      </td>
                    </tr>
                  ) : (
                    workerUpdates.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white block">{u.user_name || 'Clinical Staff'}</span>
                          <span className="text-[10px] font-mono text-slate-400">{u.user_email}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-950 text-blue-300 border border-blue-800/60">
                            {u.event_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-md">
                          <p className="text-xs text-slate-300 leading-relaxed truncate">{u.description}</p>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[10px] whitespace-nowrap">
                          {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
