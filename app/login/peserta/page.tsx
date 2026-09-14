'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPesertaPage() {
  const router = useRouter();

  // State Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // State Lupa Password Form
  const [modeLupaPassword, setModeLupaPassword] = useState(false);
  const [resetId, setResetId] = useState('');
  const [resetWa, setResetWa] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setToast({ message: 'Username dan password wajib diisi.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/peserta/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        setToast({ message: data.message || 'Login gagal. Periksa kembali username dan password Anda.', type: 'error' });
        setLoading(false);
        return;
      }

      setToast({ message: 'Login berhasil! Mengalihkan ke dashboard...', type: 'success' });
      router.push('/dashboard');
      router.refresh();
    } catch {
      setToast({ message: 'Terjadi gangguan jaringan saat login.', type: 'error' });
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetId.trim() || !resetWa.trim() || !resetNewPass) {
      setToast({ message: 'Semua bidang wajib diisi untuk verifikasi.', type: 'error' });
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setToast({ message: 'Konfirmasi password baru tidak cocok.', type: 'error' });
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/peserta/ganti-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: resetId,
          noWa: resetWa,
          newPassword: resetNewPass,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        setToast({ message: data.message || 'Gagal mereset password.', type: 'error' });
        setResetLoading(false);
        return;
      }

      setToast({
        message: 'Password berhasil diperbarui! Silakan masuk dengan password baru Anda.',
        type: 'success',
      });
      setModeLupaPassword(false);
      setPassword('');
    } catch {
      setToast({ message: 'Terjadi gangguan jaringan saat reset password.', type: 'error' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex flex-col justify-center">
        {modeLupaPassword ? (
          /* Formulir Lupa Password */
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl animate-in fade-in">
            <button
              onClick={() => setModeLupaPassword(false)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Form Login</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Reset Password</h1>
                <p className="text-xs text-slate-400">Verifikasi dengan WhatsApp terdaftar</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Username atau ID Peserta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: abdulf atau PASK-0001"
                  value={resetId}
                  onChange={(e) => setResetId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Nomor WhatsApp Terdaftar
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Nomor WA saat mendaftar (08...)"
                  value={resetWa}
                  onChange={(e) => setResetWa(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min. 8 karakter (besar, kecil, angka, simbol)"
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ketik ulang password baru"
                  value={resetConfirmPass}
                  onChange={(e) => setResetConfirmPass(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-amber-600/25 transition active:scale-95"
              >
                {resetLoading ? 'Memverifikasi...' : 'Simpan Password Baru'}
              </button>
            </form>
          </div>
        ) : (
          /* Formulir Login Standar */
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Login Peserta</h1>
                <p className="text-xs text-slate-400">Masuk untuk melihat Tiket QR Presensi</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Username atau ID Peserta
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username Anda"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setModeLupaPassword(true)}
                  className="text-xs text-blue-400 hover:underline font-medium"
                >
                  Lupa Password? Klik di sini untuk Ganti Password
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition active:scale-95"
              >
                {loading ? 'Memeriksa Kredensial...' : 'Masuk ke Dashboard'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-500">
                Belum mendaftar?{' '}
                <Link href="/daftar" className="text-blue-400 hover:underline font-medium">
                  Daftar Peserta di sini
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
