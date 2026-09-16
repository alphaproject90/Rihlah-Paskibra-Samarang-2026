import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { StatsRihlah, PesertaRihlah } from '../types';
import { PanitiaTabType } from './panitia/types';
import { DashboardPanitiaShell } from './panitia/DashboardPanitiaShell';

interface LoginPanitiaViewProps {
  isPanitia: boolean;
  stats: StatsRihlah;
  onLoginPanitia: (username: string, password: string) => Promise<boolean>;
  onLogout: () => void;
  onRefresh: () => void;
  onRefreshPeserta: () => void | Promise<void>;
  tampilkanNotif?: (pesan: string, tipe?: 'info' | 'success' | 'error') => void;
  onBukaScanner: (mode: 'berangkat' | 'pulang') => void;
  loading: boolean;
  panitiaTab?: PanitiaTabType;
  onTabChange?: (tab: PanitiaTabType) => void;
  pesertaList?: PesertaRihlah[];
}

export const LoginPanitiaView: React.FC<LoginPanitiaViewProps> = ({
  isPanitia,
  stats,
  onLoginPanitia,
  onLogout,
  onRefresh,
  onRefreshPeserta,
  tampilkanNotif,
  onBukaScanner,
  loading,
  panitiaTab = 'ringkasan',
  onTabChange = () => {},
  pesertaList = []
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput) return;
    await onLoginPanitia(usernameInput.trim(), passwordInput);
    setPasswordInput('');
  };

  if (!isPanitia) {
    return (
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 my-auto">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-2 text-slate-300 shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-black">Autentikasi Panitia</h3>
          <p className="text-xs text-slate-400 mt-1">
            Masuk dengan akun panitia untuk mengakses sistem
          </p>
        </div>

        <form onSubmit={handleSubmitLogin} className="space-y-4">
          <div>
            <input
              id="login-panitia-username-input"
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              required
              className="w-full bg-slate-800 text-white p-4 rounded-xl border border-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          <div className="relative">
            <input
              id="login-panitia-password-input"
              type={showPassword ? "text" : "password"}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full bg-slate-800 text-white p-4 pr-12 rounded-xl border border-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
            />
            <button
              type="button"
              id="login-panitia-toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer p-1"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !usernameInput || !passwordInput}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] font-bold p-4 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{loading ? 'Memeriksa akun...' : 'Masuk ke Dasbor'}</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <DashboardPanitiaShell
      panitiaTab={panitiaTab}
      onTabChange={onTabChange}
      onLogout={onLogout}
      stats={stats}
      pesertaList={pesertaList}
      onRefresh={onRefresh}
      onRefreshPeserta={onRefreshPeserta}
      tampilkanNotif={tampilkanNotif}
      onBukaScanner={onBukaScanner}
      loading={loading}
    />
  );
};

