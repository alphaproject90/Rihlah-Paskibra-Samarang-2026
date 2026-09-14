'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { UserPlus, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DaftarPage() {
  const router = useRouter();

  const [nama, setNama] = useState('');
  const [jk, setJk] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [unit, setUnit] = useState('');
  const [partisipasi, setPartisipasi] = useState<'Ikut' | 'Tidak Ikut'>('Ikut');
  const [alasan, setAlasan] = useState('');
  const [waPeserta, setWaPeserta] = useState('');
  const [waDarurat, setWaDarurat] = useState('');
  const [medis, setMedis] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [successData, setSuccessData] = useState<{ id: string; nama: string; partisipasi: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim() || !unit.trim()) {
      setToast({ message: 'Nama lengkap dan asal sekolah/unit wajib diisi.', type: 'error' });
      return;
    }

    if (partisipasi === 'Ikut') {
      if (!waPeserta.trim() || !waDarurat.trim()) {
        setToast({ message: 'Nomor WhatsApp pribadi dan darurat wajib diisi.', type: 'error' });
        return;
      }
      if (!username.trim()) {
        setToast({ message: 'Username wajib diisi untuk login akun.', type: 'error' });
        return;
      }
      if (!password) {
        setToast({ message: 'Password wajib diisi.', type: 'error' });
        return;
      }
      if (password !== confirmPassword) {
        setToast({ message: 'Konfirmasi password tidak cocok.', type: 'error' });
        return;
      }
    } else {
      if (!alasan.trim()) {
        setToast({ message: 'Silakan cantumkan alasan tidak mengikuti rihlah.', type: 'error' });
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/peserta/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          jk,
          unit,
          partisipasi,
          alasan: partisipasi === 'Tidak Ikut' ? alasan : undefined,
          waPeserta: partisipasi === 'Ikut' ? waPeserta : undefined,
          waDarurat: partisipasi === 'Ikut' ? waDarurat : undefined,
          medis: partisipasi === 'Ikut' ? medis : undefined,
          username: partisipasi === 'Ikut' ? username : undefined,
          password: partisipasi === 'Ikut' ? password : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status === 'error') {
        setToast({ message: json.message || 'Pendaftaran gagal.', type: 'error' });
        setLoading(false);
        return;
      }

      setSuccessData({
        id: json.id,
        nama,
        partisipasi,
      });
      setToast({ message: 'Pendaftaran berhasil disimpan!', type: 'success' });
    } catch {
      setToast({ message: 'Terjadi gangguan koneksi internet. Silakan coba lagi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10">
        {successData ? (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Pendaftaran Berhasil!</h2>
            <p className="text-sm text-slate-400 mb-6">
              Terima kasih, data Anda telah resmi terdaftar dalam Sistem Giat Rihlah Paskibra Samarang 2026.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left mb-6 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-500">ID Registrasi:</span>
                <span className="font-mono font-bold text-blue-400">{successData.id}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-500">Nama Lengkap:</span>
                <span className="font-semibold text-white">{successData.nama}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-500">Partisipasi:</span>
                <span className={successData.partisipasi === 'Ikut' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {successData.partisipasi}
                </span>
              </div>
            </div>

            {successData.partisipasi === 'Ikut' ? (
              <div className="space-y-3">
                <Link
                  href="/login/peserta"
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  <span>Masuk ke Akun & Unduh Tiket QR</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-xs text-slate-500">
                  Gunakan username dan password yang baru saja Anda daftarkan.
                </p>
              </div>
            ) : (
              <Link
                href="/"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm block transition"
              >
                Kembali ke Beranda
              </Link>
            )}
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Formulir Pendaftaran Peserta</h1>
                <p className="text-xs text-slate-400">Giat Rihlah Paskibra Kecamatan Samarang 2026</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Abdul Fatah"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Jenis Kelamin & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={jk}
                    onChange={(e) => setJk(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Asal Sekolah / Satuan Unit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SMAN 17 Garut"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Partisipasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Konfirmasi Keikutsertaan *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPartisipasi('Ikut')}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition ${
                      partisipasi === 'Ikut'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Siap Ikut Rihlah
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartisipasi('Tidak Ikut')}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition ${
                      partisipasi === 'Tidak Ikut'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Tidak Dapat Ikut
                  </button>
                </div>
              </div>

              {/* Bagian Jika Tidak Ikut */}
              {partisipasi === 'Tidak Ikut' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Alasan Tidak Dapat Mengikuti Rihlah *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tuliskan alasan berhalangan hadir secara singkat dan jelas..."
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              ) : (
                <>
                  {/* WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        WhatsApp Pribadi *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="08123456789"
                        value={waPeserta}
                        onChange={(e) => setWaPeserta(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        WhatsApp Kontak Darurat *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="08987654321 (Ortu/Wali)"
                        value={waDarurat}
                        onChange={(e) => setWaDarurat(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  {/* Riwayat Medis */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Riwayat Medis / Alergi (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Asma, maag kronis, atau isi tanda strip (-)"
                      value={medis}
                      onChange={(e) => setMedis(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  {/* Kredensial Akun */}
                  <div className="pt-4 border-t border-slate-800">
                    <h3 className="text-sm font-bold text-blue-400 mb-3">Kredensial Akun Login Peserta</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Username Login *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="4-20 karakter, huruf, angka, underscore"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              placeholder="Min. 8 karakter kuat"
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

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Konfirmasi Password *
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Ketik ulang password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Password harus memiliki minimal 8 karakter dengan kombinasi huruf besar (A-Z), huruf kecil (a-z), angka (0-9), dan simbol khusus.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition active:scale-95"
              >
                {loading ? 'Menyimpan Data...' : 'Kirim Pendaftaran'}
              </button>
            </form>
          </div>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
