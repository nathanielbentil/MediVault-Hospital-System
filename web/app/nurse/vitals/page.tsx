'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Thermometer,
  Activity,
  Heart,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCircle,
  LogOut,
  Sparkles,
  BedDouble,
  FileText,
  AlertCircle,
  Plus,
  RefreshCw,
  Sliders,
  Send,
} from 'lucide-react';

interface Patient {
  id: number;
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  blood_group: string;
  ward_room: string;
  admission_status: string;
  diagnosis: string;
  vitals_summary: string;
  prescription: string;
  treatment_plan: string;
  attending_doctor: string;
  assigned_nurse: string;
}

export default function NurseVitalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [wardFilter, setWardFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Vitals Entry Form State
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [heartRate, setHeartRate] = useState('74');
  const [tempCelsius, setTempCelsius] = useState('36.8');
  const [spO2, setSpO2] = useState('98');
  const [respRate, setRespRate] = useState('16');
  const [painLevel, setPainLevel] = useState('2');
  const [clinicalNotes, setClinicalNotes] = useState('Patient alert, oriented x4. Normal peripheral perfusion.');
  const [toastMsg, setToastMsg] = useState('');

  // Handover Log State
  const [showHandover, setShowHandover] = useState(false);
  const [handoverLogs, setHandoverLogs] = useState([
    {
      time: '07:30 GMT',
      nurse: 'Staff Nurse Beatrice',
      shift: 'Day Shift (07:00 - 15:00)',
      note: 'Morning shift commenced. Bed 102 (Kwame Mensah) post-op wound dressing checked dry & intact. IV fluids infusing normally at 100mL/hr.',
    },
    {
      time: '04:15 GMT',
      nurse: 'Night Sister Mensah',
      shift: 'Night Shift (23:00 - 07:00)',
      note: 'Bed 204 (Abena Osei) experienced transient tachycardia (HR 105bpm) at 03:00. Settled after 500mL Normal Saline bolus. Attending Dr. notified.',
    },
  ]);
  const [newHandoverNote, setNewHandoverNote] = useState('');

  useEffect(() => {
    fetch('/api/auth/user')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) {
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
          if (d.patients.length > 0) {
            setSelectedPatient(d.patients[0]);
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    // Parse vitals if present in format BP 120/80 mmHg | HR 72 bpm | Temp 36.8°C | SpO2 98%
    const bpMatch = p.vitals_summary?.match(/BP\s*(\d+)\/(\d+)/i);
    if (bpMatch) {
      setBpSystolic(bpMatch[1]);
      setBpDiastolic(bpMatch[2]);
    }
    const hrMatch = p.vitals_summary?.match(/HR\s*(\d+)/i);
    if (hrMatch) setHeartRate(hrMatch[1]);
    const tempMatch = p.vitals_summary?.match(/Temp\s*([\d.]+)/i);
    if (tempMatch) setTempCelsius(tempMatch[1]);
    const spo2Match = p.vitals_summary?.match(/SpO2\s*(\d+)/i);
    if (spo2Match) setSpO2(spo2Match[1]);
  };

  const handleRecordVitals = () => {
    if (!selectedPatient) return;
    const newSummary = `BP ${bpSystolic}/${bpDiastolic} mmHg | HR ${heartRate} bpm | Temp ${tempCelsius}°C | SpO2 ${spO2}% | Pain ${painLevel}/10`;

    // Update in memory
    setPatients((prev) =>
      prev.map((pt) =>
        pt.id === selectedPatient.id
          ? { ...pt, vitals_summary: newSummary }
          : pt
      )
    );
    setSelectedPatient((prev) => prev ? { ...prev, vitals_summary: newSummary } : null);

    triggerToast(`Bedside vitals recorded for ${selectedPatient.name} (${selectedPatient.ward_room}). Telemetry broadcasted.`);
  };

  const handleAddHandover = () => {
    if (!newHandoverNote.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} GMT`;
    const newEntry = {
      time: timeStr,
      nurse: user?.name ? `${user.name} (RN)` : 'Attending Registered Nurse',
      shift: 'Active Shift Round',
      note: newHandoverNote.trim(),
    };
    setHandoverLogs([newEntry, ...handoverLogs]);
    setNewHandoverNote('');
    triggerToast('New shift handover entry timestamped and added to ward registry.');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/');
  };

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.patient_code.toLowerCase().includes(q) ||
      p.ward_room.toLowerCase().includes(q) ||
      p.diagnosis.toLowerCase().includes(q);

    if (wardFilter === 'all') return matchesSearch;
    if (wardFilter === 'icu') return matchesSearch && p.ward_room.toLowerCase().includes('icu');
    if (wardFilter === 'gen') return matchesSearch && !p.ward_room.toLowerCase().includes('icu');
    return matchesSearch;
  });

  // Calculate clinical alert flags
  const spo2Num = parseInt(spO2, 10);
  const bpSysNum = parseInt(bpSystolic, 10);
  const hrNum = parseInt(heartRate, 10);
  const tempNum = parseFloat(tempCelsius);

  const isHypoxia = !isNaN(spo2Num) && spo2Num < 94;
  const isHypertension = !isNaN(bpSysNum) && bpSysNum >= 140;
  const isTachycardia = !isNaN(hrNum) && hrNum > 100;
  const isFever = !isNaN(tempNum) && tempNum >= 38.0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-pink-400">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-8 w-8 animate-spin" />
          <span className="text-sm font-mono tracking-wider">Accessing Shift Nursing Station...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-slate-900 border border-pink-400 text-white text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <Sparkles className="h-4 w-4 text-pink-400 shrink-0" />
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
              <ArrowLeft className="h-3.5 w-3.5 text-pink-400 group-hover:-translate-x-1 transition-transform" />
              <span>Return to Main Console</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-base shadow-md">
                💉
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-base">Medi<span className="text-pink-400">Vault</span></span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-pink-500/40 bg-pink-950 text-pink-300 font-mono font-bold">
                    Nursing Station
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden md:block">
                  Bedside Vitals & Medication Administration Record (MAR)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300">
              <UserCircle className="h-4 w-4 text-pink-400" />
              <span className="font-bold">{user?.name || 'Staff Nurse Beatrice'} (RN)</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
              <span className="h-2 w-2 rounded-full bg-pink-400 animate-pulse" />
              <span className="text-[10px] text-pink-300 font-mono">Floor Telemetry Active</span>
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
        <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-r from-pink-950 via-slate-900 to-pink-950/40 p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full border border-pink-500/40 bg-pink-950 text-pink-300">
                Shift Nursing Workstation
              </span>
              <span className="text-[10px] text-pink-400 bg-pink-950/60 px-2.5 py-0.5 rounded-full border border-pink-500/30 font-medium">
                ● Bedside Observations Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              In-Patient Bed Roster & Shift Vitals Charting
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Attending Registered Nurse: <strong className="text-pink-300">{user?.name || 'Staff Nurse Beatrice'} (RN)</strong> • Real-time physiologic telemetry, hourly vitals log, and digital shift handover continuity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
            <button
              onClick={() => setShowHandover(!showHandover)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-pink-400 text-pink-300 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <FileText className="h-4 w-4" />
              <span>{showHandover ? 'Hide Handover Log' : 'Shift Handover Log'}</span>
            </button>
            <button
              onClick={() => triggerToast('Bedside telemetry monitors synced across all in-patient wards.')}
              className="px-4 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-black text-xs shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Sync Bed Monitors</span>
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-pink-500/20 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active In-Patients</span>
              <BedDouble className="h-4 w-4 text-pink-400" />
            </div>
            <div className="text-2xl font-black text-pink-300 mt-2">{patients.length} Beds</div>
            <div className="text-[11px] text-slate-400 mt-0.5">General & Surgical Wards</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ICU Monitored</span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-2">
              {patients.filter((p) => p.ward_room.toLowerCase().includes('icu')).length} Patients
            </div>
            <div className="text-[11px] text-rose-400/80 mt-0.5">Continuous Pulse Oximetry</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hourly Checks</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-2">Current Round</div>
            <div className="text-[11px] text-amber-400/80 mt-0.5">Every 60 Minutes</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MAR Compliance</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">100%</div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">Zero Med Misses</div>
          </div>
        </div>

        {/* ── Shift Handover Drawer / Collapsible ── */}
        {showHandover && (
          <div className="rounded-2xl border border-pink-500/30 bg-slate-900/95 p-6 shadow-2xl space-y-4 animate-in slide-in-from-top-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-pink-400" />
                <h2 className="text-base font-bold text-white">Shift Handover & Clinical Continuity Log</h2>
              </div>
              <span className="text-xs text-slate-400">Official Nursing Ward Record</span>
            </div>

            {/* Input for new note */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newHandoverNote}
                onChange={(e) => setNewHandoverNote(e.target.value)}
                placeholder="Enter clinical handover observation or critical ward update..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
              />
              <button
                onClick={handleAddHandover}
                className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post Handover Note</span>
              </button>
            </div>

            {/* Log Stream */}
            <div className="space-y-3 pt-2 max-h-60 overflow-y-auto">
              {handoverLogs.map((log, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-pink-300">{log.nurse}</span>
                    <span className="font-mono text-slate-400">{log.time} • {log.shift}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{log.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Main Dual-Panel Workspace (Patient Roster & Vitals Charting) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Panel: Active In-Patient Roster (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">In-Patient Bed Roster</h2>
                <p className="text-[11px] text-slate-400">Select patient to chart vital observations</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setWardFilter('all')}
                  className={`px-2.5 py-1 rounded cursor-pointer font-bold ${wardFilter === 'all' ? 'bg-pink-500 text-slate-950' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setWardFilter('icu')}
                  className={`px-2.5 py-1 rounded cursor-pointer font-bold ${wardFilter === 'icu' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}
                >
                  ICU
                </button>
                <button
                  onClick={() => setWardFilter('gen')}
                  className={`px-2.5 py-1 rounded cursor-pointer font-bold ${wardFilter === 'gen' ? 'bg-pink-500 text-slate-950' : 'text-slate-400'}`}
                >
                  General
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, bed, or diagnosis..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Patient Bed List */}
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isSelected = selectedPatient?.id === p.id;
                const isICU = p.ward_room.toLowerCase().includes('icu');

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-pink-500 bg-pink-950/30 shadow-lg shadow-pink-950/50'
                        : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({p.patient_code})</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isICU
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                            : 'bg-pink-950/80 text-pink-300 border-pink-500/30'
                        }`}
                      >
                        {p.ward_room}
                      </span>
                    </div>

                    <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{p.diagnosis}</span>
                      <span className="font-mono text-slate-500">{p.age}y / {p.gender}</span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono truncate max-w-[220px]">
                        {p.vitals_summary || 'Vitals check pending'}
                      </span>
                      <span className="text-pink-400 font-bold">Chart →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Bedside Vital Signs Entry & Telemetry (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">

            {selectedPatient ? (
              <div className="rounded-2xl border border-pink-500/30 bg-slate-900/70 p-6 space-y-6 shadow-xl">
                {/* Patient Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-pink-400 font-bold">{selectedPatient.patient_code}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">{selectedPatient.ward_room}</span>
                    </div>
                    <h2 className="text-xl font-black text-white mt-0.5">{selectedPatient.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Diagnosis: <strong className="text-slate-200">{selectedPatient.diagnosis}</strong> • Attending: <span className="text-slate-300">{selectedPatient.attending_doctor}</span>
                    </p>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Blood Group</span>
                    <span className="text-xs font-mono font-bold text-pink-300">{selectedPatient.blood_group || 'O+'}</span>
                  </div>
                </div>

                {/* Clinical Alert Warning Banners if Vitals are abnormal */}
                {(isHypoxia || isHypertension || isTachycardia || isFever) && (
                  <div className="p-4 rounded-xl border border-rose-500/50 bg-rose-950/40 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-rose-300">
                      <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      <span>Physiologic Early Warning Triggered (MEWS Alert):</span>
                    </div>
                    <div className="text-[11px] text-rose-200/90 pl-6 space-y-0.5">
                      {isHypoxia && <div>• <strong>Hypoxemia Alert:</strong> SpO2 is {spO2}% (&lt; 94%). Administer supplemental O2 via nasal cannula.</div>}
                      {isHypertension && <div>• <strong>Hypertensive Reading:</strong> Systolic BP is {bpSystolic} mmHg (&ge; 140 mmHg). Re-check in 15 mins.</div>}
                      {isTachycardia && <div>• <strong>Tachycardia:</strong> Heart Rate is {heartRate} bpm (&gt; 100 bpm). Notify attending physician.</div>}
                      {isFever && <div>• <strong>Pyrexia / Fever:</strong> Temperature is {tempCelsius}°C (&ge; 38.0°C). Administer prescribed antipyretic.</div>}
                    </div>
                  </div>
                )}

                {/* Vitals Form Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Blood Pressure */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Blood Pressure (mmHg)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(e.target.value)}
                        placeholder="120"
                        className="w-16 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-pink-400"
                      />
                      <span className="text-slate-500 font-bold">/</span>
                      <input
                        type="text"
                        value={bpDiastolic}
                        onChange={(e) => setBpDiastolic(e.target.value)}
                        placeholder="80"
                        className="w-16 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-pink-400"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">Normal: 120/80</span>
                  </div>

                  {/* Heart Rate */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Heart Rate (BPM)
                    </label>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-rose-400" />
                      <input
                        type="text"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        placeholder="72"
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-pink-400"
                      />
                      <span className="text-[11px] text-slate-400">bpm</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Normal: 60 - 100</span>
                  </div>

                  {/* Body Temperature */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Temperature (°C)
                    </label>
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-amber-400" />
                      <input
                        type="text"
                        value={tempCelsius}
                        onChange={(e) => setTempCelsius(e.target.value)}
                        placeholder="36.8"
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-pink-400"
                      />
                      <span className="text-[11px] text-slate-400">°C</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Normal: 36.5 - 37.5</span>
                  </div>

                  {/* SpO2 Saturation */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Oxygen Saturation (SpO2)
                    </label>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      <input
                        type="text"
                        value={spO2}
                        onChange={(e) => setSpO2(e.target.value)}
                        placeholder="98"
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-pink-400"
                      />
                      <span className="text-[11px] text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Normal: &ge; 95%</span>
                  </div>

                  {/* Respiration Rate */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Respiratory Rate
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={respRate}
                        onChange={(e) => setRespRate(e.target.value)}
                        placeholder="16"
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-pink-400"
                      />
                      <span className="text-[11px] text-slate-400">breaths/min</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Normal: 12 - 20</span>
                  </div>

                  {/* Pain Score */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pain Scale (0 - 10)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={painLevel}
                        onChange={(e) => setPainLevel(e.target.value)}
                        className="w-28 accent-pink-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-pink-300">{painLevel} / 10</span>
                    </div>
                    <span className="text-[10px] text-slate-500">0 = None, 10 = Severe</span>
                  </div>
                </div>

                {/* Bedside Observation Note */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Bedside Observation Notes (MAR)
                  </label>
                  <textarea
                    rows={2}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-400 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-pink-400" />
                    <span>Hourly Rounding Telemetry</span>
                  </div>
                  <button
                    onClick={handleRecordVitals}
                    className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-black text-xs shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Commit Vitals & Transmit Telemetry</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500">
                <BedDouble className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">Select an in-patient from the roster to begin charting vitals.</p>
              </div>
            )}

            {/* Current Treatment Plan & Prescriptions for Reference */}
            {selectedPatient && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Medication Administration Schedule (MAR)</span>
                  <span className="text-[10px] text-pink-400 font-mono">Assigned Nurse: {selectedPatient.assigned_nurse || 'Beatrice (RN)'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-pink-200">
                  {selectedPatient.prescription || 'No active prescription orders.'}
                </div>
                <p className="text-[11px] text-slate-400">
                  Treatment Plan: <span className="text-slate-300">{selectedPatient.treatment_plan || 'Regular clinical observation and diet as tolerated.'}</span>
                </p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
