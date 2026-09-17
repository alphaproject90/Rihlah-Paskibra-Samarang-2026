import React, { useState } from 'react';
import { 
  Menu, 
  RefreshCw, 
  QrCode, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  UserX,
  Sparkles,
  ClipboardList,
  Home
} from 'lucide-react';
import { PanitiaTabType } from './types';
import { SidebarPanitia } from './SidebarPanitia';
import { RekapExportView } from './RekapExportView';
import { DokumenPdfView } from './DokumenPdfView';
import { LogSistemView } from './LogSistemView';
import { PengaturanView } from './PengaturanView';
import { ManajemenAdminView } from './ManajemenAdminView';
import { AbsenKegiatanView } from './AbsenKegiatanView';
import { StatsRihlah, PesertaRihlah } from '../../types';

interface DashboardPanitiaShellProps {
  panitiaTab: PanitiaTabType;
  onTabChange: (tab: PanitiaTabType) => void;
  onLogout: () => void;
  stats: StatsRihlah;
  pesertaList: PesertaRihlah[];
  onRefresh: () => void;
  onRefreshPeserta: () => void | Promise<void>;
  tampilkanNotif?: (pesan: string, tipe?: 'info' | 'success' | 'error') => void;
  onBukaScanner: (mode: 'registrasi_ulang' | 'berangkat' | 'pulang' | 'pulang_dari_lokasi' | 'tiba_di_rumah') => void;
  loading: boolean;
  panitiaRole?: string;    // 'SUPER_ADMIN' | 'ADMIN_MOBIL'
  panitiaUsername?: string;
}

export const DashboardPanitiaShell: React.FC<DashboardPanitiaShellProps> = ({
  panitiaTab,
  onTabChange,
  onLogout,
  stats,
  pesertaList,
  onRefresh,
  onRefreshPeserta,
  tampilkanNotif,
  onBukaScanner,
  loading,
  panitiaRole,
  panitiaUsername,
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const isSuperAdmin = !panitiaRole || panitiaRole === 'SUPER_ADMIN';

  // Normalisasi data statistik
  const statsAktif = (stats as any)?.data ?? stats ?? {
    total: 0,
    tidakIkut: 0,
    berangkat: 0,
    pulang: 0,
  };

  const totalIkut = Number(statsAktif.total ?? statsAktif.ikut ?? 0);
  const totalTidakIkut = Number(statsAktif.tidakIkut ?? 0);
  const totalBerangkat = Number(statsAktif.berangkat ?? statsAktif.sudahBerangkat ?? 0);
  const totalPulang = Number(statsAktif.pulang ?? statsAktif.sudahPulang ?? 0);

  // Judul & deskripsi per tab
  const tabTitles: Record<PanitiaTabType, { title: string; subtitle: string }> = {
    ringkasan: {
      title: 'Ringkasan Dasbor',
      subtitle: 'Pantau metrik presensi & aksi cepat pemindai',
    },
    peserta: {
      title: 'Data & Rekap Peserta',
      subtitle: 'Monitoring data riil peserta & unduh rekap CSV',
    },
    scanner: {
      title: 'Pusat Pemindai Presensi',
      subtitle: 'Pilih sesi presensi untuk mengaktifkan pemindai kamera QR',
    },
    kegiatan: {
      title: 'Absen Sesi Kegiatan Lapangan',
      subtitle: 'Presensi kehadiran peserta per agenda acara rihlah (global semua mobil)',
    },
    dokumen: {
      title: 'Manajemen Dokumen PDF',
      subtitle: 'Penyimpanan berkas global & sertifikat personal',
    },
    log: {
      title: 'Log Aktivitas Sistem',
      subtitle: 'Rekam jejak audit autentikasi & keamanan sistem',
    },
    pengaturan: {
      title: 'Pengaturan Dasbor',
      subtitle: 'Kontrol status pendaftaran & kredensial panitia',
    },
    admin: {
      title: 'Kelola Akun Panitia',
      subtitle: 'Buat & pantau akun Super Admin dan Admin Mobil',
    },
  };

  const currentTabInfo = tabTitles[panitiaTab] || tabTitles.ringkasan;

  return (
    <div className="flex flex-col lg:flex-row min-h-[680px] w-full bg-slate-50 text-slate-800">
      {/* Sidebar Panitia (Desktop fixed + Mobile drawer) */}
      <SidebarPanitia
        activeTab={panitiaTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        stats={stats}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isSuperAdmin={isSuperAdmin}
        username={panitiaUsername}
        panitiaRole={panitiaRole}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar / App Bar */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center space-x-3">
            {/* Hamburger button for mobile */}
            <button
              type="button"
              id="panitia-hamburger-btn"
              onClick={() => setIsOpenMobile(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {currentTabInfo.title}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {panitiaTab.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                {currentTabInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="panitia-btn-refresh-top"
              onClick={onRefresh}
              disabled={loading}
              title="Perbarui data statistik ringkasan"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-600' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Memuat...' : 'Perbarui Statistik'}</span>
            </button>

            <div className="hidden md:flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Live Data
            </div>
          </div>
        </header>

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* TAB 1: RINGKASAN */}
          {panitiaTab === 'ringkasan' && (
            <div className="space-y-6 max-w-5xl">
              {/* 4 Metric Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Ikut */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Total Ikut
                    </span>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {totalIkut}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Peserta siap giat</p>
                </div>

                {/* Tidak Ikut */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Tidak Ikut
                    </span>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                      <UserX className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-600">
                    {totalTidakIkut}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Konfirmasi absen</p>
                </div>

                {/* Check-in Berangkat */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white shadow-xs hover:border-emerald-200 transition-all">
                  <div className="flex items-center justify-between text-emerald-600 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Berangkat
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                    {totalBerangkat}
                  </div>
                  <p className="text-[11px] text-emerald-600/90 mt-1">
                    {totalIkut > 0 ? `${Math.round((totalBerangkat / totalIkut) * 100)}% kehadiran` : '0%'}
                  </p>
                </div>

                {/* Check-in Pulang */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/40 to-white shadow-xs hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between text-blue-600 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                      Pulang
                    </span>
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-800">
                    {totalPulang}
                  </div>
                  <p className="text-[11px] text-blue-600/90 mt-1">
                    {totalIkut > 0 ? `${Math.round((totalPulang / totalIkut) * 100)}% kepulangan` : '0%'}
                  </p>
                </div>
              </div>

              {/* Quick Scanner Action Section */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Aksi Cepat Presensi Lapangan
                    </h2>
                    <p className="text-xs text-slate-500">
                      Buka pemindai QR untuk memproses presensi peserta secara instan
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTabChange('scanner')}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    Buka Panel Scanner
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Tombol Scan Berangkat */}
                  <button
                    type="button"
                    id="btn-scan-berangkat-quick"
                    onClick={() => onBukaScanner('berangkat')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white p-4 sm:p-5 rounded-2xl font-bold shadow-md shadow-emerald-600/20 flex items-center justify-between transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-xs group-hover:scale-105 transition-transform">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-black leading-tight">
                          Scan Keberangkatan
                        </div>
                        <div className="text-xs text-emerald-100 font-normal mt-0.5">
                          Presensi pagi sebelum perjalanan
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Tombol Scan Pulang */}
                  <button
                    type="button"
                    id="btn-scan-pulang-quick"
                    onClick={() => onBukaScanner('pulang')}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white p-4 sm:p-5 rounded-2xl font-bold shadow-md shadow-blue-600/20 flex items-center justify-between transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-xs group-hover:scale-105 transition-transform">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-black leading-tight">
                          Scan Kepulangan
                        </div>
                        <div className="text-xs text-blue-100 font-normal mt-0.5">
                          Presensi akhir selesai giat
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-200 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Shortcut Banner to Rekap Peserta - Dynamic Red Gradient & Frosted */}
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-2xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-red-600/20 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center space-x-3.5 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black leading-tight">
                      Data Peserta &amp; Rekap Realtime
                    </h3>
                    <p className="text-xs text-rose-100 font-medium mt-0.5">
                      {pesertaList.length > 0 
                        ? `Tercatat ${pesertaList.length} peserta aktif dalam database.`
                        : 'Kelola data lengkap peserta & export rekap CSV.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onTabChange('peserta')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-red-700 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 relative z-10"
                >
                  <span>Buka Rekap Lengkap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DATA & REKAP (Fase B: Rekap & Export Realtime) */}
          {panitiaTab === 'peserta' && (
            <RekapExportView
              pesertaList={pesertaList}
              onRefreshPeserta={onRefreshPeserta}
              tampilkanNotif={tampilkanNotif}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {/* TAB 3: SCANNER */}
          {panitiaTab === 'scanner' && (
            <div className="max-w-3xl space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Pusat Pemindai Kamera Presensi
                    </h2>
                    <p className="text-xs text-slate-500">
                      Silakan pilih sesi presensi di bawah untuk membuka kamera scanner layar penuh.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {/* Checkpoint 1: Registrasi Ulang */}
                  <div className="p-5 rounded-2xl border-2 border-violet-200 bg-violet-50/50 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-violet-200 text-violet-900 uppercase tracking-wider mb-2">
                        Tahap 1: Pra-Keberangkatan
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        1. Registrasi Ulang
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Verifikasi kehadiran fisik awal peserta di titik kumpul tanpa mengunci jam perjalanan.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-scan-registrasi-ulang-panel"
                      onClick={() => onBukaScanner('registrasi_ulang')}
                      className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Mulai Registrasi Ulang
                    </button>
                  </div>

                  {/* Checkpoint 2: Keberangkatan */}
                  <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900 uppercase tracking-wider mb-2">
                        Tahap 2: Keberangkatan
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        2. Presensi Keberangkatan
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Catat waktu berangkat resmi peserta sebelum armada mobil bergerak menuju lokasi.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-scan-berangkat-panel"
                      onClick={() => onBukaScanner('berangkat')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      Mulai Scan Berangkat
                    </button>
                  </div>

                  {/* Checkpoint 3: Kepulangan dari Lokasi */}
                  <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/50 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-900 uppercase tracking-wider mb-2">
                        Tahap 3: Selesai di Lokasi
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        3. Pulang dari Lokasi
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Memvalidasi absensi peserta saat bersiap naik kendaraan meninggalkan lokasi giat.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-scan-pulang-panel"
                      onClick={() => onBukaScanner('pulang_dari_lokasi')}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      Mulai Scan Pulang Lokasi
                    </button>
                  </div>

                  {/* Checkpoint 4: Tiba di Rumah */}
                  <div className="p-5 rounded-2xl border-2 border-teal-200 bg-teal-50/50 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-teal-200 text-teal-900 uppercase tracking-wider mb-2">
                        Tahap 4: Akhir Perjalanan
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        4. Tiba di Rumah / Basecamp
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Konfirmasi final keselamatan peserta bahwa telah sampai dengan aman di tujuan akhir.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-scan-tiba-rumah-panel"
                      onClick={() => onBukaScanner('tiba_di_rumah')}
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Home className="w-4 h-4" />
                      Mulai Scan Tiba di Rumah
                    </button>
                  </div>
                </div>
              </div>

              {/* Catatan Operasional */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Petunjuk Pemindai:
                </span>
                <p>
                  Urutan scan perjalanan: <b>Keberangkatan → Pulang dari Lokasi → Tiba di Rumah</b>. Scanner kamera mendukung kamera depan/belakang serta input ID manual.
                </p>
              </div>
            </div>
          )}

          {/* TAB: KEGIATAN (Tahap 3: Absen Kegiatan Lapangan) */}
          {panitiaTab === 'kegiatan' && (
            <AbsenKegiatanView
              isSuperAdmin={isSuperAdmin}
              pesertaList={pesertaList}
              tampilkanNotif={tampilkanNotif}
            />
          )}

          {/* TAB 4: DOKUMEN (Fase C: Manajemen Dokumen PDF) */}
          {panitiaTab === 'dokumen' && (
            <DokumenPdfView
              tampilkanNotif={tampilkanNotif}
            />
          )}

          {/* TAB 5: LOG SISTEM (Fase D) */}
          {panitiaTab === 'log' && (
            <LogSistemView
              tampilkanNotif={tampilkanNotif}
            />
          )}

          {/* TAB 6: PENGATURAN (Fase D) */}
          {panitiaTab === 'pengaturan' && (
            <PengaturanView
              stats={stats}
              onRefresh={onRefresh}
              tampilkanNotif={tampilkanNotif}
            />
          )}

          {/* TAB 7: MANAJEMEN AKUN PANITIA (Tahap 2 — Hanya Super Admin) */}
          {panitiaTab === 'admin' && isSuperAdmin && (
            <ManajemenAdminView tampilkanNotif={tampilkanNotif} />
          )}
        </main>
      </div>
    </div>
  );
};
