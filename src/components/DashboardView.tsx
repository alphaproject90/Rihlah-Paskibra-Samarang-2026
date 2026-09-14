import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Wallet, 
  Tent, 
  QrCode, 
  UserPlus, 
  RefreshCw, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Compass, 
  CalendarDays,
  ArrowRight,
  ShieldAlert,
  Flame,
  Check
} from 'lucide-react';
import { Peserta, RundownItem, ReguInfo, TransaksiKeuangan } from '../types';
import { TabType } from './Navbar';

interface DashboardViewProps {
  peserta: Peserta[];
  rundown: RundownItem[];
  reguList: ReguInfo[];
  keuangan: TransaksiKeuangan[];
  setActiveTab: (tab: TabType) => void;
  onOpenAddPeserta: () => void;
  onSyncGoogleSheets: () => void;
  isSyncing: boolean;
  isSyncedWithSheets: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  peserta,
  rundown,
  reguList,
  keuangan,
  setActiveTab,
  onOpenAddPeserta,
  onSyncGoogleSheets,
  isSyncing,
  isSyncedWithSheets
}) => {
  // Calculations
  const totalPeserta = peserta.length;
  const hadirCount = peserta.filter(p => p.statusPresensi === 'Hadir').length;
  const belumHadirCount = peserta.filter(p => p.statusPresensi === 'Belum Hadir').length;
  const izinCount = peserta.filter(p => p.statusPresensi === 'Izin' || p.statusPresensi === 'Sakit').length;
  const kehadiranPercent = totalPeserta > 0 ? Math.round((hadirCount / totalPeserta) * 100) : 0;

  const totalPemasukan = keuangan
    .filter(k => k.tipe === 'Pemasukan' && k.status === 'Disetujui')
    .reduce((sum, item) => sum + item.jumlah, 0);
  const totalPengeluaran = keuangan
    .filter(k => k.tipe === 'Pengeluaran' && k.status === 'Disetujui')
    .reduce((sum, item) => sum + item.jumlah, 0);
  const saldoKas = totalPemasukan - totalPengeluaran;

  const totalIuranLunas = peserta.filter(p => p.statusBayar === 'Lunas').length;

  // Active rundown item
  const currentActivity = rundown.find(r => r.status === 'Sedang Berlangsung') || rundown[0];
  const upcomingActivity = rundown.find(r => r.status === 'Mendatang');

  // Medical alert count
  const withMedicalNotes = peserta.filter(
    p => p.riwayatMedis && p.riwayatMedis.trim().toLowerCase() !== 'tidak ada' && p.riwayatMedis.trim() !== '-'
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Event Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 text-white shadow-xl border border-red-900/40 p-6 sm:p-8">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-200 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              Giat Rihlah Paskibar 2026 • Kecamatan Samarang, Garut
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Sistem Manajemen & Presensi Rihlah
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Pusat komando dan manajemen terpadu: data peserta, presensi scan QR apel pelepasan, rundown kegiatan alam, pembagian regu barak tenda, serta sinkronisasi otomatis ke Google Sheets & Supabase.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <CalendarDays className="w-4 h-4 text-red-400" />
                Sabtu - Minggu, 2 Hari 1 Malam
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-red-400" />
                Bumi Perkemahan Kamojang, Samarang
              </span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400" />
                PostgreSQL & Prisma Engine
              </span>
            </div>
          </div>

          {/* Action Quick Buttons inside Hero */}
          <div className="flex flex-row md:flex-col gap-2.5 shrink-0">
            <button
              id="hero-scan-btn"
              onClick={() => setActiveTab('presensi')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              Scan Presensi QR
            </button>
            <button
              id="hero-add-peserta-btn"
              onClick={onOpenAddPeserta}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/15 backdrop-blur-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              + Peserta Baru
            </button>
            <button
              id="hero-sync-btn"
              onClick={onSyncGoogleSheets}
              disabled={isSyncing}
              className="hidden sm:flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Menyinkronkan...' : isSyncedWithSheets ? 'Sync Google Sheets' : 'Hubungkan Sheets'}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Statistics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Peserta */}
        <div 
          onClick={() => setActiveTab('peserta')}
          className="group p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-red-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Personel</span>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{totalPeserta}</span>
            <span className="text-xs text-slate-500">Orang Terdaftar</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>Lunas Iuran: <strong className="text-slate-800">{totalIuranLunas}</strong></span>
            <span className="text-red-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Kelola <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 2: Presensi Lapangan */}
        <div 
          onClick={() => setActiveTab('presensi')}
          className="group p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Presensi Kehadiran</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-600">{hadirCount}</span>
            <span className="text-xs text-slate-500">/ {totalPeserta} Hadir ({kehadiranPercent}%)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>Belum: <strong className="text-amber-600">{belumHadirCount}</strong> • Izin: <strong className="text-slate-600">{izinCount}</strong></span>
            <span className="text-emerald-700 font-medium flex items-center gap-0.5">
              Scan QR <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 3: Kas & Anggaran */}
        <div 
          onClick={() => setActiveTab('keuangan')}
          className="group p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saldo Kas Rihlah</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Rp {saldoKas.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>Masuk: <strong className="text-emerald-600">Rp {(totalPemasukan/1000).toFixed(0)}k</strong></span>
            <span className="text-blue-600 font-medium flex items-center gap-0.5">
              Rincian <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 4: Pembagian Regu */}
        <div 
          onClick={() => setActiveTab('regu')}
          className="group p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Regu & Barak Tenda</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Tent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{reguList.length}</span>
            <span className="text-xs text-slate-500">Regu Peleton Aktif</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>Kapasitas Tenda: <strong className="text-slate-800">48 Orang</strong></span>
            <span className="text-purple-600 font-medium flex items-center gap-0.5">
              Tenda <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

      </div>

      {/* Middle Grid: Activity Status & Field Health Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Live Tracker (2 cols on large screen) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100 text-red-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Agenda & Rundown Berjalan</h3>
                <p className="text-xs text-slate-500">Pantauan waktu kegiatan rihlah secara realtime</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('rundown')}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              Lihat Semua Jadwal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Activity Card */}
          {currentActivity && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 border border-red-200">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white uppercase tracking-wider animate-pulse">
                      Sedang Berlangsung
                    </span>
                    <span className="text-xs font-bold text-slate-700">Hari ke-{currentActivity.hari} • {currentActivity.waktu}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{currentActivity.namaKegiatan}</h4>
                  <p className="text-xs text-slate-600">{currentActivity.keterangan}</p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-red-200/60 flex flex-wrap items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  {currentActivity.lokasi}
                </span>
                <span>PJ: <strong>{currentActivity.penanggungJawab}</strong></span>
              </div>
            </div>
          )}

          {/* Upcoming Next Activity */}
          {upcomingActivity && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-500">Kegiatan Selanjutnya:</span>
                <p className="font-semibold text-slate-800 text-sm">{upcomingActivity.namaKegiatan}</p>
                <p className="text-slate-500">{upcomingActivity.waktu} • {upcomingActivity.lokasi}</p>
              </div>
              <span className="px-2 py-1 rounded bg-slate-200 text-slate-700 font-medium text-[11px]">
                PJ: {upcomingActivity.penanggungJawab}
              </span>
            </div>
          )}

          {/* Quick Stats on Schools Participating */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Satuan Pangkalan Sekolah di Kecamatan Samarang:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['SMAN 1 Samarang', 'SMKN 1 Garut (Samarang)', 'MA Nurul Huda', 'SMPN 1 Samarang', 'SMK Patriot Samarang', 'Purna Paskibra'].map((sch) => (
                <span key={sch} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60">
                  {sch}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Medical & Emergency Radar */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Perhatian Medis Lapangan</h3>
                <p className="text-xs text-slate-500">Catatan kesehatan khusus peserta</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {withMedicalNotes.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Semua peserta dalam kondisi prima.</p>
            ) : (
              withMedicalNotes.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{p.nama}</span>
                    <span className="text-amber-800 font-semibold">{p.regu}</span>
                  </div>
                  <p className="text-amber-900 font-medium">⚠️ {p.riwayatMedis}</p>
                  <p className="text-slate-500 text-[11px]">Darurat: {p.kontakDarurat}</p>
                </div>
              ))
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-red-500" /> Posko Medis & Evakuasi
            </span>
            <p>Tenda Medis Utama berada di sebelah barat Tenda Induk Panitia. Dilengkapi tabung oksigen & tandu evakuasi.</p>
          </div>

        </div>

      </div>

    </div>
  );
};
