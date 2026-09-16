import React, { useState } from 'react';
import { 
  ToggleLeft, 
  ToggleRight, 
  ShieldCheck, 
  KeyRound, 
  ExternalLink, 
  Info, 
  AlertTriangle,
  Loader2,
  Lock
} from 'lucide-react';
import { StatsRihlah } from '../../types';
import { apiService } from '../../services/apiService';

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
              Kelola status gerbang pendaftaran publik dan tinjau prosedur keamanan akun pengelola rihlah.
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

      {/* Bagian 2: Panduan Kredensial & Rotasi Password Panitia (Statis / Descope) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Manajemen Kredensial Panitia (Zero-Database Exposure)
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Environment Variable
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Demi standar keamanan operasional tingkat tinggi, kredensial panitia tidak disimpan di dalam database publik.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Info className="w-4 h-4 text-slate-500" />
            Prosedur Rotasi Password Panitia:
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
            <li>
              Buat hash password baru menggunakan algoritma <code className="px-1.5 py-0.5 bg-slate-200/70 rounded text-slate-800 font-mono">bcrypt</code> (rekomendasi: 10 salt rounds).
            </li>
            <li>
              Buka Vercel Dashboard proyek ini: <strong className="text-slate-800">Project Settings → Environment Variables</strong>.
            </li>
            <li>
              Perbarui nilai variabel <code className="px-1.5 py-0.5 bg-slate-200/70 rounded text-slate-800 font-mono">PANITIA_PASSWORD_HASH</code> dengan hash baru yang telah dibuat.
            </li>
            <li>
              Lakukan <strong className="text-slate-800">Redeploy</strong> agar fungsi serverless memuat variabel lingkungan yang baru diperbarui.
            </li>
          </ol>
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Rotasi manual mencegah risiko kebocoran kredensial bila database terekspos.
            </span>
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
            >
              Buka Vercel Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
