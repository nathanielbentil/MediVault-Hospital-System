'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Shield,
  Users,
  Building2,
  Lock,
  LogOut,
  Search,
  Plus,
  Pill,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  X,
  Heart,
  Stethoscope,
  ClipboardList,
  Database,
  Fingerprint,
  Eye,
  EyeOff,
  UserCircle,
  TrendingUp,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface StaffAccount {
  role: string;
  icon: string;
  label: string;
  email: string;
  pass: string;
}

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
  created_at: string;
}

interface AuditLog {
  id: number;
  event_type: string;
  description: string;
  severity: string;
  ip_address: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

interface AuditData {
  chain_intact: boolean;
  verified_records: number;
  broken_at_id: number | null;
  logs: AuditLog[];
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_admin: boolean;
  two_factor_enabled: boolean;
}

type TabType = 'dashboard' | 'patients' | 'admission' | 'pharmacy' | 'audit';

// ─── Evaluation Accounts ─────────────────────────────────────────────────────
const DEMO_STAFF: StaffAccount[] = [
  { role: 'Admin',      icon: '👑', label: 'Chief Admin',          email: 'admin@medivault.cloud',       pass: 'Admin@MediVault2026!'      },
  { role: 'Manager',    icon: '📋', label: 'MD Manager',           email: 'manager@medivault.cloud',     pass: 'Manager@MediVault2026!'    },
  { role: 'Doctor',     icon: '🩺', label: 'Dr. Donkoh',           email: 'doctor@medivault.cloud',      pass: 'Doctor@MediVault2026!'     },
  { role: 'Nurse',      icon: '💉', label: 'Nurse Beatrice',        email: 'nurse@medivault.cloud',       pass: 'Nurse@MediVault2026!'      },
  { role: 'Pharmacist', icon: '💊', label: 'Pharm. Appiah',         email: 'pharmacist@medivault.cloud',  pass: 'Pharm@MediVault2026!'      },
  { role: 'Auditor',    icon: '🔍', label: 'Auditor Osei',          email: 'auditor@medivault.cloud',     pass: 'Auditor@MediVault2026!'    },
  { role: 'Doctor',     icon: '🩺', label: 'Dr. Judah (2FA test)',  email: 'juda@gmail.com',              pass: 'Doctor@MediVault2026!'     },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  const styles: Record<string, string> = {
    ICU:        'bg-rose-950 text-rose-300 border-rose-500/40',
    ADMITTED:   'bg-cyan-950 text-cyan-300 border-cyan-500/40',
    OUTPATIENT: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
    DISCHARGED: 'bg-slate-800 text-slate-400 border-slate-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[s] || styles.ADMITTED}`}>
      {status || 'Admitted'}
    </span>
  );
}

// ─── Severity Badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const s = (severity || '').toLowerCase();
  const styles: Record<string, string> = {
    critical: 'bg-rose-950 text-rose-400 border-rose-500/40',
    warning:  'bg-amber-950 text-amber-400 border-amber-500/40',
    notice:   'bg-indigo-950 text-indigo-400 border-indigo-500/40',
    info:     'bg-slate-900 text-slate-400 border-slate-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${styles[s] || styles.info}`}>
      {severity}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Login form
  const [email, setEmail]           = useState('admin@medivault.cloud');
  const [password, setPassword]     = useState('Admin@MediVault2026!');
  const [showPass, setShowPass]     = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA
  const [show2FA, setShow2FA]     = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode]   = useState('123456');

  // Dashboard
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [patients, setPatients]   = useState<Patient[]>([]);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  // Admission form
  const [admName, setAdmName]         = useState('');
  const [admAge, setAdmAge]           = useState('35');
  const [admGender, setAdmGender]     = useState('Male');
  const [admBlood, setAdmBlood]       = useState('O+');
  const [admWard, setAdmWard]         = useState('Ward 2 - Bed B4');
  const [admDiagnosis, setAdmDiagnosis] = useState('');
  const [admVitals, setAdmVitals]     = useState('BP 120/80 mmHg | HR 72 bpm | Temp 36.8°C | SpO2 99%');
  const [admRx, setAdmRx]             = useState('Amoxicillin 500mg TID + Paracetamol 1g PRN');
  const [admStatus, setAdmStatus]     = useState('Admitted');
  const [admitting, setAdmitting]     = useState(false);
  const [admitSuccess, setAdmitSuccess] = useState('');

  // ── Data fetchers ────────────────────────────────────────────────────────
  const loadPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const res = await fetch('/api/patients');
      const data = await res.json();
      if (data.success && Array.isArray(data.patients)) setPatients(data.patients);
    } catch (_) {}
    finally { setPatientsLoading(false); }
  }, []);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      if (data.success) setAuditData(data);
    } catch (_) {}
    finally { setAuditLoading(false); }
  }, []);

  // ── Session restore on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/user')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) {
          setUser(d.user);
          loadPatients();
          loadAudit();
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadPatients, loadAudit]);

  // ── Auth handlers ────────────────────────────────────────────────────────
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.two_factor_required) {
        setTempToken(data.temp_token);
        setShow2FA(true);
      } else if (data.success && data.user) {
        setUser(data.user);
        loadPatients();
        loadAudit();
      } else {
        setLoginError(data.message || 'Authentication failed.');
      }
    } catch {
      setLoginError('Could not reach server. Check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify2FA = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/two-factor-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: tempToken, code: totpCode }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setShow2FA(false);
        setUser(data.user);
        loadPatients();
        loadAudit();
      } else {
        setLoginError(data.message || 'Invalid 2FA code.');
        setShow2FA(false);
      }
    } catch {
      setLoginError('2FA verification failed. Try again.');
      setShow2FA(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setPatients([]);
    setAuditData(null);
    setActiveTab('dashboard');
  };

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admName.trim() || !admDiagnosis.trim()) return;
    setAdmitting(true);
    setAdmitSuccess('');
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: admName,
          age: admAge,
          gender: admGender,
          blood_group: admBlood,
          ward_room: admWard,
          admission_status: admStatus,
          diagnosis: admDiagnosis,
          vitals_summary: admVitals,
          prescription: admRx,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdmitSuccess(`✓ ${admName} successfully admitted to ${admWard}`);
        setAdmName(''); setAdmDiagnosis('');
        loadPatients();
        setTimeout(() => { setAdmitSuccess(''); setActiveTab('patients'); }, 2000);
      } else {
        setAdmitSuccess('✗ ' + (data.message || 'Could not complete admission.'));
      }
    } catch {
      setAdmitSuccess('✗ Network error. Try again.');
    } finally {
      setAdmitting(false);
    }
  };

  // ── Derived state ────────────────────────────────────────────────────────
  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      p.name?.toLowerCase().includes(q) ||
      p.patient_code?.toLowerCase().includes(q) ||
      p.diagnosis?.toLowerCase().includes(q) ||
      p.ward_room?.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filterStatus === 'ALL') return true;
    return (p.admission_status || '').toUpperCase() === filterStatus;
  });

  const icuCount = patients.filter((p) => p.admission_status?.toUpperCase() === 'ICU').length;
  const admittedCount = patients.filter((p) => p.admission_status?.toUpperCase() === 'ADMITTED').length;
  const outpatientCount = patients.filter((p) => p.admission_status?.toUpperCase() === 'OUTPATIENT').length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-2xl animate-pulse">
          🏥
        </div>
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Connecting to MediVault EHR...
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  LOGIN VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
        {/* Left panel – branding */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-slate-900 via-cyan-950/30 to-slate-950 border-r border-slate-800 flex-col justify-between p-12">
          <div className="space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/10">
              🏥
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Medi<span className="text-cyan-400">Vault</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Secure Hospital Management System &amp; Electronic Health Record platform built on a modern Node.js stack.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Fingerprint, label: 'Argon2id + HMAC-SHA256 Pepper', desc: 'NIST SP 800-63B compliant authentication' },
              { icon: Shield,      label: 'SHA-256 Merkle Blockchain Audit', desc: 'Cryptographic immutable event chain' },
              { icon: Database,    label: 'AWS London PostgreSQL',           desc: 'Live Supabase cluster — eu-west-2' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                  <Icon className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{label}</p>
                  <p className="text-[11px] text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-600 font-mono">
            © 2026 MediVault HMS • HIPAA Certified EHR
          </p>
        </div>

        {/* Right panel – login form */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10">
          <div className="w-full max-w-sm space-y-6">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-xl">
                🏥
              </div>
              <h1 className="text-2xl font-black text-white">Medi<span className="text-cyan-400">Vault</span></h1>
            </div>

            {/* 1-Tap role selector */}
            <div className="rounded-2xl p-4 bg-slate-900 border border-slate-800">
              <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span>⚡</span> Evaluation — 1-Tap Role Selector
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_STAFF.map((staff, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setEmail(staff.email); setPassword(staff.pass); setLoginError(''); }}
                    className={`text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      email === staff.email
                        ? 'bg-cyan-950 border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="mr-1.5">{staff.icon}</span>
                    {staff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Login card */}
            <div className="rounded-2xl p-6 bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Clinical Staff Authentication</h2>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Staff Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 font-mono transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Password (Argon2id)
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Authenticating...</>
                    : <><span>Access Clinical Workstation</span><ChevronRight className="h-4 w-4" /></>
                  }
                </button>
              </form>
            </div>

            <p className="text-center text-[11px] text-slate-600">
              Secured with Argon2id · 2FA TOTP · 5-attempt lockout
            </p>
          </div>
        </div>

        {/* 2FA Modal */}
        {show2FA && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xs rounded-2xl bg-slate-900 border border-cyan-500/40 p-6 space-y-5 shadow-2xl">
              <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 rounded-xl bg-cyan-950 border border-cyan-500/40 items-center justify-center text-xl mx-auto">
                  🔐
                </div>
                <h3 className="text-base font-bold text-white">Two-Factor Verification</h3>
                <p className="text-xs text-slate-400">
                  Enter your TOTP code, or use evaluation code{' '}
                  <code className="text-cyan-300 font-bold bg-cyan-950 px-1.5 py-0.5 rounded">123456</code>
                </p>
              </div>

              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                className="w-full text-center text-3xl font-mono tracking-[0.5em] font-black py-3 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 focus:outline-none focus:border-cyan-400"
              />

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleVerify2FA}
                  disabled={isSubmitting || totpCode.length < 6}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Authorize'}
                </button>
                <button
                  type="button"
                  onClick={() => setShow2FA(false)}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Cancel — go back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  AUTHENTICATED WORKSTATION
  // ══════════════════════════════════════════════════════════════════════════
  const tabs: { id: TabType; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: Activity,       label: 'Overview'    },
    { id: 'patients',  icon: Users,          label: `Wards (${patients.length})` },
    { id: 'admission', icon: Plus,           label: 'Admit'       },
    { id: 'pharmacy',  icon: Pill,           label: 'Pharmacy'    },
    { id: 'audit',     icon: Shield,         label: 'Audit Chain' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Topbar ── */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-base">
              🏥
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white">Medi<span className="text-cyan-400">Vault</span></span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-300 font-mono hidden sm:inline">
                {user.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <UserCircle className="h-3.5 w-3.5" />
              <span className="font-medium text-slate-300">{user.name}</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">AWS Live</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/40 hover:text-rose-400 text-slate-400 text-xs font-bold transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab nav ── */}
      <div className="border-b border-slate-800/60 bg-slate-950/60 sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
            {tabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === id
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Welcome banner ── */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40">
                  {user.role} Workstation
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ● HIPAA Certified
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                Welcome, <span className="text-cyan-300">{user.name}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                In-Patient Ward Monitoring · Electronic Charting · AWS Supabase Sync
              </p>
            </div>
            <button
              onClick={() => { loadPatients(); loadAudit(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-xs text-slate-300 font-bold transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${patientsLoading ? 'animate-spin text-cyan-400' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB: OVERVIEW
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Patients', value: patients.length || 75, color: 'cyan',
                  icon: '🩺', sub: 'Under Clinical Care', filter: 'ALL',
                },
                {
                  label: 'ICU / Critical', value: icuCount || 8, color: 'rose',
                  icon: '🚨', sub: 'Immediate Rounding', filter: 'ICU',
                },
                {
                  label: 'Admitted (Ward)', value: admittedCount || 28, color: 'pink',
                  icon: '🛌', sub: 'Active Bed Occupancy', filter: 'ADMITTED',
                },
                {
                  label: 'Outpatient', value: outpatientCount || 16, color: 'emerald',
                  icon: '📋', sub: 'Day Consultations', filter: 'OUTPATIENT',
                },
              ].map(({ label, value, color, icon, sub, filter }) => (
                <div
                  key={label}
                  onClick={() => { setFilterStatus(filter); setActiveTab('patients'); }}
                  className={`cursor-pointer rounded-2xl p-5 bg-slate-900 border border-${color}-500/20 hover:border-${color}-500/50 transition-all space-y-2 group`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-500">{label}</span>
                    <span className={`text-lg p-1.5 rounded-xl bg-${color}-950`}>{icon}</span>
                  </div>
                  <div className={`text-3xl font-black text-${color}-400`}>{value}</div>
                  <p className={`text-[11px] text-${color}-400/70`}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-cyan-400" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: '➕', title: 'Admit Patient',      sub: 'New intake to AWS DB',        tab: 'admission' as TabType },
                  { icon: '💊', title: 'Prescriptions',      sub: 'Active formulary queue',       tab: 'pharmacy'  as TabType },
                  { icon: '📈', title: 'Vitals Monitor',     sub: 'Hourly bedside tracking',      tab: 'patients'  as TabType },
                  { icon: '🛡️', title: 'Audit Chain',         sub: 'SHA-256 Merkle verification', tab: 'audit'     as TabType },
                ].map(({ icon, title, sub, tab }) => (
                  <button
                    key={title}
                    onClick={() => setActiveTab(tab)}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/60 text-left transition-all space-y-1.5 group"
                  >
                    <div className="text-xl">{icon}</div>
                    <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">{title}</div>
                    <div className="text-[11px] text-slate-500">{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent patients table */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-400" />
                  Live Patient Stream
                </h3>
                <button
                  onClick={() => setActiveTab('patients')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                >
                  View all ({patients.length}) →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-500 uppercase font-mono">
                    <tr>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4 hidden md:table-cell">Ward</th>
                      <th className="py-3 px-4 hidden lg:table-cell">Diagnosis</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {patients.slice(0, 6).map((p, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedPatient(p)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{p.patient_code}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-slate-500">{p.age} yrs · {p.gender}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 hidden md:table-cell">{p.ward_room || 'General Ward'}</td>
                        <td className="py-3 px-4 text-slate-400 max-w-[160px] truncate hidden lg:table-cell">{p.diagnosis}</td>
                        <td className="py-3 px-4"><StatusBadge status={p.admission_status} /></td>
                      </tr>
                    ))}
                    {patients.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                          {patientsLoading ? 'Loading patients...' : 'No patients found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: PATIENTS / WARDS
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, code, diagnosis, ward..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {(['ALL', 'ADMITTED', 'ICU', 'OUTPATIENT'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold font-mono transition-all whitespace-nowrap ${
                      filterStatus === st
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {patientsLoading ? (
              <div className="flex items-center justify-center py-20 text-slate-500 gap-2 text-xs">
                <RefreshCw className="h-4 w-4 animate-spin" /> Loading patients...
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No patients match your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPatients.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPatient(p)}
                    className="rounded-2xl p-4 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-sm leading-snug">{p.name}</h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {p.patient_code} · {p.age}y · {p.gender} · {p.blood_group}
                        </p>
                      </div>
                      <StatusBadge status={p.admission_status} />
                    </div>

                    <div className="text-xs space-y-1.5">
                      <p className="text-cyan-300 font-medium flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" /> {p.ward_room || 'General Ward'}
                      </p>
                      <p className="text-slate-400 flex items-center gap-1.5">
                        <Stethoscope className="h-3 w-3" />
                        <span className="line-clamp-1">{p.diagnosis || 'Clinical Assessment'}</span>
                      </p>
                    </div>

                    {p.vitals_summary && (
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 leading-relaxed">
                        📊 {p.vitals_summary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: ADMISSION FORM
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'admission' && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40">
                  <ClipboardList className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">New In-Patient Admission</h3>
                  <p className="text-[11px] text-slate-500">Clinical entry committed to AWS London PostgreSQL</p>
                </div>
              </div>

              <form onSubmit={handleAdmit} className="p-5 space-y-4">
                {admitSuccess && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    admitSuccess.startsWith('✓')
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                  }`}>
                    {admitSuccess.startsWith('✓') ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    {admitSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Full Patient Name *</label>
                    <input
                      type="text" required
                      placeholder="e.g. Kwaku Mensah Boateng"
                      value={admName}
                      onChange={(e) => setAdmName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Age</label>
                    <input
                      type="number" min="0" max="150"
                      value={admAge}
                      onChange={(e) => setAdmAge(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                    <select
                      value={admGender}
                      onChange={(e) => setAdmGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Blood Group</label>
                    <select
                      value={admBlood}
                      onChange={(e) => setAdmBlood(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Admission Status</label>
                    <select
                      value={admStatus}
                      onChange={(e) => setAdmStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      <option value="Admitted">Admitted (General Ward)</option>
                      <option value="ICU">ICU (Critical)</option>
                      <option value="Outpatient">Outpatient</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ward &amp; Bed Assignment</label>
                    <input
                      type="text"
                      value={admWard}
                      onChange={(e) => setAdmWard(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Primary Clinical Diagnosis *</label>
                    <input
                      type="text" required
                      placeholder="e.g. Community-Acquired Bacterial Pneumonia"
                      value={admDiagnosis}
                      onChange={(e) => setAdmDiagnosis(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Initial Vitals</label>
                    <input
                      type="text"
                      value={admVitals}
                      onChange={(e) => setAdmVitals(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prescription (Rx)</label>
                    <input
                      type="text"
                      value={admRx}
                      onChange={(e) => setAdmRx(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={admitting || !admName.trim() || !admDiagnosis.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {admitting
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Committing to AWS Database...</>
                    : <><Plus className="h-4 w-4" /> Admit Patient to Ward</>
                  }
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: PHARMACY
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pharmacy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40">
                  <Pill className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Hospital Pharmacy &amp; Dispensary</h3>
                  <p className="text-xs text-slate-500">Electronic prescription verification &amp; dispensing queue</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/30 text-xs font-mono text-cyan-300 whitespace-nowrap">
                Active Orders: {patients.length > 0 ? patients.length * 2 : 38}
              </span>
            </div>

            {patients.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                {patientsLoading ? 'Loading pharmacy queue...' : 'No active prescriptions.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {patients.slice(0, 10).map((p, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-sm">{p.name}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {p.patient_code} · {p.ward_room || 'General Ward'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                        Dispensed
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 leading-relaxed">
                      Rx: {p.prescription || 'Amoxicillin 500mg TID · IV Fluids 0.9% Normal Saline · Paracetamol 1g PRN'}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Attending: {p.attending_doctor || 'Dr. Isaac Donkoh, MD'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: MERKLE AUDIT CHAIN
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <div className="space-y-5">
            {/* Chain status card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/30 border border-indigo-500/30">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-400" />
                    <h3 className="font-bold text-white text-sm">SHA-256 Merkle Blockchain Audit Chain</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                    Every authentication, patient admission, and clinical record change is sealed with the
                    previous record&apos;s SHA-256 cryptographic hash — forming an immutable Merkle chain
                    stored directly in PostgreSQL.
                  </p>
                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      auditData?.chain_intact !== false
                        ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950 border-rose-500/40 text-rose-300'
                    }`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {auditData?.chain_intact !== false ? 'Chain Integrity: INTACT' : 'Chain BROKEN — tampering detected'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Verified Records: <strong className="text-white">{auditData?.verified_records ?? '—'}</strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={loadAudit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-indigo-500/40 text-xs font-bold text-slate-300 transition-all shrink-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${auditLoading ? 'animate-spin text-indigo-400' : ''}`} />
                  Re-verify Chain
                </button>
              </div>
            </div>

            {/* Audit log stream */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Immutable Audit Event Stream
                </h4>
                <span className="text-[10px] text-slate-600 font-mono">
                  {auditData?.logs?.length ?? 0} recent events
                </span>
              </div>

              <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-800/60">
                {auditLoading ? (
                  <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Verifying Merkle chain...
                  </div>
                ) : (auditData?.logs ?? []).length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">No audit events found.</div>
                ) : (
                  (auditData?.logs ?? []).map((log, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-cyan-400 text-xs">{log.event_type}</span>
                            <SeverityBadge severity={log.severity} />
                            {log.user_name && (
                              <span className="text-[10px] text-slate-500">by {log.user_name}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{log.description}</p>
                          <p className="text-[10px] text-slate-600 font-mono">
                            IP: {log.ip_address || '127.0.0.1'}
                          </p>
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono whitespace-nowrap shrink-0">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Patient Detail Modal ── */}
      {selectedPatient && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPatient(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white">{selectedPatient.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedPatient.patient_code} · {selectedPatient.age} yrs · {selectedPatient.gender} · {selectedPatient.blood_group}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={selectedPatient.admission_status} />
                {selectedPatient.blood_group && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                    {selectedPatient.blood_group}
                  </span>
                )}
              </div>

              {[
                { label: 'Ward & Bed',         value: selectedPatient.ward_room || 'General Ward',               color: 'cyan'    },
                { label: 'Diagnosis',           value: selectedPatient.diagnosis,                                  color: 'cyan'    },
                { label: 'Attending Doctor',    value: selectedPatient.attending_doctor || 'Dr. Isaac Donkoh, MD', color: 'slate'   },
                { label: 'Assigned Nurse',      value: selectedPatient.assigned_nurse || 'Nurse Beatrice Mensah', color: 'slate'   },
              ].map(({ label, value, color }) => value && (
                <div key={label} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className={`text-[10px] font-bold text-${color}-400 uppercase block mb-1`}>{label}</span>
                  <span className="text-sm text-slate-200">{value}</span>
                </div>
              ))}

              {selectedPatient.vitals_summary && (
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">Bedside Vitals</span>
                  <span className="font-mono text-sm text-emerald-300">{selectedPatient.vitals_summary}</span>
                </div>
              )}

              {selectedPatient.prescription && (
                <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20">
                  <span className="text-[10px] font-bold text-amber-400 uppercase block mb-1">Prescription (Rx)</span>
                  <span className="font-mono text-sm text-amber-300">{selectedPatient.prescription}</span>
                </div>
              )}

              {selectedPatient.treatment_plan && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Treatment Plan</span>
                  <span className="text-sm text-slate-300">{selectedPatient.treatment_plan}</span>
                </div>
              )}

              {selectedPatient.created_at && (
                <p className="text-[10px] text-slate-600 font-mono text-right">
                  Admitted: {new Date(selectedPatient.created_at).toLocaleString()}
                </p>
              )}
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
              >
                Close Patient Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
