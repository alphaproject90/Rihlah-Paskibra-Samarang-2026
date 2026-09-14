import React, { useState, useEffect, useCallback } from 'react';
import { HalamanType, NotifState, PesertaRihlah, StatsRihlah, FormPendaftaran } from './types';
import { apiService } from './services/apiService';
import { INITIAL_PESERTA_RIHLAH } from './data/rihlahData';
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

export const App: React.FC = () => {
  const [halamanAktif, setHalamanAktif] = useState<HalamanType>('home');
  const [isPanitia, setIsPanitia] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'berangkat' | 'pulang'>('berangkat');
  const [dashboardPeserta, setDashboardPeserta] = useState<PesertaRihlah | null>(null);

  const [stats, setStats] = useState<StatsRihlah>({
    total: 3,
    tidakIkut: 1,
    berangkat: 2,
    pulang: 1
  });

  const [pesertaList, setPesertaList] = useState<PesertaRihlah[]>(INITIAL_PESERTA_RIHLAH);
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

  // Muat data statistik
  const muatStatistik = useCallback(async () => {
    try {
      const dataStats = await apiService.getStatistik();
      if (dataStats) setStats(dataStats);
    } catch {
      // ignore
    }
  }, []);

  // Muat data peserta
  const muatPeserta = useCallback(async () => {
    try {
      const dataList = await apiService.getAllPeserta();
      if (dataList && dataList.length > 0) setPesertaList(dataList);
    } catch {
      // ignore
    }
  }, []);

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
    setHalamanAktif(target);
  }, [dashboardPeserta, isPanitia, scanMode]);

  useEffect(() => {
    sinkronkanDariHash();
    window.addEventListener('hashchange', sinkronkanDariHash);
    muatStatistik();
    muatPeserta();

    return () => {
      window.removeEventListener('hashchange', sinkronkanDariHash);
    };
  }, [sinkronkanDariHash, muatStatistik, muatPeserta]);

  const navigasiKe = (hal: HalamanType) => {
    if (!HALAMAN_VALID.includes(hal)) return;
    setHalamanAktif(hal);
    window.location.hash = hal;

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
      if (res.status === 'success') {
        tampilkanNotif('Pendaftaran berhasil disimpan!', 'success');
        muatStatistik();
        muatPeserta();
        return res;
      } else {
        tampilkanNotif(res.message || 'Gagal mendaftar.', 'error');
        return res;
      }
    } catch {
      const msg = 'Terjadi kesalahan jaringan saat mendaftar.';
      tampilkanNotif(msg, 'error');
      return { status: 'error', message: msg };
    } finally {
      setLoading(false);
    }
  };

  // 2. Login Peserta (Langsung masuk ke dashboard, tidak dipaksa ganti password)
  const handleLoginPeserta = async (username: string, pass: string) => {
    setLoading(true);
    try {
      const res = await apiService.loginPeserta(username, pass);
      if (res.status === 'success') {
        setDashboardPeserta(res.data);
        tampilkanNotif(`Selamat datang, ${res.data.nama}!`, 'success');
        navigasiKe('dashboard-peserta');
      } else {
        tampilkanNotif(res.message || 'Username atau Password salah.', 'error');
      }
    } catch {
      tampilkanNotif('Gagal memverifikasi login.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset / Ganti Password (Khusus Jika Peserta Lupa Password)
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
    const polaPasswordKuat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!polaPasswordKuat.test(newPass)) {
      tampilkanNotif('Password minimal 8 karakter kombinasi huruf besar, kecil, angka, dan simbol.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.resetPasswordLupa(identifier.trim(), noWa.trim(), newPass);
      if (res.status === 'success') {
        tampilkanNotif(res.message || 'Password berhasil diperbarui! Silakan login kembali.', 'success');
        navigasiKe('login-peserta');
      } else {
        tampilkanNotif(res.message || 'Gagal mengubah password.', 'error');
      }
    } catch {
      tampilkanNotif('Terjadi kesalahan jaringan saat mengubah password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeluarPeserta = () => {
    setDashboardPeserta(null);
    tampilkanNotif('Anda telah keluar dari akun.', 'info');
    navigasiKe('home');
  };

  // 4. Login Panitia (PIN)
  const handleLoginPin = async (pin: string) => {
    setLoading(true);
    try {
      const valid = await apiService.verifikasiPin(pin);
      if (valid) {
        setIsPanitia(true);
        tampilkanNotif('Akses panitia berhasil diverifikasi!', 'success');
        muatStatistik();
        return true;
      } else {
        tampilkanNotif('PIN Panitia salah. Akses ditolak.', 'error');
        return false;
      }
    } catch {
      tampilkanNotif('Gagal memverifikasi PIN.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutPanitia = () => {
    setIsPanitia(false);
    tampilkanNotif('Sesi panitia diakhiri.', 'info');
    navigasiKe('home');
  };

  // 5. Buka Scanner
  const handleBukaScanner = (mode: 'berangkat' | 'pulang') => {
    setScanMode(mode);
    navigasiKe('scanner');
  };

  // 6. Scan QR Code atau ID
  const handleSubmitScan = async (idPeserta: string) => {
    setLoading(true);
    try {
      const res = await apiService.prosesScan(idPeserta, scanMode);
      if (res.status === 'success') {
        const sesi = scanMode === 'berangkat' ? 'Keberangkatan' : 'Kepulangan';
        tampilkanNotif(`Presensi ${sesi} Berhasil: ${res.nama} (${idPeserta})`, 'success');
        muatStatistik();
        muatPeserta();
      } else {
        tampilkanNotif(res.message || 'Scan gagal diproses.', 'error');
      }
    } catch {
      tampilkanNotif('Terjadi gangguan jaringan saat memproses scan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-slate-800 antialiased min-h-screen bg-slate-50 sm:bg-gradient-to-br sm:from-slate-100 sm:to-slate-300 sm:py-10 flex flex-col justify-center items-center">
      {/* Toast Notification */}
      <ToastNotif notif={notif} />

      {/* Main Container Card */}
      <div className="w-full max-w-lg mx-auto bg-white sm:rounded-[2rem] sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-0 border border-slate-100 relative flex flex-col">
        {/* KOP SURAT */}
        <KopSurat />

        {/* HEADER MERAH */}
        <HeaderMerah halamanAktif={halamanAktif} onKembali={kembali} />

        {/* MAIN CONTENT AREA */}
        <div className="p-5 sm:p-8 relative z-0 flex-1 flex flex-col">
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

          {halamanAktif === 'peserta' && (
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
              onLoginPin={handleLoginPin}
              onLogout={handleLogoutPanitia}
              onRefresh={muatStatistik}
              onBukaScanner={handleBukaScanner}
              loading={loading}
            />
          )}

          {halamanAktif === 'scanner' && (
            <QrScanner
              scanMode={scanMode}
              onKembali={() => navigasiKe('login-panitia')}
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
