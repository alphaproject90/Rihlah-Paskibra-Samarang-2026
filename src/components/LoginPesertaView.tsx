import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface LoginPesertaViewProps {
  onLogin: (username: string, pass: string) => Promise<void>;
  onLupaPassword: () => void;
  loading: boolean;
}

export const LoginPesertaView: React.FC<LoginPesertaViewProps> = ({ onLogin, onLupaPassword, loading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    onLogin(username.trim(), password);
  };

  return (
    <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-xl space-y-4 my-auto">
      <div className="text-center">
        <h3 className="text-xl font-black">Login Peserta</h3>
        <p className="text-xs text-blue-100 mt-1">
          Masukkan akun yang Anda buat saat pendaftaran
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-blue-100 mb-1">
            Username
          </label>
          <input
            id="login-username-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="Username Anda"
            className="w-full bg-white text-slate-800 p-3.5 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-white outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-blue-100 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password Anda"
              className="w-full bg-white text-slate-800 p-3.5 pr-12 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-white outline-none"
            />
            <button
              type="button"
              id="login-toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full bg-white text-blue-700 hover:bg-blue-50 active:scale-[0.98] font-black p-4 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer mt-2"
        >
          {loading && (
            <svg className="animate-spin h-5 w-5 text-blue-700" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          <span>{loading ? 'Memverifikasi...' : 'Masuk'}</span>
        </button>
      </form>

      {/* Tautan Lupa Password */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onLupaPassword}
          className="text-xs text-blue-100 hover:text-white font-bold underline transition cursor-pointer py-1"
        >
          Lupa Password? Klik di sini untuk Ganti Password
        </button>
      </div>

      {/* Akun Uji Coba */}
      <div className="bg-blue-700/60 rounded-xl p-3 text-[11px] text-blue-100 border border-blue-400/30">
        <span className="font-bold">Contoh Akun Demo:</span><br />
        Username: <code className="bg-blue-800/80 px-1.5 py-0.5 rounded text-white font-mono">abdulf</code> &bull; Password: <code className="bg-blue-800/80 px-1.5 py-0.5 rounded text-white font-mono">rihlah2026</code>
      </div>
    </div>
  );
};
