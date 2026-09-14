'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { QrCode, CheckCircle2, Clock, MapPin, School, User, Download, KeyRound, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

interface PesertaProfile {
  id: string;
  nama: string;
  jk: string;
  unit: string;
  partisipasi: string;
  waktuBerangkat?: string;
  waktuPulang?: string;
}

export default function DashboardPesertaPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PesertaProfile | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Ganti password modal/section
  const [showGantiPass, setShowGantiPass] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gantiLoading, setGantiLoading] = useState(false);

  useEffect(() => {
    async function fetchPesertaData() {
      try {
        const res = await fetch('/api/peserta/me').catch(() => null);
        // Jika endpoint /me belum ada, ambil dari sesi peserta
      } catch {
        //
      }
    }
  }, []);

  // Fetch session data
  useEffect(() => {
    async function loadData() {
      try {
        // Ambil status profil terbaru
        const res = await fetch('/api/peserta/profile');
        if (!res.ok) {
          // Bila gagal atau tidak ada sesi, router akan diarahkan oleh middleware
          return;
        }
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          setProfile(json.data);
          // Generate QR Code image
          const qrCodeStr = json.data.id;
          const url = await QRCode.toDataURL(qrCodeStr, {
            width: 280,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error('Error memuat data peserta:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleGantiPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setToast({ message: 'Semua bidang wajib diisi.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ message: 'Konfirmasi password baru tidak cocok.', type: 'error' });
      return;
    }

    setGantiLoading(true);
    try {
      const res = await fetch('/api/auth/peserta/ganti-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const json = await res.json();
      if (!res.ok || json.status === 'error') {
        setToast({ message: json.message || 'Gagal mengganti password.', type: 'error' });
        setGantiLoading(false);
        return;
      }

      setToast({ message: 'Password berhasil diubah!', type: 'success' });
      setShowGantiPass(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setToast({ message: 'Terjadi gangguan jaringan.', type: 'error' });
    } finally {
      setGantiLoading(false);
    }
  };

  const handleDownloadTicket = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Tiket-Rihlah-${profile?.id || 'QR'}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header userType="peserta" userName={profile?.nama} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Memuat profil dan tiket presensi digital...</p>
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Kolom Kiri: Tiket QR Code Resmi */}
            <div className="md:col-span-6 flex flex-col items-center">
              <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 shadow-2xl relative overflow-hidden text-center">
                {/* Badge Tiket */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  <QrCode className="w-3.5 h-3.5" />
                  Tiket Resmi Presensi
                </div>

                <h2 className="text-lg font-bold text-white mb-1">{profile.nama}</h2>
                <p className="text-xs text-slate-400 mb-4">{profile.unit}</p>

                {/* QR Code Canvas */}
                <div className="p-3 bg-white rounded-2xl shadow-inner inline-block mx-auto mb-4">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code Presensi"
                      className="w-52 h-52 object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                      Menyiapkan QR...
                    </div>
                  )}
                </div>

                {/* ID Tag */}
                <div className="py-1.5 px-4 bg-slate-900 rounded-lg border border-slate-800 inline-block text-sm font-mono font-bold text-blue-400 mb-5">
                  {profile.id}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  Tunjukkan QR Code ini kepada panitia saat keberangkatan dan kepulangan di titik kumpul.
                </p>

                <button
                  onClick={handleDownloadTicket}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Gambar QR</span>
                </button>
              </div>
            </div>

            {/* Kolom Kanan: Status Presensi & Info Detail */}
            <div className="md:col-span-6 space-y-6">
              {/* Card Status Keberangkatan & Kepulangan */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Status Presensi Giat Rihlah
                </h3>

                <div className="space-y-3">
                  {/* Status Keberangkatan */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block">Presensi Keberangkatan</span>
                      <span className="text-xs text-slate-500">
                        {profile.waktuBerangkat
                          ? new Date(profile.waktuBerangkat).toLocaleString('id-ID')
                          : 'Belum scan di pos keberangkatan'}
                      </span>
                    </div>
                    {profile.waktuBerangkat ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Hadir
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                        Menunggu
                      </span>
                    )}
                  </div>

                  {/* Status Kepulangan */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block">Presensi Kepulangan</span>
                      <span className="text-xs text-slate-500">
                        {profile.waktuPulang
                          ? new Date(profile.waktuPulang).toLocaleString('id-ID')
                          : 'Belum scan di pos kepulangan'}
                      </span>
                    </div>
                    {profile.waktuPulang ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Hadir
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                        Menunggu
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Informasi Peserta */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  Informasi Data Peserta
                </h3>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">ID Peserta:</span>
                    <span className="font-mono font-bold text-blue-400">{profile.id}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Nama Lengkap:</span>
                    <span className="font-semibold text-white">{profile.nama}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Jenis Kelamin:</span>
                    <span className="text-slate-200">{profile.jk}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Asal Unit / Sekolah:</span>
                    <span className="text-slate-200">{profile.unit}</span>
                  </div>
                </div>
              </div>

              {/* Ganti Password Button & Form */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Keamanan Akun</span>
                  </div>
                  <button
                    onClick={() => setShowGantiPass(!showGantiPass)}
                    className="text-xs text-blue-400 hover:underline font-medium"
                  >
                    {showGantiPass ? 'Batal' : 'Ganti Password'}
                  </button>
                </div>

                {showGantiPass && (
                  <form onSubmit={handleGantiPassword} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Password Saat Ini
                      </label>
                      <input
                        type="password"
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Min. 8 karakter kuat"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={gantiLoading}
                      className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition disabled:opacity-50"
                    >
                      {gantiLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300">Sesi login tidak ditemukan.</p>
          </div>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
