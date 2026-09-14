import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { StatsRihlah } from '../types';

interface LoginPanitiaViewProps {
  isPanitia: boolean;
  stats: StatsRihlah;
  onLoginPin: (pin: string) => Promise<boolean>;
  onLogout: () => void;
  onRefresh: () => void;
  onBukaScanner: (mode: 'berangkat' | 'pulang') => void;
  loading: boolean;
}

export const LoginPanitiaView: React.FC<LoginPanitiaViewProps> = ({
  isPanitia,
  stats,
  onLoginPin,
  onLogout,
  onRefresh,
  onBukaScanner,
  loading
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSubmitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    await onLoginPin(pinInput.trim());
    setPinInput('');
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
            Masukkan PIN keamanan untuk mengakses sistem
          </p>
        </div>

        <form onSubmit={handleSubmitPin} className="space-y-4">
          <div>
            <div className="relative">
              <input
                id="login-panitia-pin-input"
                type={showPin ? "text" : "password"}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={showPin ? "0000" : "••••"}
                maxLength={8}
                required
                className="w-full bg-slate-800 text-white text-center tracking-[0.5em] text-2xl font-black p-4 pr-12 rounded-xl border border-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
              />
              <button
                type="button"
                id="login-panitia-toggle-pin-btn"
                onClick={() => setShowPin(!showPin)}
                aria-label={showPin ? "Sembunyikan PIN" : "Lihat PIN"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[11px] text-slate-400">
                Default PIN Panitia: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-red-400 font-mono">0000</code>
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !pinInput}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] font-bold p-4 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{loading ? 'Memeriksa PIN...' : 'Masuk ke Dasbor'}</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Dasbor Panitia */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-black text-slate-800">Dasbor Panitia</h3>
          <p className="text-xs text-slate-500">Monitoring &amp; Pemindai Presensi</p>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Grid 4 Kartu Metrik Dasbor */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Ikut
          </span>
          <span className="text-2xl font-black text-slate-800 block mt-0.5">
            {stats.total}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Tidak Ikut
          </span>
          <span className="text-2xl font-black text-slate-800 block mt-0.5">
            {stats.tidakIkut}
          </span>
        </div>
        <div className="bg-green-50/60 border border-green-100 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider block">
            Check-in Berangkat
          </span>
          <span className="text-2xl font-black text-green-700 block mt-0.5">
            {stats.berangkat}
          </span>
        </div>
        <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
            Check-in Pulang
          </span>
          <span className="text-2xl font-black text-blue-700 block mt-0.5">
            {stats.pulang}
          </span>
        </div>
      </div>

      {/* Tombol Aksi Scanner */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => onBukaScanner('berangkat')}
          className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white p-4 rounded-2xl font-bold shadow-lg shadow-green-600/20 flex items-center justify-between transition cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-base font-black leading-tight">Mulai Scan Keberangkatan</div>
              <div className="text-xs text-green-100 font-normal">Presensi pagi sebelum rute dimulai</div>
            </div>
          </div>
          <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onBukaScanner('pulang')}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 flex items-center justify-between transition cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-base font-black leading-tight">Mulai Scan Kepulangan</div>
              <div className="text-xs text-blue-100 font-normal">Presensi akhir setelah kegiatan selesai</div>
            </div>
          </div>
          <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
