import React from 'react';
import { HalamanType } from '../types';

interface LoginPilihanViewProps {
  onNavigasi: (hal: HalamanType) => void;
}

export const LoginPilihanView: React.FC<LoginPilihanViewProps> = ({ onNavigasi }) => {
  return (
    <div className="space-y-4 my-auto py-6">
      <button 
        type="button"
        onClick={() => onNavigasi('login-peserta')} 
        className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white p-5 rounded-2xl font-bold shadow-lg shadow-blue-600/20 flex items-center justify-between transition-all group cursor-pointer"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-lg leading-tight">Login Peserta</div>
            <div className="text-xs text-blue-100 font-normal">Cek Status & Tiket Pribadi Anda</div>
          </div>
        </div>
        <svg className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button 
        type="button"
        onClick={() => onNavigasi('login-panitia')} 
        className="w-full bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white p-5 rounded-2xl font-bold shadow-lg shadow-slate-800/20 flex items-center justify-between transition-all group cursor-pointer"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-lg leading-tight">Login Panitia</div>
            <div className="text-xs text-slate-300 font-normal">Akses Pemindai & Dasbor</div>
          </div>
        </div>
        <svg className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};
