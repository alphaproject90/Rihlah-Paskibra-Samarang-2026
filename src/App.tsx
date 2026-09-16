import React, { useState, useEffect, useCallback } from 'react';
import { HalamanType, NotifState, PesertaRihlah, StatsRihlah, FormPendaftaran } from './types';
import { PanitiaTabType } from './components/panitia/types';
import { apiService } from './services/apiService';
import { STRONG_PASSWORD_REGEX } from '../lib/validation';
import { KopSurat } from './components/KopSurat';
import { HeaderMerah } from './components/HeaderMerah';
import { ToastNotif } from './components/ToastNotif';
import { HomeView } from './components/HomeView';
import { DaftarView } from './components/DaftarView';
import { LoginPilihanView } from './components/LoginPilihanView';
import { LoginPesertaView } from './components/LoginPesertaView';
import { GantiPasswordView } from './components/GantiPasswordView';
import { DashboardPesertaView } from './components/DashboardPesertaView';
import { PesertaStatistikView } from './components/PesertaStatistikView';
import { LoginPanitiaView } from './components/LoginPanitiaView';
import { QrScanner } from './components/QrScanner';

const HALAMAN_VALID: HalamanType[] = [
  'home',
  'daftar',
  'login-pilihan',
  'login-peserta',
  'ganti-password',
  'dashboard-peserta',
  'peserta',
  'login-panitia',
  'scanner'
];

const STATS_KOSONG: StatsRihlah = { total: 0, tidakIkut: 0, berangkat: 0, pulang: 0 };

export const App: React.FC = () => {
  const [halamanAktif, setHalamanAktif] = useState<HalamanType>('home');
  const [isPanitia, setIsPanitia] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'berangkat' | 'pulang'>('berangkat');
  const [dashboardPeserta, setDashboardPeserta] = useState<PesertaRihlah | null>(null);

  // State tab internal panitia dengan lazy initializer dari sessionStorage
  const [panitiaTab, setPanitiaTab] = useState<PanitiaTabType>(() => {
    return (sessionStorage.getItem('rihlah_panitia_tab') as PanitiaTabType) || 'ringkasan';
  });

  // Wrapper untuk memperbarui state dan menulis ulang sessionStorage secara konsisten
  const handleSetPanitiaTab = useCallback((tab: PanitiaTabType) => {
    setPanitiaTab(tab);
    sessionStorage.setItem('rihlah_panitia_tab', tab);
  }, []);

  // Mulai dari nol, bukan angka contoh. Angka palsu di dashboard panitia
  // lebih berbahaya daripada angka kosong.
  const [stats, setStats] = useState<StatsRihlah>(STATS_KOSONG);
  const [pesertaList, setPesertaList] = useState<PesertaRihlah[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [notif, setNotif] = useState<NotifState>({
    show: false,
    message: '',
    type: 'info'
  });

  const tampilkanNotif = useCallback((pesan: string, tipe: 'info' | 'success' | 'error' = 'info') => {
    setNotif({ show: true, message: pesan, type: tipe });
    setTimeout(() => {
      setNotif((prev) => ({ ...prev, show: false }));
    }, 3500);
  }, []);

  const navigasiKeRaw = useCallback((hal: HalamanType) => {
    if (!HALAMAN_VALID.includes(hal)) return;
    setHalamanAktif(hal);
    window.location.hash = hal;
  }, []);

  /** Sesi panitia ditolak server: bersihkan state lokal, jangan biarkan UI "seolah login". */
  const akhiriSesiPanitia = useCallback(
    (pesan: string) => {
      setIsPanitia(false);
      setPesertaList([]);
      sessionStorage.removeItem('rihlah_panitia_active');
      sessionStorage.removeItem('rihlah_panitia_tab');
      tampilkanNotif(pesan, 'error');
      navigasiKeRaw('login-panitia');
    },
    [tampilkanNotif, navigasiKeRaw]
  );

  // Statistik bersifat publik (endpoint /api/statistik tidak butuh auth)
  const muatStatistik = useCallback(async () => {
    const hasil = await apiService.getStatistik();
    if ((hasil.success || hasil.ok || hasil.status === 'success') && hasil.data) {
      setStats(hasil.data);
    } else {
      setStats(STATS_KOSONG);
      tampilkanNotif(hasil.message || hasil.error || 'Gagal memuat statistik.', 'error');
    }
  }, [tampilkanNotif]);

  // Data peserta HANYA untuk panitia — endpoint /api/peserta menolak tanpa sesi panitia.
  const muatPeserta = useCallback(async () => {
    const hasil = await apiService.getAllPeserta();

    if (hasil.ok) {
      setPesertaList(hasil.data);
      return;
    }
    if (hasil.unauthorized) {
      akhiriSesiPanitia(hasil.message || 'Sesi panitia berakhir. Silakan login ulang.');
      return;
    }
    setPesertaList([]);
    tampilkanNotif(hasil.message || 'Gagal memuat data peserta.', 'error');
  }, [tampilkanNotif, akhiriSesiPanitia]);

  // Sinkronisasi rute URL hash
  const sinkronkanDariHash = useCallback(() => {
    const raw = window.location.hash.replace(/^#/, '');
    const target = HALAMAN_VALID.includes(raw as HalamanType) ? (raw as HalamanType) : 'home';

    if (target === 'dashboard-peserta' && !dashboardPeserta) {
      setHalamanAktif('home');
      return;
    }
    if (target === 'scanner' && (!isPanitia || !scanMode)) {
      setHalamanAktif('home');
      return;
    }
    if (target === 'peserta' && !isPanitia) {
      setHalamanAktif('login-panitia');
      return;
    }
    setHalamanAktif(target);
  }, [dashboardPeserta, isPanitia, scanMode]);

  useEffect(() => {
    sinkronkanDariHash();
    window.addEventListener('hashchange', sinkronkanDariHash);
    muatStatistik();

    return () => {
      window.removeEventListener('hashchange', sinkronkanDariHash);
    };
  }, [sinkronkanDariHash, muatStatistik]);

  // Verifikasi otomatis sesi panitia saat mount (menangani reload F5)
  useEffect(() => {
    if (sessionStorage.getItem('rihlah_panitia_active') === 'true') {
      apiService.getAllPeserta().then((res) => {
        if (res.ok) {
          setIsPanitia(true);
          setPesertaList(res.data);
          const savedTab = sessionStorage.getItem('rihlah_panitia_tab') as PanitiaTabType;
          if (savedTab) setPanitiaTab(savedTab);
        } else if (res.unauthorized) {
          sessionStorage.removeItem('rihlah_panitia_active');
          sessionStorage.removeItem('rihlah_panitia_tab');
          setIsPanitia(false);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigasiKe = (hal: HalamanType) => {
    if (!HALAMAN_VALID.includes(hal)) return;

    // Guard clause: Scanner hanya bisa diakses jika panitia sudah login (terautentikasi)
    if (hal === 'scanner' && !isPanitia) {
      tampilkanNotif('Fitur scanner hanya dapat diakses oleh panitia terotentikasi.', 'error');
      navigasiKeRaw('login-panitia');
      return;
    }

    // Daftar peserta butuh sesi panitia — jangan buka halamannya lalu gagal diam-diam.
    if (hal === 'peserta' && !isPanitia) {
      tampilkanNotif('Data peserta hanya dapat diakses oleh panitia.', 'error');
      navigasiKeRaw('login-panitia');
      return;
    }

    navigasiKeRaw(hal);

    if (hal === 'peserta') {
      muatStatistik();
      muatPeserta();
    }
  };

  const kembali = () => {
    if (halamanAktif === 'scanner') {
      navigasiKe('login-panitia');
    } else if (halamanAktif === 'ganti-password') {
      navigasiKe('login-peserta');
    } else if (halamanAktif === 'login-peserta') {
      navigasiKe('login-pilihan');
    } else {
      navigasiKe('home');
    }
  };

  // 1. Submit Pendaftaran
  const handleRegister = async (form: FormPendaftaran) => {
    setLoading(true);
    try {
      const res = await apiService.registerPeserta(form);
      if (res.success || res.status === 'success') {
        tampilkanNotif('Pendaftaran berhasil disimpan!', 'success');
        muatStatistik();
        if (isPanitia) muatPeserta();
        return res;
      }
      tampilkanNotif(res.message || res.error || 'Gagal mendaftar.', 'error');
      return res;
    } finally {
      setLoading(false);
    }
  };

  // 2. Login Peserta
  const handleLoginPeserta = async (username: string, pass: string) => {
    setLoading(true);
    try {
      const res = await apiService.loginPeserta(username, pass);
      if ((res.success || res.status === 'success') && res.data) {
        setDashboardPeserta(res.data);
        const namaTampil = res.data.nama || res.data.namaLengkap || 'Peserta';
        tampilkanNotif(`Selamat datang, ${namaTampil}!`, 'success');
        navigasiKe('dashboard-peserta');
      } else {
        tampilkanNotif(res.message || res.error || 'Username atau Password salah.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset / Ganti Password
  const handleSubmitGantiPassword = async (
    identifier: string,
    noWa: string,
    newPass: string,
    confirmPass: string
  ) => {
    if (!identifier.trim()) {
      tampilkanNotif('Harap masukkan Username atau ID Peserta.', 'error');
      return;
    }
    if (!noWa.trim()) {
      tampilkanNotif('Harap masukkan Nomor WhatsApp terdaftar.', 'error');
      return;
    }
    if (!newPass || newPass !== confirmPass) {
      tampilkanNotif('Konfirmasi password tidak cocok!', 'error');
      return;
    }
    if (!STRONG_PASSWORD_REGEX.test(newPass)) {
      tampilkanNotif('Password minimal 8 karakter kombinasi huruf besar, kecil, angka, dan simbol.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.resetPasswordLupa(identifier.trim(), noWa.trim(), newPass);
      if (res.success || res.status === 'success') {
        tampilkanNotif(res.message || 'Password berhasil diperbarui! Silakan login kembali.', 'success');
        navigasiKe('login-peserta');
      } else {
        tampilkanNotif(res.message || res.error || 'Gagal mengubah password.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeluarPeserta = async () => {
    await apiService.logout();
    // Kosongkan seluruh state terkait sesi secara eksplisit
    setDashboardPeserta(null);
    setIsPanitia(false);
    setPesertaList([]);
    setScanMode('berangkat');
    tampilkanNotif('Anda telah keluar dari akun.', 'info');
    navigasiKe('home');
  };

  // 4. Login Panitia (Username & Password)
  const handleLoginPanitia = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { valid, message } = await apiService.loginPanitia(username, password);
      if (valid) {
        setIsPanitia(true);
        sessionStorage.setItem('rihlah_panitia_active', 'true');
        sessionStorage.setItem('rihlah_panitia_tab', panitiaTab);
        tampilkanNotif('Akses panitia berhasil diverifikasi!', 'success');
        await muatStatistik();
        await muatPeserta();
        return true;
      }
      tampilkanNotif(message || 'Username atau password panitia salah.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutPanitia = async () => {
    // Cookie sesi wajib dihapus di server — tanpa ini token tetap sah 24 jam
    // meski UI sudah kelihatan logout.
    await apiService.logout();
    setIsPanitia(false);
    setPesertaList([]);
    sessionStorage.removeItem('rihlah_panitia_active');
    sessionStorage.removeItem('rihlah_panitia_tab');
    // Bersihkan state peserta juga — mencegah data bocor ke sesi selanjutnya
    setDashboardPeserta(null);
    tampilkanNotif('Sesi panitia diakhiri.', 'info');
    navigasiKeRaw('home');
  };

  // 5. Buka Scanner
  const handleBukaScanner = (mode: 'berangkat' | 'pulang') => {
    // Guard clause: pastikan rute hanya bisa diakses jika panitia sudah login (valid)
    if (!isPanitia) {
      tampilkanNotif('Fitur scanner hanya dapat diakses oleh panitia terotentikasi.', 'error');
      navigasiKeRaw('login-panitia');
      return;
    }
    setScanMode(mode);
    navigasiKe('scanner');
  };

  // 6. Scan QR Code atau ID
  const handleSubmitScan = async (idPeserta: string) => {
    setLoading(true);
    try {
      const res = await apiService.prosesScan(idPeserta, scanMode);

      if (res.unauthorized) {
        akhiriSesiPanitia(res.message || res.error || 'Sesi panitia berakhir. Silakan login ulang.');
        return;
      }
      if (res.success || res.status === 'success') {
        const sesi = scanMode === 'berangkat' ? 'Keberangkatan' : 'Kepulangan';
        // res.nama sekarang tersedia — prosesScan sudah meneruskannya dari server
        const namaTampil = res.data?.nama || res.nama || idPeserta;
        tampilkanNotif(`Presensi ${sesi} Berhasil: ${namaTampil} (${idPeserta})`, 'success');
        muatStatistik();
        muatPeserta();
      } else {
        tampilkanNotif(res.message || res.error || 'Scan gagal diproses.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const isPanitiaDashboard = halamanAktif === 'login-panitia' && isPanitia;

  return (
    <div className="text-slate-800 antialiased min-h-screen bg-slate-50 sm:bg-gradient-to-br sm:from-slate-100 sm:to-slate-300 sm:py-6 sm:px-4 flex flex-col justify-center items-center">
      {/* Toast Notification */}
      <ToastNotif notif={notif} />

      {/* Main Container Card: Lebar penuh (max-w-7xl) saat dasbor panitia aktif, max-w-lg untuk halaman publik */}
      <div className={`w-full mx-auto bg-white sm:rounded-[2rem] sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-0 border border-slate-100 relative flex flex-col ${
        isPanitiaDashboard ? 'max-w-7xl sm:rounded-3xl border-slate-200 shadow-2xl' : 'max-w-lg'
      }`}>
        {/* KOP SURAT - hanya untuk halaman selain dasbor panitia */}
        {!isPanitiaDashboard && <KopSurat />}

        {/* HEADER MERAH - hanya untuk halaman selain dasbor panitia */}
        {!isPanitiaDashboard && <HeaderMerah halamanAktif={halamanAktif} onKembali={kembali} />}

        {/* MAIN CONTENT AREA */}
        <div className={isPanitiaDashboard ? "relative z-0 flex-1 flex flex-col p-0" : "p-5 sm:p-8 relative z-0 flex-1 flex flex-col"}>
          {halamanAktif === 'home' && (
            <HomeView onNavigasi={navigasiKe} />
          )}

          {halamanAktif === 'daftar' && (
            <DaftarView
              onSubmit={handleRegister}
              onSelesai={() => navigasiKe('home')}
              loading={loading}
            />
          )}

          {halamanAktif === 'login-pilihan' && (
            <LoginPilihanView onNavigasi={navigasiKe} />
          )}

          {halamanAktif === 'login-peserta' && (
            <LoginPesertaView
              onLogin={handleLoginPeserta}
              onLupaPassword={() => navigasiKe('ganti-password')}
              loading={loading}
            />
          )}

          {halamanAktif === 'ganti-password' && (
            <GantiPasswordView
              onSubmit={handleSubmitGantiPassword}
              onBatal={() => navigasiKe('login-peserta')}
              loading={loading}
            />
          )}

          {halamanAktif === 'dashboard-peserta' && dashboardPeserta && (
            <DashboardPesertaView
              peserta={dashboardPeserta}
              onKeluar={handleKeluarPeserta}
            />
          )}

          {halamanAktif === 'peserta' && isPanitia && (
            <PesertaStatistikView
              stats={stats}
              pesertaList={pesertaList}
              onOpenLoginPeserta={() => navigasiKe('login-peserta')}
            />
          )}

          {halamanAktif === 'login-panitia' && (
            <LoginPanitiaView
              isPanitia={isPanitia}
              stats={stats}
              onLoginPanitia={handleLoginPanitia}
              onLogout={handleLogoutPanitia}
              onRefresh={muatStatistik}
              onRefreshPeserta={muatPeserta}
              tampilkanNotif={tampilkanNotif}
              onBukaScanner={handleBukaScanner}
              loading={loading}
              panitiaTab={panitiaTab}
              onTabChange={handleSetPanitiaTab}
              pesertaList={pesertaList}
            />
          )}

          {halamanAktif === 'scanner' && (
            <QrScanner
              scanMode={scanMode}
              onKembali={() => {
                navigasiKe('login-panitia');
                handleSetPanitiaTab('scanner');
              }}
              onSubmitScan={handleSubmitScan}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
