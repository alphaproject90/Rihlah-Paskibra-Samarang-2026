import React from 'react';
import { Header } from '@/components/Header';
import { Compass, UserPlus, LogIn, Shield, Calendar, MapPin, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Compass className="w-4 h-4 text-blue-400" />
              Sistem Resmi Paskibra Samarang
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
              Giat Rihlah <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Paskibra Kecamatan Samarang</span> 2026
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 mb-10 leading-relaxed">
              Platform registrasi terpadu, konfirmasi kehadiran, pembagian tiket digital QR Code, dan sistem presensi otomatis berbasis teknologi modern.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Link
                href="/daftar"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                Daftar Sekarang
              </Link>
              <Link
                href="/login/peserta"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                Login Peserta
              </Link>
              <Link
                href="/login/panitia"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/20 font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                Panitia
              </Link>
            </div>
          </div>
        </section>

        {/* Info Grid */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Waktu & Tempat */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Jadwal & Lokasi</h3>
              <ul className="text-sm text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Senin, 14 September 2026</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Kecamatan Samarang & Destinasi Rihlah</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Presensi QR Code */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Presensi Digital QR</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Setiap peserta terdaftar mendapatkan tiket resmi dengan QR Code unik. Cukup tunjukkan QR Code saat keberangkatan dan kepulangan tanpa antrean panjang.
              </p>
            </div>

            {/* Card 3: Keamanan Data */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Keamanan & Ketertiban</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Data terenkripsi menggunakan standard bcrypt, rate limiting pencegah serangan brute-force, dan audit trail presensi panitia real-time.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t border-slate-800 text-center text-xs text-slate-500">
        &copy; 2026 Paskibra Kecamatan Samarang &bull; Sistem Terpadu Manajemen Giat Rihlah
      </footer>
    </div>
  );
}
