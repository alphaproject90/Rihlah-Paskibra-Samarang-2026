import React, { useState, useEffect } from 'react';
import { 
  ToggleLeft, 
  ToggleRight, 
  ShieldCheck, 
  KeyRound, 
  AlertTriangle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  RotateCw,
  Ban,
  Clock,
  Phone
} from 'lucide-react';
import { StatsRihlah } from '../../types';
import { apiService, PanitiaPendingResetItem } from '../../services/apiService';
import { STRONG_PASSWORD_REGEX } from '../../../lib/validation';

interface PengaturanViewProps {
  stats: StatsRihlah;
  onRefresh: () => void;
  tampilkanNotif?: (pesan: string, tipe?: 'info' | 'success' | 'error') => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  stats,
  onRefresh,
  tampilkanNotif,
}) => {
  // Ambil status pendaftaran dari stats (default true jika undefined)
  const statsAktif = (stats as any)?.data ?? stats;
  const pendaftaranDibuka = statsAktif?.pendaftaranDibuka ?? true;

  const [saving, setSaving] = useState(false);

  // State untuk form Ganti Password Panitia
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // State untuk antrean reset password peserta
  const [resetQueue, setResetQueue] = useState<PanitiaPendingResetItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchResetQueue = async () => {
    setLoadingQueue(true);
    try {
      const res = await apiService.getPanitiaPendingResets();
      if (res.success && res.data) {
        setResetQueue(res.data);
      }
    } catch {
      // ignore network errors
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchResetQueue();
  }, []);

  const handleSendWa = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const res = await apiService.generatePanitiaWaLink(requestId);
      if (res.success && res.data?.waLink) {
        window.open(res.data.waLink, '_blank');
        if (tampilkanNotif) {
          tampilkanNotif('Tautan WhatsApp berhasil dibuka. Silakan kirimkan pesan ke peserta.', 'success');
        }
        await fetchResetQueue();
      } else {
        if (tampilkanNotif) {
          tampilkanNotif(res.message || res.error || 'Gagal membuat tautan WhatsApp.', 'error');
        }
      }
    } catch {
      if (tampilkanNotif) {
        tampilkanNotif('Terjadi kendala saat memproses tautan WhatsApp.', 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelReset = async (requestId: string) => {
    const confirm = window.confirm('Apakah Anda yakin ingin membatalkan permohonan reset password ini?');
    if (!confirm) return;

    setProcessingId(requestId);
    try {
      const res = await apiService.cancelPanitiaReset(requestId);
      if (res.success) {
        if (tampilkanNotif) {
          tampilkanNotif('Permohonan reset password berhasil dibatalkan.', 'info');
        }
        await fetchResetQueue();
      } else {
        if (tampilkanNotif) {
          tampilkanNotif(res.message || res.error || 'Gagal membatalkan permohonan.', 'error');
        }
      }
    } catch {
      if (tampilkanNotif) {
        tampilkanNotif('Terjadi kendala saat membatalkan permohonan.', 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleTogglePendaftaran = async () => {
    const targetStatus = !pendaftaranDibuka;

    if (!targetStatus) {
      const konfirmasi = window.confirm(
        'PERINGATAN: Anda akan MENUTUP gerbang pendaftaran peserta.\n\n' +
        'Calon peserta yang membuka web tidak akan dapat mengirim formulir pendaftaran baru.\n\n' +
        'Apakah Anda yakin ingin menutup pendaftaran?'
      );
      if (!konfirmasi) return;
    }

    try {
      setSaving(true);
      const res = await apiService.updatePengaturan(targetStatus);
      if (res.ok) {
        if (tampilkanNotif) {
          tampilkanNotif(
            targetStatus 
              ? 'Gerbang pendaftaran berhasil DIBUKA kembali.' 
              : 'Gerbang pendaftaran telah DITUTUP.',
            'success'
          );
        }
        onRefresh();
      } else {
        if (tampilkanNotif) {
          tampilkanNotif(res.message || 'Gagal mengubah status pendaftaran.', 'error');
        }
      }
    } catch {
      if (tampilkanNotif) {
        tampilkanNotif('Terjadi kesalahan jaringan saat memperbarui status pendaftaran.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleGantiPasswordPanitia = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!oldPassword.trim()) {
      setPasswordError('Password lama wajib diisi.');
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      setPasswordError('Password baru minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await apiService.gantiPasswordPanitia(oldPassword, newPassword, confirmPassword);
      if (res.ok) {
        if (tampilkanNotif) {
          tampilkanNotif(res.message || 'Password panitia berhasil diperbarui!', 'success');
        }
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError(null);
      } else {
        const errorMsg = res.message || 'Gagal mengubah password panitia.';
        setPasswordError(errorMsg);
        if (tampilkanNotif) {
          tampilkanNotif(errorMsg, 'error');
        }
      }
    } catch {
      const errorMsg = 'Terjadi kesalahan jaringan saat memperbarui password panitia.';
      setPasswordError(errorMsg);
      if (tampilkanNotif) {
        tampilkanNotif(errorMsg, 'error');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              Kontrol Sistem &amp; Kebijakan Operasional
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola status gerbang pendaftaran publik dan kelola kredensial keamanan akun panitia rihlah.
            </p>
          </div>
        </div>
      </div>

      {/* Bagian 1: Kontrol Buka/Tutup Pendaftaran */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Status Gerbang Pendaftaran Peserta
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  pendaftaranDibuka
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    pendaftaranDibuka ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                {pendaftaranDibuka ? 'Pendaftaran Buka' : 'Pendaftaran Tutup'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Ketika ditutup, calon peserta tidak dapat mengirim formulir pendaftaran baru di halaman publik.
              Backend API akan menolak setiap request registrasi dengan status 403 Forbidden.
            </p>
          </div>

          <button
            type="button"
            id="panitia-btn-toggle-pendaftaran"
            disabled={saving}
            onClick={handleTogglePendaftaran}
            className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs shrink-0 ${
              pendaftaranDibuka
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : pendaftaranDibuka ? (
              <>
                <ToggleRight className="w-5 h-5 text-rose-600" />
                <span>Tutup Pendaftaran Sekarang</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-white" />
                <span>Buka Pendaftaran Sekarang</span>
              </>
            )}
          </button>
        </div>

        {/* Info Banner Konsekuensi */}
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-3 ${
            pendaftaranDibuka
              ? 'bg-emerald-50/60 border border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border border-amber-200 text-amber-900'
          }`}
        >
          {pendaftaranDibuka ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold">
              {pendaftaranDibuka
                ? 'Sistem Sedang Menerima Pendaftaran'
                : 'Pendaftaran Ditutup Secara Global'}
            </span>
            <p className="mt-0.5">
              {pendaftaranDibuka
                ? 'Formulir pendaftaran dapat diakses bebas oleh seluruh calon peserta. Setiap submisi baru akan dicatat ke database dan kuota terpotong otomatis.'
                : 'Halaman formulir pendaftaran menampilkan pengumuman bahwa kuota/periode pendaftaran telah berakhir. Tombol kirim formulir dinonaktifkan sepenuhnya.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bagian 2: Form Interaktif Ganti Password Panitia */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Ganti Password Akun Panitia
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                Keamanan Akun
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Perbarui password akun panitia secara instan tanpa perlu mengedit Environment Variables atau redeploy server.
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleGantiPasswordPanitia} className="space-y-4 max-w-xl">
          {/* Password Lama */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password Panitia Saat Ini <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="panitia-old-password-input"
                type={showOldPass ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Masukkan password yang sedang aktif"
                className="w-full bg-slate-50 text-slate-900 p-2.5 sm:p-3 pr-10 rounded-xl border border-slate-200 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition"
              />
              <button
                type="button"
                id="panitia-toggle-old-pass-btn"
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showOldPass ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Baru */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="panitia-new-password-input"
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Minimal 8 karakter kombinasi"
                className="w-full bg-slate-50 text-slate-900 p-2.5 sm:p-3 pr-10 rounded-xl border border-slate-200 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition"
              />
              <button
                type="button"
                id="panitia-toggle-new-pass-btn"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showNewPass ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Wajib kombinasi huruf besar (A-Z), huruf kecil (a-z), angka (0-9), dan simbol (!@#$%^&amp;*).
            </p>
          </div>

          {/* Konfirmasi Password Baru */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Konfirmasi Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="panitia-confirm-password-input"
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ulangi password baru persis"
                className="w-full bg-slate-50 text-slate-900 p-2.5 sm:p-3 pr-10 rounded-xl border border-slate-200 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition"
              />
              <button
                type="button"
                id="panitia-toggle-confirm-pass-btn"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showConfirmPass ? 'Sembunyikan konfirmasi' : 'Lihat konfirmasi'}
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi password cocok
              </p>
            )}
          </div>

          {/* Tombol Simpan Password */}
          <div className="pt-2">
            <button
              type="submit"
              id="panitia-btn-submit-password"
              disabled={savingPassword || !oldPassword || !newPassword || !confirmPassword}
              className="cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi &amp; Menyimpan...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Simpan Password Baru</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Bagian 3: Antrean Reset Password Peserta (OTP WhatsApp) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  Antrean Reset Password Peserta (OTP WhatsApp)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {resetQueue.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirimkan kode OTP resmi ke nomor WhatsApp peserta yang mengajukan lupa password.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchResetQueue}
            disabled={loadingQueue}
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 disabled:opacity-50 self-start sm:self-auto"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
            <span>Segarkan Antrean</span>
          </button>
        </div>

        {loadingQueue && resetQueue.length === 0 ? (
          <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Memuat data antrean permohonan...</span>
          </div>
        ) : resetQueue.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-1.5" />
            <span className="font-semibold text-slate-600 block">Tidak ada antrean reset aktif</span>
            <span>Semua permohonan telah selesai diproses atau belum ada pengajuan baru.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Peserta &amp; Unit</th>
                  <th className="p-3">No. WhatsApp</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Percobaan</th>
                  <th className="p-3">Waktu</th>
                  <th className="p-3 text-right">Aksi Panitia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resetQueue.map((item) => {
                  const isProcessing = processingId === item.id;
                  const isSent = item.status === 'SENT';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{item.nama}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{item.idPeserta}</span>
                        <span className="text-[10px] text-slate-500 block">{item.unit}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {item.noWaTersensor}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSent
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isSent ? 'Terkirim' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {item.attempts} / 3
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">
                        <div>Diajukan: {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                        {item.sentAt && (
                          <div className="text-[10px] text-blue-600 font-medium">
                            Kirim: {new Date(item.sentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({item.sentBy || 'panitia'})
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSendWa(item.id)}
                          disabled={isProcessing}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5" />
                          )}
                          <span>{isSent ? 'Kirim Ulang WA' : 'Kirim OTP via WA'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelReset(item.id)}
                          disabled={isProcessing}
                          className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition active:scale-95 disabled:opacity-50"
                          title="Batalkan permohonan reset ini"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Batalkan</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

