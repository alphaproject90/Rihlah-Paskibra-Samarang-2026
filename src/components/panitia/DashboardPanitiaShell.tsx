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
  FileText,
  Activity,
  Settings,
  Sparkles
} from 'lucide-react';
import { PanitiaTabType } from './types';
import { SidebarPanitia } from './SidebarPanitia';
import { StatsRihlah, PesertaRihlah } from '../../types';

interface DashboardPanitiaShellProps {
  panitiaTab: PanitiaTabType;
  onTabChange: (tab: PanitiaTabType) => void;
  onLogout: () => void;
  stats: StatsRihlah;
  pesertaList: PesertaRihlah[];
  onRefresh: () => void;
  onBukaScanner: (mode: 'berangkat' | 'pulang') => void;
  loading: boolean;
}

export const DashboardPanitiaShell: React.FC<DashboardPanitiaShellProps> = ({
  panitiaTab,
  onTabChange,
  onLogout,
  stats,
  pesertaList,
  onRefresh,
  onBukaScanner,
  loading,
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

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
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-600' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Memuat...' : 'Perbarui'}</span>
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

              {/* Shortcut Banner to Rekap Peserta */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-red-400 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold leading-tight">
                      Data Peserta &amp; Rekap Realtime
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {pesertaList.length > 0 
                        ? `Tercatat ${pesertaList.length} peserta aktif dalam database.`
                        : 'Kelola data lengkap peserta & export rekap CSV.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onTabChange('peserta')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition active:scale-95 cursor-pointer shrink-0"
                >
                  <span>Buka Rekap Lengkap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DATA & REKAP (Fase B Placeholder) */}
          {panitiaTab === 'peserta' && (
            <div className="max-w-4xl bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 mb-2">
                  Siap untuk Fase B
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  Data Peserta &amp; Rekap Realtime
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Shell sidebar dan navigasi Fase A telah aktif. Komponen RekapExportView dengan tabel realtime (auto-refresh 30s) dan ekspor CSV 13 kolom akan diintegrasikan di tab ini pada Fase B.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold">
                  Total di memori: <span className="font-bold text-slate-900">{pesertaList.length} Peserta</span>
                </div>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  Sinkronkan Sekarang
                </button>
              </div>
            </div>
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
                  {/* Card Keberangkatan */}
                  <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900 uppercase tracking-wider mb-2">
                        Sesi Pagi
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        Presensi Keberangkatan
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Memvalidasi kehadiran peserta sebelum rombongan berangkat ke lokasi giat.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-scan-berangkat-panel"
                      onClick={() => onBukaScanner('berangkat')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      Mulai Scan Keberangkatan
                    </button>
                  </div>

                  {/* Card Kepulangan */}
                  <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/50 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-900 uppercase tracking-wider mb-2">
                        Sesi Akhir
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        Presensi Kepulangan
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Memvalidasi absensi akhir setelah rangkaian acara rihlah selesai.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-scan-pulang-panel"
                      onClick={() => onBukaScanner('pulang')}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      Mulai Scan Kepulangan
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
                  Pastikan kamera peramban telah diizinkan. Pemindai juga mendukung input ID Peserta secara manual jika QR code kotor atau rusak.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: DOKUMEN (Fase C Placeholder) */}
          {panitiaTab === 'dokumen' && (
            <div className="max-w-4xl bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 mb-2">
                  Siap untuk Fase C
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  Manajemen Dokumen PDF (Global &amp; Personal)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Penyimpanan dokumen via Vercel Blob storage, validasi magic bytes %PDF, dan kontrol hak unduh per peserta akan diintegrasikan di tab ini pada Fase C.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: LOG SISTEM (Fase D Placeholder) */}
          {panitiaTab === 'log' && (
            <div className="max-w-4xl bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto shadow-inner">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 mb-2">
                  Siap untuk Fase D
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  Audit Trail &amp; Log Sistem
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Tabel pemantauan SystemLog dengan level filter (INFO, WARN, ERROR, CRITICAL) dan rincian payload JSON akan diintegrasikan di tab ini pada Fase D.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: PENGATURAN (Fase D Placeholder) */}
          {panitiaTab === 'pengaturan' && (
            <div className="max-w-4xl bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Settings className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 mb-2">
                  Siap untuk Fase D
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  Pengaturan Sistem &amp; Akun
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Tombol kontrol pendaftaran (buka/tutup pendaftaran) serta form ganti password mandiri panitia akan diintegrasikan di tab ini pada Fase D.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
