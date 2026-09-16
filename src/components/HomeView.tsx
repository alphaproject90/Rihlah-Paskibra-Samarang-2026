import React from 'react';
import { HalamanType } from '../types';

interface HomeViewProps {
  onNavigasi: (hal: HalamanType) => void;
  pendaftaranDibuka?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigasi, pendaftaranDibuka = true }) => {
  return (
    <div className="space-y-4 my-auto py-6">
      {/* Tombol 1: Daftar */}
      <button 
        type="button"
        onClick={() => onNavigasi('daftar')} 
        className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white p-5 rounded-2xl font-bold shadow-lg shadow-red-600/20 flex items-center justify-between transition-all group cursor-pointer"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-tight">Daftar Sebagai Peserta</span>
              {!pendaftaranDibuka && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-950/40 text-rose-100 border border-white/30 tracking-wider">
                  DITUTUP
                </span>
              )}
            </div>
            <div className="text-xs text-red-100 font-normal">
              {!pendaftaranDibuka ? 'Pendaftaran ditutup oleh panitia' : 'Konfirmasi Kehadiran Rihlah'}
            </div>
          </div>
        </div>
        <svg className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Tombol 2: Statistik */}
      <button 
        type="button"
        onClick={() => onNavigasi('peserta')} 
        className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white p-5 rounded-2xl font-bold shadow-lg shadow-blue-600/20 flex items-center justify-between transition-all group cursor-pointer"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-lg leading-tight">Statistik Peserta</div>
            <div className="text-xs text-blue-100 font-normal">Rekap Data Keseluruhan</div>
          </div>
        </div>
        <svg className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Tombol 3: Login */}
      <button 
        type="button"
        onClick={() => onNavigasi('login-pilihan')} 
        className="w-full bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white p-5 rounded-2xl font-bold shadow-lg shadow-slate-800/20 flex items-center justify-between transition-all group cursor-pointer"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-lg leading-tight">Login</div>
            <div className="text-xs text-slate-300 font-normal">Masuk Sebagai Peserta / Panitia</div>
          </div>
        </div>
        <svg className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};
