import React from 'react';
import { Header } from '@/components/Header';
import { User, Shield, ArrowRight, Compass } from 'lucide-react';
import Link from 'next/link';

export default function LoginChoicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Pilih Akses Masuk</h1>
          <p className="text-sm text-slate-400">
            Silakan pilih peran Anda untuk melanjutkan ke portal sistem.
          </p>
        </div>

        <div className="space-y-4">
          {/* Card Peserta */}
          <Link
            href="/login/peserta"
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-900/90 transition flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:scale-105 transition">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                  Login Peserta Rihlah
                </h2>
                <p className="text-xs text-slate-400">
                  Akses tiket digital QR Code dan cek status presensi
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
          </Link>

          {/* Card Panitia */}
          <Link
            href="/login/panitia"
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900/90 transition flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                  Portal Panitia (Admin)
                </h2>
                <p className="text-xs text-slate-400">
                  Scan QR presensi, statistik kegiatan, dan manajemen data
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Belum mendaftarkan diri?{' '}
            <Link href="/daftar" className="text-blue-400 hover:underline font-medium">
              Daftar di sini
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
