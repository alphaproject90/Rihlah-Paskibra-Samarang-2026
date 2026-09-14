import React from 'react';

export const KopSurat: React.FC = () => {
  return (
    <div className="bg-white pt-6 pb-4 px-4 sm:px-8 flex items-center justify-between relative z-20 shadow-sm shrink-0">
      {/* Logo Kiri: POKJA */}
      <img
        src="https://lh3.googleusercontent.com/d/1jf5aJvZ7v_39fh2BmsQ3VfuBKpGx18WU"
        alt="Logo Pokja"
        className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 drop-shadow-sm"
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={(e) => {
          // If image fails, keep layout balanced with styled monogram
          (e.target as HTMLElement).style.display = 'none';
        }}
      />

      {/* Teks Tengah KOP */}
      <div className="text-center px-1 flex flex-col items-center justify-center">
        <h2 
          className="text-[2.2rem] sm:text-[2.75rem] font-black leading-none text-black tracking-widest uppercase transform scale-x-110 select-none"
          style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}
        >
          POKJA
        </h2>
        <p className="text-[0.55rem] sm:text-[0.65rem] font-bold tracking-[0.12em] sm:tracking-[0.18em] mt-1 text-black uppercase select-none">
          Paskibra Kec. Samarang
        </p>
      </div>

      {/* Logo Kanan: Paskibra */}
      <img
        src="https://lh3.googleusercontent.com/d/1SvK550_EfYGQzRzs1sMOshMhxuQRq2Ry"
        alt="Logo Paskibra"
        className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 drop-shadow-sm transform scale-[1.25] sm:scale-[1.3]"
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
};
