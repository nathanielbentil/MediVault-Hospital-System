'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pill,
  QrCode,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCircle,
  LogOut,
  Sparkles,
  ShieldAlert,
  Boxes,
  FileCheck,
  AlertCircle,
  Check,
  RefreshCw,
  Barcode,
  PackageCheck,
  Lock,
} from 'lucide-react';

interface Patient {
  id: number;
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  ward_room: string;
  diagnosis: string;
  prescription: string;
  treatment_plan: string;
  attending_doctor: string;
}

interface FormularyItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  ndc: string;
  batch: string;
  expiry: string;
  controlled: boolean;
}

export default function PharmacyDispensaryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dispenseFilter, setDispenseFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Barcode Scanner Simulator State
  const [barcodeInput, setBarcodeInput] = useState('RX-88294-GH');
  const [barcodeResult, setBarcodeResult] = useState<{
    code: string;
    product: string;
    batch: string;
    expiry: string;
    status: 'VALID' | 'WARNING' | 'EXPIRED';
    message: string;
  } | null>({
    code: 'RX-88294-GH',
    product: 'Amoxicillin + Clavulanic Acid (Augmentin) 625mg',
    batch: 'BATCH-2026-GH99',
    expiry: '2028-09-30',
    status: 'VALID',
    message: 'GS1 2D DataMatrix validated. Manufacturer seal intact. Verified in Central Formulary.',
  });

  // Formulary Inventory
  const [formulary, setFormulary] = useState<FormularyItem[]>([
    { id: 'F-101', name: 'Amoxicillin 500mg Caps', category: 'Antibiotic', stock: 450, unit: 'caps', ndc: '0093-3105-01', batch: 'BATCH-2026-GH99', expiry: '2028-09-30', controlled: false },
    { id: 'F-102', name: 'Morphine Sulfate 10mg/mL Ampoules', category: 'Opioid Analgesic', stock: 18, unit: 'amps', ndc: '0409-1762-10', batch: 'NARCO-2026-SEC', expiry: '2027-12-15', controlled: true },
    { id: 'F-103', name: 'Ciprofloxacin 500mg Tabs', category: 'Fluoroquinolone', stock: 280, unit: 'tabs', ndc: '50090-2814-0', batch: 'BATCH-2026-CP12', expiry: '2028-04-10', controlled: false },
    { id: 'F-104', name: 'Warfarin Sodium 5mg Tabs', category: 'Anticoagulant', stock: 120, unit: 'tabs', ndc: '0056-0172-70', batch: 'BATCH-2026-WF04', expiry: '2028-11-20', controlled: false },
    { id: 'F-105', name: 'Diazepam 5mg/mL Injection', category: 'Benzodiazepine', stock: 14, unit: 'vials', ndc: '0409-1273-04', batch: 'NARCO-2026-DZ09', expiry: '2027-08-18', controlled: true },
    { id: 'F-106', name: 'Normal Saline 0.9% 500mL IV Bags', category: 'IV Hydration', stock: 600, unit: 'bags', ndc: '0338-0049-03', batch: 'BATCH-2026-NS88', expiry: '2029-01-30', controlled: false },
  ]);

  // Dispensed prescriptions history
  const [dispensedOrders, setDispensedOrders] = useState<string[]>(['P-1002']);
  const [toastMsg, setToastMsg] = useState('');

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

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const handleScanBarcode = () => {
    const code = barcodeInput.trim().toUpperCase();
    if (code.includes('NARCO') || code.includes('MORPH') || code.includes('DIAZE')) {
      setBarcodeResult({
        code,
        product: 'Morphine Sulfate 10mg/mL Ampoule (Controlled Substance)',
        batch: 'NARCO-2026-SEC',
        expiry: '2027-12-15',
        status: 'WARNING',
        message: 'SCHEDULE II NARCOTIC: Double signature required. Vault tamper seal unbroken. Log entry generated in Narcotics Safe Registry.',
      });
    } else if (code.includes('EXPIRE')) {
      setBarcodeResult({
        code,
        product: 'Erythromycin 250mg Film-Coated Tablet',
        batch: 'BATCH-2023-OLD',
        expiry: '2024-01-15',
        status: 'EXPIRED',
        message: 'SAFETY LOCKOUT: Medication has exceeded expiration date (2024-01-15). Dispensing blocked. Quarantine immediately.',
      });
    } else {
      setBarcodeResult({
        code: code || 'RX-88294-GH',
        product: 'Amoxicillin + Clavulanic Acid (Augmentin) 625mg',
        batch: 'BATCH-2026-GH99',
        expiry: '2028-09-30',
        status: 'VALID',
        message: 'GS1 2D DataMatrix validated. Manufacturer seal intact. Verified in Central Formulary.',
      });
    }
    triggerToast(`Barcode ${code || 'RX-88294-GH'} scanned successfully.`);
  };

  const handleDispense = (patient: Patient) => {
    if (dispensedOrders.includes(patient.patient_code)) {
      triggerToast(`Order for ${patient.name} has already been dispensed.`);
      return;
    }
    setDispensedOrders((prev) => [...prev, patient.patient_code]);
    triggerToast(`Medication dispensed for ${patient.name} (${patient.ward_room}). Dispatched to nursing station.`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/');
  };

  // Filter patients for dispensing
  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.patient_code.toLowerCase().includes(q) ||
      p.prescription?.toLowerCase().includes(q) ||
      p.ward_room.toLowerCase().includes(q);

    const isDispensed = dispensedOrders.includes(p.patient_code);
    if (dispenseFilter === 'pending') return matchesSearch && !isDispensed;
    if (dispenseFilter === 'dispensed') return matchesSearch && isDispensed;
    return matchesSearch;
  });

  const controlledStockCount = formulary.filter((f) => f.controlled).reduce((acc, curr) => acc + curr.stock, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <Pill className="h-8 w-8 animate-spin" />
          <span className="text-sm font-mono tracking-wider">Accessing Central Dispensary...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-slate-900 border border-amber-400 text-white text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
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
              <ArrowLeft className="h-3.5 w-3.5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
              <span>Return to Main Console</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-base shadow-md">
                💊
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-base">Medi<span className="text-amber-400">Vault</span></span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-950 text-amber-300 font-mono font-bold">
                    Dispensary
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden md:block">
                  Hospital Central Pharmacy & Narcotics Safe Vault
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300">
              <UserCircle className="h-4 w-4 text-amber-400" />
              <span className="font-bold">{user?.name || 'Pharm. Kwame Appiah'} (RPh)</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] text-amber-300 font-mono">Formulary Online</span>
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
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950/40 p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full border border-amber-500/40 bg-amber-950 text-amber-300">
                Hospital Central Dispensary
              </span>
              <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-medium">
                ● Narcotics Vault Locked & Monitored
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Dispensary Fulfillment & Medication Verification
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Licensed Pharmacist: <strong className="text-amber-300">{user?.name || 'Pharm. Kwame Appiah'} (RPh)</strong> • Prescription validation, GS1 barcode batch lot inspection, and double-signed controlled substances auditing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
            <button
              onClick={() => {
                setBarcodeInput('NARCO-2026-SEC');
                handleScanBarcode();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400 text-amber-300 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Lock className="h-4 w-4" />
              <span>Verify Controlled Narcotic</span>
            </button>
            <button
              onClick={() => triggerToast('Central Medical Store synced: 186 formulary lines verified. 0 cold-chain faults.')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Audit Formulary Inventory</span>
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Orders</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-2">
              {patients.length - dispensedOrders.length} Orders
            </div>
            <div className="text-[11px] text-amber-400/80 mt-0.5">Awaiting Pharmacist Check</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dispensed Today</span>
              <PackageCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">
              {dispensedOrders.length} Orders
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">Dispatched to Nursing Wards</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Controlled Narcotics</span>
              <Lock className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400 mt-2">
              {controlledStockCount} Units
            </div>
            <div className="text-[11px] text-purple-400/80 mt-0.5">Double Signature Verified</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Drug Shortage Alert</span>
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400 mt-2">0 Lines</div>
            <div className="text-[11px] text-cyan-400/80 mt-0.5">Safety Stock Adequate</div>
          </div>
        </div>

        {/* ── GS1 Barcode Scanner Verification Lab ── */}
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-white">GS1 2D DataMatrix & Barcode Verification Engine</h2>
                <p className="text-[11px] text-slate-400">Scan or enter medication batch code to verify authentic supply chain</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setBarcodeInput('RX-88294-GH'); handleScanBarcode(); }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono"
              >
                Augmentin 625mg
              </button>
              <button
                onClick={() => { setBarcodeInput('NARCO-2026-SEC'); handleScanBarcode(); }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 font-mono border border-purple-500/30"
              >
                Morphine Safe
              </button>
              <button
                onClick={() => { setBarcodeInput('EXPIRE-BATCH'); handleScanBarcode(); }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-mono border border-rose-500/30"
              >
                Expired Test
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <QrCode className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode scanner optical input or enter NDC / Batch Lot..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              onClick={handleScanBarcode}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md"
            >
              <Search className="h-4 w-4" />
              <span>Validate Barcode</span>
            </button>
          </div>

          {/* Barcode Output Card */}
          {barcodeResult && (
            <div
              className={`p-4 rounded-xl border transition-all ${
                barcodeResult.status === 'VALID'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : barcodeResult.status === 'WARNING'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-white">
                      {barcodeResult.code}
                    </span>
                    <span className="font-bold text-xs">{barcodeResult.product}</span>
                  </div>
                  <p className="text-xs opacity-90">{barcodeResult.message}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div>
                    <span className="text-[10px] opacity-75 block">BATCH</span>
                    <span className="font-bold">{barcodeResult.batch}</span>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-75 block">EXPIRY</span>
                    <span className="font-bold">{barcodeResult.expiry}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950">
                    {barcodeResult.status}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Dual-Panel Layout: Prescription Queue & Formulary Inventory ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Active In-Patient Dispensing Queue (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Prescription Dispensing Queue</h2>
                <p className="text-[11px] text-slate-400">Review doctor orders & release medications to wards</p>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setDispenseFilter('all')}
                  className={`px-2.5 py-1 rounded cursor-pointer font-bold ${dispenseFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setDispenseFilter('pending')}
                  className={`px-2.5 py-1 rounded cursor-pointer font-bold ${dispenseFilter === 'pending' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setDispenseFilter('dispensed')}
                  className={`px-2.5 py-1 rounded cursor-pointer font-bold ${dispenseFilter === 'dispensed' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Dispensed
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
                placeholder="Search patient, code, or medication name..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Orders List */}
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredPatients.map((p) => {
                const isDispensed = dispensedOrders.includes(p.patient_code);
                const isSelected = selectedPatient?.id === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/20 shadow-lg'
                        : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">({p.patient_code})</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {p.ward_room}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isDispensed
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse'
                        }`}
                      >
                        {isDispensed ? '● DISPENSED' : '⏳ AWAITING RELEASE'}
                      </span>
                    </div>

                    {/* Prescription Details */}
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs font-mono text-amber-200">
                      {p.prescription || 'No active prescription charted.'}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        Prescribed by: <strong className="text-slate-300">{p.attending_doctor}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {!isDispensed ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDispense(p);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>Verify & Dispense</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Dispatched</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Formulary Stock & Controlled Substances Safe (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* Formulary Stock Levels */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-bold text-white">Central Formulary Stock</h2>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Real-Time In Stock</span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {formulary.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.name}</span>
                        {item.controlled && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 text-[9px] font-bold border border-purple-800">
                            NARCOTIC
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        NDC: {item.ndc} • {item.batch}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono font-bold text-sm ${item.stock < 20 ? 'text-rose-400' : 'text-amber-300'}`}>
                        {item.stock} {item.unit}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Exp: {item.expiry}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controlled Narcotics Safe Vault Policy */}
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-purple-300">
                <Lock className="h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider">Narcotics Safe Protocol</h2>
              </div>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                Schedule II opioids (Morphine, Diazepam) require dual biometric authorization and physical vault key verification prior to drawer release.
              </p>
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-purple-300">
                <span>Vault Status: SECURE</span>
                <span>Active Vault Key: PHARM-KEY-01</span>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
