import React, { useEffect, useState } from 'react';
import { Peserta } from '../types';
import { generateQrDataUrl } from '../utils/audio';
import { X, Printer, Shield, HeartPulse, PhoneCall, Award } from 'lucide-react';

interface IdCardModalProps {
  peserta: Peserta | null;
  onClose: () => void;
}

export const IdCardModal: React.FC<IdCardModalProps> = ({ peserta, onClose }) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (peserta) {
      // Encode standard payload for scanner
      const payload = JSON.stringify({
        id: peserta.id,
        nama: peserta.nama,
        sekolah: peserta.sekolah,
        regu: peserta.regu
      });
      generateQrDataUrl(peserta.id).then(setQrUrl);
    }
  }, [peserta]);

  if (!peserta) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Modal Controls Header */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-800 text-sm">Tanda Pengenal & E-Badge</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 sm:p-8 flex justify-center">
          <div className="w-full max-w-sm rounded-2xl bg-white border-2 border-red-600 shadow-lg overflow-hidden flex flex-col items-center text-center relative">
            
            {/* Red & White Header Top */}
            <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white py-4 px-3 relative">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-yellow-300" />
                <span className="text-[11px] font-extrabold tracking-widest uppercase">PASKIBAR KEC. SAMARANG</span>
              </div>
              <h4 className="text-base font-black tracking-tight mt-0.5">GIAT RIHLAH 2026</h4>
              <p className="text-[10px] text-red-100 font-medium">Bumi Perkemahan Kamojang, Garut</p>
              
              {/* Lanyard Hole Mockup */}
              <div className="w-5 h-5 rounded-full bg-slate-900/40 border-2 border-white/60 mx-auto -mt-6 mb-2"></div>
            </div>

            {/* Badge Type Banner */}
            <div className="w-full bg-slate-900 text-white text-[11px] font-bold py-1 tracking-wider uppercase">
              {peserta.tingkat}
            </div>

            {/* Card Content Body */}
            <div className="p-5 w-full flex flex-col items-center space-y-3">
              
              {/* QR Code Container */}
              <div className="p-2.5 rounded-xl bg-white border-2 border-dashed border-slate-300 shadow-xs">
                {qrUrl ? (
                  <img 
                    src={qrUrl} 
                    alt={`QR Code ${peserta.id}`} 
                    className="w-36 h-36 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                    Memuat QR...
                  </div>
                )}
              </div>
              <div className="text-[11px] font-mono font-bold text-red-600 bg-red-50 px-3 py-0.5 rounded-full border border-red-200">
                {peserta.id}
              </div>

              {/* Participant Details */}
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                  {peserta.nama}
                </h2>
                <p className="text-xs font-semibold text-slate-600">
                  {peserta.sekolah}
                </p>
                <div className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold">
                  🏕️ {peserta.regu}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="w-full grid grid-cols-2 gap-2 text-[11px] text-left pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Golongan Darah</span>
                  <span className="font-bold text-slate-800">{peserta.golonganDarah}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Ukuran Kaos</span>
                  <span className="font-bold text-slate-800">{peserta.ukuranKaos}</span>
                </div>
              </div>

              {/* Medical & Emergency info */}
              {peserta.riwayatMedis && peserta.riwayatMedis !== 'Tidak ada' && (
                <div className="w-full text-left bg-amber-50 border border-amber-200 rounded-lg p-2 text-[10px] text-amber-900 flex items-start gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Medis:</span> {peserta.riwayatMedis}
                  </div>
                </div>
              )}

              <div className="w-full text-left bg-slate-50 rounded-lg p-2 text-[10px] text-slate-600 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Darurat: {peserta.kontakDarurat}</span>
              </div>

            </div>

            {/* Footer Notice */}
            <div className="w-full bg-slate-100 py-2 text-[9px] text-slate-500 font-medium border-t border-slate-200">
              Wajib dikalungkan selama Giat Rihlah Paskibar Samarang
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="no-print px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
