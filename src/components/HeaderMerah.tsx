import React from 'react';
import { HalamanType } from '../types';

interface HeaderMerahProps {
  halamanAktif: HalamanType;
  onKembali: () => void;
}

export const HeaderMerah: React.FC<HeaderMerahProps> = ({ halamanAktif, onKembali }) => {
  return (
    <div className="bg-red-700 text-white p-5 sm:px-8 rounded-b-3xl shadow-md relative z-10 border-t-4 border-red-800 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-3.5">
          <div className="bg-white/20 p-2 sm:p-2.5 rounded-xl backdrop-blur-sm shrink-0 border border-white/10 shadow-inner">
            <svg 
              className="w-6 h-6 sm:w-7 sm:h-7 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none drop-shadow-sm">
              Giat Rihlah 2026
            </h1>
            <p className="text-red-100 text-xs sm:text-sm font-medium tracking-wide mt-1 opacity-90">
              Sistem Manajemen Acara
            </p>
          </div>
        </div>

        {halamanAktif !== 'home' && (
          <button 
            type="button"
            onClick={onKembali}
            className="bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-sm backdrop-blur-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
        )}
      </div>
    </div>
  );
};
