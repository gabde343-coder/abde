import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Eye, EyeOff, Lock, Mail, ShieldAlert, UserPlus } from 'lucide-react';
import { SchoolMark } from '../components/SchoolMark';
import { SchemaSetupModal } from '../components/SchemaSetupModal';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { user, loading, config, signIn } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'first-admin'>('login');
  const [needsFirstAdmin, setNeedsFirstAdmin] = useState(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/bootstrap-status')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const needAdmin = Boolean(data?.needsFirstAdmin);
        setNeedsFirstAdmin(needAdmin);
        if (needAdmin) {
          setMode('first-admin');
        }
      })
      .catch(() => {
        // Ignore network errors on bootstrap check
      })
      .finally(() => {
        if (active) setCheckingBootstrap(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (error) {
      setErrorMsg(
        error === 'Invalid login credentials'
          ? 'Email atau kata sandi salah. Silakan periksa kembali.'
          : error
      );
      return;
    }

    navigate('/app/dashboard', { replace: true });
  };

  const handleFirstAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setErrorMsg('Nama lengkap, email valid, dan kata sandi minimal 6 karakter wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register-first-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          nip: nip.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || 'Gagal mendaftarkan akun Administrator pertama.');
        setSubmitting(false);
        return;
      }

      // Sign in immediately with newly created first admin credentials
      const { error: signInErr } = await signIn(email.trim(), password);
      setSubmitting(false);

      if (signInErr) {
        setSuccessMsg('Akun Admin berhasil dibuat. Silakan masuk menggunakan kredensial Anda.');
        setNeedsFirstAdmin(false);
        setMode('login');
        return;
      }

      navigate('/app/dashboard', { replace: true });
    } catch {
      setSubmitting(false);
      setErrorMsg('Terjadi kesalahan koneksi ke server.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* Simple Top Bar */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 text-base font-bold text-zinc-900 whitespace-nowrap"
          >
            <SchoolMark size="sm" />
            <span>SMK Prima Unggul</span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Warning if Supabase Env Vars are not configured yet */}
          {!loading && !config.configured && (
            <div className="rounded-xl border border-red-200 bg-white p-5 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">
                    Konfigurasi Supabase Belum Terpasang
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    Tambahkan variabel <code className="font-mono font-semibold">SUPABASE_URL</code>,{' '}
                    <code className="font-mono font-semibold">SUPABASE_ANON_KEY</code>, dan{' '}
                    <code className="font-mono font-semibold">SUPABASE_SERVICE_ROLE_KEY</code> pada
                    panel Secrets / file <code className="font-mono">.env</code> untuk mengaktifkan
                    autentikasi dan database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                <Database className="h-3.5 w-3.5 text-red-600" />
                Lihat &amp; Salin Skema SQL (schema.sql)
              </button>
            </div>
          )}

          {/* Main Auth Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-7 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold text-red-600 mb-1">Portal Absensi Terpadu</p>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {mode === 'first-admin' ? 'Registrasi Admin Pertama' : 'Masuk ke Aplikasi'}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {mode === 'first-admin'
                  ? 'Belum ada akun terdaftar. Pengguna pertama otomatis menjadi Administrator.'
                  : 'Gunakan akun yang terdaftar untuk Admin, Guru, atau Tenaga Kependidikan.'}
              </p>
            </div>

            {needsFirstAdmin && (
              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('first-admin');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    mode === 'first-admin'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Daftar Admin Pertama
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    mode === 'login'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Masuk Akun
                </button>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
              >
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700"
              >
                {successMsg}
              </div>
            )}

            {mode === 'first-admin' ? (
              <form onSubmit={handleFirstAdminSubmit} className="space-y-4">
                <div>
                  <label htmlFor="first-name" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    id="first-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Drs. Ahmad Fauzi"
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  />
                </div>

                <div>
                  <label htmlFor="first-nip" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    NIP / NUPTK (Opsional)
                  </label>
                  <input
                    id="first-nip"
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="198504122010011002"
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  />
                </div>

                <div>
                  <label htmlFor="first-email" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Email Sekolah
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="first-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@smkprimaunggul.sch.id"
                      className="w-full rounded-lg border border-zinc-300 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="first-password" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="first-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full rounded-lg border border-zinc-300 pl-10 pr-10 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !config.configured}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  {submitting ? 'Memproses...' : 'Buat Akun Administrator Pertama'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@smkprimaunggul.sch.id"
                      className="w-full rounded-lg border border-zinc-300 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full rounded-lg border border-zinc-300 pl-10 pr-10 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !config.configured || checkingBootstrap}
                  className="w-full py-2.5 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
              <span>Terhubung ke Supabase Auth</span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(true)}
                className="font-semibold text-zinc-700 hover:text-red-600 transition-colors"
              >
                Panduan Skema SQL
              </button>
            </div>
          </div>
        </div>
      </main>

      <SchemaSetupModal open={schemaModalOpen} onClose={() => setSchemaModalOpen(false)} />
    </div>
  );
}
