import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface GantiPasswordViewProps {
  onSubmit: (identifier: string, noWa: string, newPass: string, confirmPass: string) => Promise<void>;
  onBatal: () => void;
  loading: boolean;
}

export const GantiPasswordView: React.FC<GantiPasswordViewProps> = ({ onSubmit, onBatal, loading }) => {
  const [identifier, setIdentifier] = useState('');
  const [noWa, setNoWa] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(identifier.trim(), noWa.trim(), newPassword, confirmPassword);
  };

  return (
    <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-xl space-y-4 my-auto">
      <div className="text-center">
        <div className="w-12 h-12 bg-slate-700/70 rounded-2xl flex items-center justify-center mx-auto mb-2 text-amber-400 shadow-inner">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h3 className="text-xl font-black">Lupa / Ganti Password</h3>
        <p className="text-xs text-slate-300 mt-1">
          Reset password akun peserta Anda melalui verifikasi identitas terdaftar
        </p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 leading-relaxed">
        <span className="font-bold block mb-0.5">ℹ️ Petunjuk Reset:</span>
        Masukkan Username atau ID Peserta beserta nomor WhatsApp yang Anda gunakan saat mendaftar kegiatan.
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Username atau ID Peserta <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="Contoh: abdulf atau PASK-A1"
            className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700 text-sm focus:ring-2 focus:ring-amber-400 outline-none placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Nomor WhatsApp Terdaftar <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            value={noWa}
            onChange={(e) => setNoWa(e.target.value)}
            required
            placeholder="Contoh: 081234567890"
            className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700 text-sm focus:ring-2 focus:ring-amber-400 outline-none placeholder:text-slate-500 font-mono"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">
            Harus sama dengan nomor WhatsApp saat pendaftaran
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Password Baru <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="ganti-new-password-input"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Min. 8 karakter kombinasi"
              className="w-full bg-slate-900 text-white p-3 pr-11 rounded-xl border border-slate-700 text-sm focus:ring-2 focus:ring-amber-400 outline-none placeholder:text-slate-500"
            />
            <button
              type="button"
              id="ganti-toggle-new-password-btn"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? 'Sembunyikan password baru' : 'Lihat password baru'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer p-1"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Konfirmasi Password Baru <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="ganti-confirm-password-input"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Ulangi password baru"
              className="w-full bg-slate-900 text-white p-3 pr-11 rounded-xl border border-slate-700 text-sm focus:ring-2 focus:ring-amber-400 outline-none placeholder:text-slate-500"
            />
            <button
              type="button"
              id="ganti-toggle-confirm-password-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer p-1"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="submit"
            disabled={loading || !identifier || !noWa || !newPassword || !confirmPassword}
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-black p-3.5 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{loading ? 'Memverifikasi...' : 'Simpan Password Baru'}</span>
          </button>

          <button
            type="button"
            onClick={onBatal}
            disabled={loading}
            className="w-full bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white font-bold p-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            Batal &amp; Kembali ke Login
          </button>
        </div>
      </form>
    </div>
  );
};
