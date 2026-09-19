import React, { useState, useEffect, useCallback } from 'react';
import { HalamanType, NotifState, PesertaRihlah, StatsRihlah, FormPendaftaran, ScanResult } from './types';
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
import { PesertaCheckInPanel } from './components/PesertaCheckInPanel';

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
  const [scanMode, setScanMode] = useState<'registrasi_ulang' | 'berangkat' | 'pulang' | 'pulang_dari_lokasi' | 'tiba_di_rumah'>('berangkat');
  const [dashboardPeserta, setDashboardPeserta] = useState<PesertaRihlah | null>(null);

  // State role & username panitia
  const [panitiaRole, setPanitiaRole] = useState<string | undefined>(() => {
    return sessionStorage.getItem('rihlah_panitia_role') || undefined;
  });
  const [panitiaUsername, setPanitiaUsername] = useState<string | undefined>(() => {
    return sessionStorage.getItem('rihlah_panitia_username') || undefined;
  });

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
      setPanitiaRole(undefined);
      setPanitiaUsername(undefined);
      setPesertaList([]);
      sessionStorage.removeItem('rihlah_panitia_active');
      sessionStorage.removeItem('rihlah_panitia_tab');
      sessionStorage.removeItem('rihlah_panitia_role');
      sessionStorage.removeItem('rihlah_panitia_username');
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
          const savedRole = sessionStorage.getItem('rihlah_panitia_role');
          if (savedRole) setPanitiaRole(savedRole);
          const savedUsername = sessionStorage.getItem('rihlah_panitia_username');
          if (savedUsername) setPanitiaUsername(savedUsername);
        } else if (res.unauthorized) {
          sessionStorage.removeItem('rihlah_panitia_active');
          sessionStorage.removeItem('rihlah_panitia_tab');
          sessionStorage.removeItem('rihlah_panitia_role');
          sessionStorage.removeItem('rihlah_panitia_username');
          setIsPanitia(false);
          setPanitiaRole(undefined);
          setPanitiaUsername(undefined);
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
      if (isPanitia) {
        muatPeserta();
      }
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
      const { valid, message, panitiaRole: role, username: uname } = await apiService.loginPanitia(username, password);
      if (valid) {
        setIsPanitia(true);
        if (role) {
          setPanitiaRole(role);
          sessionStorage.setItem('rihlah_panitia_role', role);
        }
        if (uname) {
          setPanitiaUsername(uname);
          sessionStorage.setItem('rihlah_panitia_username', uname);
        }
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

  // 4B. Login Panitia via Google OAuth (Super Admin)
  const handleLoginPanitiaGoogle = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        const res = await apiService.loginPanitiaGoogle('unconfigured');
        tampilkanNotif(res.message || 'Google Login belum dikonfigurasi oleh administrator.', 'error');
        return false;
      }

      return await new Promise<boolean>((resolve) => {
        if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
          const google = (window as any).google;
          google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential?: string }) => {
              if (response?.credential) {
                const res = await apiService.loginPanitiaGoogle(response.credential);
                if (res.valid) {
                  setIsPanitia(true);
                  if (res.panitiaRole) {
                    setPanitiaRole(res.panitiaRole);
                    sessionStorage.setItem('rihlah_panitia_role', res.panitiaRole);
                  }
                  if (res.username) {
                    setPanitiaUsername(res.username);
                    sessionStorage.setItem('rihlah_panitia_username', res.username);
                  }
                  sessionStorage.setItem('rihlah_panitia_active', 'true');
                  sessionStorage.setItem('rihlah_panitia_tab', panitiaTab);
                  tampilkanNotif('Login Google Super Admin berhasil!', 'success');
                  await muatStatistik();
                  await muatPeserta();
                  resolve(true);
                } else {
                  tampilkanNotif(res.message || 'Login Google gagal.', 'error');
                  resolve(false);
                }
              } else {
                tampilkanNotif('Gagal menerima kredensial Google.', 'error');
                resolve(false);
              }
            },
          });
          google.accounts.id.prompt();
        } else {
          apiService.loginPanitiaGoogle('dummy_token').then((res) => {
            tampilkanNotif(res.message || 'Google Identity Services belum dimuat atau belum dikonfigurasi.', 'error');
            resolve(false);
          });
        }
      });
    } catch {
      tampilkanNotif('Gagal memproses login Google.', 'error');
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
    setPanitiaRole(undefined);
    setPanitiaUsername(undefined);
    setPesertaList([]);
    sessionStorage.removeItem('rihlah_panitia_active');
    sessionStorage.removeItem('rihlah_panitia_tab');
    sessionStorage.removeItem('rihlah_panitia_role');
    sessionStorage.removeItem('rihlah_panitia_username');
    // Bersihkan state peserta juga — mencegah data bocor ke sesi selanjutnya
    setDashboardPeserta(null);
    tampilkanNotif('Sesi panitia diakhiri.', 'info');
    navigasiKeRaw('home');
  };

  // 5. Buka Scanner
  const handleBukaScanner = (mode: 'registrasi_ulang' | 'berangkat' | 'pulang' | 'pulang_dari_lokasi' | 'tiba_di_rumah') => {
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
  const handleSubmitScan = async (idPeserta: string): Promise<ScanResult> => {
    setLoading(true);
    try {
      const res = await apiService.prosesScan(idPeserta, scanMode);

      if (res.unauthorized) {
        const pesanUnauth = res.message || res.error || 'Sesi panitia berakhir. Silakan login ulang.';
        akhiriSesiPanitia(pesanUnauth);
        return { success: false, message: pesanUnauth };
      }
      if (res.success || res.status === 'success') {
        const sesi =
          scanMode === 'registrasi_ulang'
            ? 'Registrasi Ulang'
            : scanMode === 'berangkat'
            ? 'Keberangkatan'
            : scanMode === 'pulang' || scanMode === 'pulang_dari_lokasi'
            ? 'Kepulangan dari Lokasi'
            : 'Tiba di Rumah';
        // res.nama sekarang tersedia — prosesScan sudah meneruskannya dari server
        const namaTampil = res.data?.nama || res.nama || idPeserta;
        const pesanSukses = `Presensi ${sesi} Berhasil: ${namaTampil} (${idPeserta})`;
        tampilkanNotif(pesanSukses, 'success');
        muatStatistik();
        muatPeserta();
        return { success: true, message: pesanSukses };
      } else {
        const pesanGagal = res.message || res.error || 'Scan gagal diproses.';
        tampilkanNotif(pesanGagal, 'error');
        return { success: false, message: pesanGagal };
      }
    } catch {
      const pesanError = 'Terjadi kesalahan tak terduga.';
      tampilkanNotif(pesanError, 'error');
      return { success: false, message: pesanError };
    } finally {
      setLoading(false);
    }
  };

  const isFullWidthDashboard = (halamanAktif === 'login-panitia' && isPanitia) || (halamanAktif === 'dashboard-peserta' && Boolean(dashboardPeserta));

  return (
    <div className="text-slate-800 antialiased min-h-screen bg-slate-50 sm:bg-gradient-to-br sm:from-slate-100 sm:to-slate-300 sm:py-6 sm:px-4 flex flex-col justify-center items-center">
      {/* Toast Notification */}
      <ToastNotif notif={notif} />

      {/* Main Container Card: Lebar penuh (max-w-7xl) saat dasbor aktif, max-w-4xl untuk statistik peserta publik, max-w-lg untuk form publik */}
      <div className={`w-full mx-auto bg-white sm:rounded-[2rem] sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-0 border border-slate-100 relative flex flex-col ${
        isFullWidthDashboard ? 'max-w-7xl sm:rounded-3xl border-slate-200 shadow-2xl' : (halamanAktif === 'peserta' ? 'max-w-4xl' : 'max-w-lg')
      }`}>
        {/* KOP SURAT - hanya untuk halaman selain dasbor */}
        {!isFullWidthDashboard && <KopSurat />}

        {/* HEADER MERAH - hanya untuk halaman selain dasbor */}
        {!isFullWidthDashboard && <HeaderMerah halamanAktif={halamanAktif} onKembali={kembali} />}

        {/* MAIN CONTENT AREA */}
        <div className={isFullWidthDashboard ? "relative z-0 flex-1 flex flex-col p-0" : "p-5 sm:p-8 relative z-0 flex-1 flex flex-col"}>
          {halamanAktif === 'home' && (
            <HomeView onNavigasi={navigasiKe} pendaftaranDibuka={stats?.pendaftaranDibuka ?? true} />
          )}

          {halamanAktif === 'daftar' && (
            <DaftarView
              onSubmit={handleRegister}
              onSelesai={() => navigasiKe('home')}
              loading={loading}
              pendaftaranDibuka={stats?.pendaftaranDibuka ?? true}
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
              onSuccess={() => {
                tampilkanNotif('Password berhasil diperbarui! Silakan login kembali.', 'success');
                navigasiKe('login-peserta');
              }}
              onBatal={() => navigasiKe('login-peserta')}
            />
          )}

          {halamanAktif === 'dashboard-peserta' && dashboardPeserta && (
            <DashboardPesertaView
              peserta={dashboardPeserta}
              onKeluar={handleKeluarPeserta}
            />
          )}

          {halamanAktif === 'peserta' && (
            <PesertaStatistikView
              stats={stats}
              pesertaList={isPanitia ? pesertaList : []}
              onOpenLoginPeserta={() => navigasiKe('login-peserta')}
            />
          )}

          {halamanAktif === 'login-panitia' && (
            <LoginPanitiaView
              isPanitia={isPanitia}
              stats={stats}
              onLoginPanitia={handleLoginPanitia}
              onLoginGoogle={handleLoginPanitiaGoogle}
              onLogout={handleLogoutPanitia}
              onRefresh={muatStatistik}
              onRefreshPeserta={muatPeserta}
              tampilkanNotif={tampilkanNotif}
              onBukaScanner={handleBukaScanner}
              loading={loading}
              panitiaTab={panitiaTab}
              onTabChange={handleSetPanitiaTab}
              pesertaList={pesertaList}
              panitiaRole={panitiaRole}
              panitiaUsername={panitiaUsername}
            />
          )}

          {halamanAktif === 'scanner' && (
            <PesertaCheckInPanel
              scanMode={scanMode as any}
              onKembali={() => {
                navigasiKe('login-panitia');
                handleSetPanitiaTab('scanner');
              }}
              onSubmitScan={handleSubmitScan}
              loading={loading}
              pesertaList={pesertaList}
            />
          )}
          {/* QrScanner tetap di-import sebagai fallback; jika dirender kembali:
               onSubmitScan={async (id) => { await handleSubmitScan(id); }}
               untuk menjaga kompatibilitas tipe Promise<void>-nya. */}
        </div>
      </div>
    </div>
  );
};

export default App;
