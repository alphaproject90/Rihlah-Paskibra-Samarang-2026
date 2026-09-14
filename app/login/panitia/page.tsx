'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPanitiaPage() {
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setToast({ message: 'Masukkan minimal 4 digit PIN Panitia.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/panitia/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        setToast({ message: data.message || 'PIN Panitia salah.', type: 'error' });
        setLoading(false);
        return;
      }

      setToast({ message: 'Autentikasi Panitia Berhasil!', type: 'success' });
      router.push('/panitia');
      router.refresh();
    } catch {
      setToast({ message: 'Terjadi gangguan jaringan.', type: 'error' });
      setLoading(false);
    }
  };

  const addDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const removeDigit = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      <main className="flex-1 max-w-sm w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Autentikasi Panitia</h1>
            <p className="text-xs text-slate-400 mt-1">Masukkan PIN Khusus Panitia Rihlah</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="PIN Panitia"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Numeric Keypad Helper */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => addDigit(n)}
                  className="py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-base transition active:scale-95"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="py-3 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 text-rose-400 font-semibold text-xs transition active:scale-95"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => addDigit('0')}
                className="py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-base transition active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={removeDigit}
                className="py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 font-semibold text-sm transition active:scale-95"
              >
                ⌫
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-amber-600/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300">
              &larr; Kembali ke pilihan login
            </Link>
          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
