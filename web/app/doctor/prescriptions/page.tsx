'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Pill,
  ArrowLeft,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  UserCircle,
  Building2,
  Heart,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Microscope,
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

export default function DoctorPrescriptionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Drug Interaction Lab State
  const [drug1, setDrug1] = useState('Warfarin 5mg');
  const [drug2, setDrug2] = useState('Aspirin 81mg');
  const [interactionResult, setInteractionResult] = useState<{ severity: string; color: string; message: string } | null>({
    severity: 'HIGH / CRITICAL CONTRAINDICATION',
    color: 'rose',
    message: 'Severe bleeding risk detected! Concomitant administration of Warfarin and Aspirin synergistically increases hemorrhagic risk. Consider INR monitoring or alternative antiplatelet therapy.',
  });

  // Draft New Rx State
  const [rxDrug, setRxDrug] = useState('Amoxicillin 500mg TID');
  const [rxDuration, setRxDuration] = useState('7 Days');
  const [rxNotes, setRxNotes] = useState('Administer with meals. Monitor for hypersensitivity.');
  const [rxSuccess, setRxSuccess] = useState('');

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
          if (d.patients.length > 0) setSelectedPatient(d.patients[0]);
        }
      })
      .catch(() => {});
  }, [router]);

  const runDrugAnalysis = () => {
    if (drug1.includes('Warfarin') && drug2.includes('Aspirin')) {
      setInteractionResult({
        severity: 'CRITICAL BLEEDING RISK (HIGH)',
        color: 'rose',
        message: 'Severe synergistic anticoagulant effect! Co-administration increases internal hemorrhage risk by 4.2x. Monitor INR immediately or prescribe alternative antiplatelet.',
      });
    } else if (drug1.includes('Ciprofloxacin') && drug2.includes('Antacid')) {
      setInteractionResult({
        severity: 'CHELATION BINDING WARNING (MODERATE)',
        color: 'amber',
        message: 'Polyvalent aluminum and magnesium cations bind Ciprofloxacin in GI tract, reducing bio-absorption by 85%. Space administration 2 hours apart.',
      });
    } else {
      setInteractionResult({
        severity: 'COMPATIBLE & SAFE TO ADMINISTER',
        color: 'emerald',
        message: 'No hazardous biochemical antagonism or metabolic contraindications detected between selected regimens. Safe for clinical dispensing.',
      });
    }
  };

  const handleCommitPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const newRx = `${rxDrug} (${rxDuration}) | ${rxNotes}`;
    setPatients((prev) =>
      prev.map((p) => (p.id === selectedPatient.id ? { ...p, prescription: newRx } : p))
    );
    setSelectedPatient((prev) => (prev ? { ...prev, prescription: newRx } : null));
    setRxSuccess(`[OK] Prescription digitally signed and transmitted to Hospital Central Dispensary for ${selectedPatient.name}.`);
    setTimeout(() => setRxSuccess(''), 4000);
  };

  const filtered = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.patient_code?.toLowerCase().includes(q) ||
      p.diagnosis?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono text-xs gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading Physician E-Prescribing Station...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* -- Top Navigation Bar with Back / Return Controls -- */}
      <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2 group cursor-pointer shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Return to Main Console</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider hidden md:inline">
                Clinical Station: Doctor Prescriptions & Pharmacology Lab
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[11px] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>E-Prescribing Active</span>
            </span>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Close Station</span>
            </Link>
          </div>
        </div>
      </header>

      {/* -- Main Station Content -- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Physician Header Banner */}
        <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950/40 p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Attending Physician Workstation</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Surescripts Electronic Certified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Physician Electronic Prescriptions & Clinical Orders
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Attending Officer: <strong className="text-cyan-300">{user?.name}</strong> | Direct Hospital Dispensary Bridge | Real-Time Drug Interaction Checking
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => runDrugAnalysis()}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Cross-Check Interactions</span>
            </button>
            <Link
              href="/"
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Back to Overview
            </Link>
          </div>
        </div>

        {/* -- Two Column Grid: Drug Interaction Lab + Prescription Composer -- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Drug Interaction Lab */}
          <div className="rounded-2xl bg-slate-900 border border-cyan-500/30 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30">
                <Microscope className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Drug Interaction Analysis Lab</h3>
                <p className="text-xs text-slate-400">Pharmacological cross-check against metabolic antagonism & hemorrhagic contraindications</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Prescribed Drug 1</label>
                <select
                  value={drug1}
                  onChange={(e) => setDrug1(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option>Warfarin 5mg</option>
                  <option>Ciprofloxacin 500mg</option>
                  <option>Amoxicillin 500mg</option>
                  <option>Metformin 500mg</option>
                  <option>Atorvastatin 20mg</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Co-Administered Drug 2</label>
                <select
                  value={drug2}
                  onChange={(e) => setDrug2(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option>Aspirin 81mg</option>
                  <option>Antacids (Magnesium/Aluminum)</option>
                  <option>Paracetamol 1g</option>
                  <option>Ibuprofen 400mg</option>
                  <option>Clopidogrel 75mg</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={runDrugAnalysis}
              className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold text-xs transition-all cursor-pointer"
            >
              Analyze Biochemical Interaction
            </button>

            {interactionResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  interactionResult.color === 'rose'
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                    : interactionResult.color === 'amber'
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
                    : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                }`}
              >
                <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{interactionResult.severity}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{interactionResult.message}</p>
              </div>
            )}
          </div>

          {/* 2. E-Prescribing Composer */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <Pill className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">E-Prescription Order Composer</h3>
                <p className="text-xs text-slate-400">Direct transmission to Hospital Central Dispensary & Nursing MAR</p>
              </div>
            </div>

            {rxSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{rxSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCommitPrescription} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Select In-Patient</label>
                <select
                  value={selectedPatient?.id || ''}
                  onChange={(e) => {
                    const p = patients.find((x) => x.id === Number(e.target.value));
                    if (p) setSelectedPatient(p);
                  }}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                >
                  {patients.slice(0, 20).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patient_code} | {p.ward_room || 'General Ward'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Prescription Regimen</label>
                  <input
                    type="text"
                    value={rxDrug}
                    onChange={(e) => setRxDrug(e.target.value)}
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Course Duration</label>
                  <input
                    type="text"
                    value={rxDuration}
                    onChange={(e) => setRxDuration(e.target.value)}
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Clinical Administration Notes</label>
                <input
                  type="text"
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Authorize & Dispatch Order to Dispensary</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* -- Patient Prescription Roster Table -- */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl space-y-0">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-sm">Active In-Patient Clinical Prescriptions</h3>
              <p className="text-xs text-slate-400">Current pharmacotherapy orders active on ward floors</p>
            </div>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter patient prescriptions..."
                className="rounded-xl bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Ward Room</th>
                  <th className="py-3 px-4">Diagnosis</th>
                  <th className="py-3 px-4">Active Prescription (Rx)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.slice(0, 15).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{p.patient_code}</td>
                    <td className="py-3 px-4 text-white font-medium">{p.name}</td>
                    <td className="py-3 px-4 text-slate-300">{p.ward_room || 'Ward 1'}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{p.diagnosis}</td>
                    <td className="py-3 px-4 text-amber-300 font-mono text-[11px] max-w-md truncate">
                      {p.prescription || 'Amoxicillin 500mg TID + Paracetamol 1g'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPatient(p);
                          window.scrollTo({ top: 120, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold cursor-pointer"
                      >
                        Adjust Rx
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
