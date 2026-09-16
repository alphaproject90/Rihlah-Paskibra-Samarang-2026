import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { DokumenRihlah, PesertaRihlah } from '../types';
import { apiService } from '../services/apiService';

interface DashboardPesertaViewProps {
  peserta: PesertaRihlah;
  onKeluar: () => void;
}

export const DashboardPesertaView: React.FC<DashboardPesertaViewProps> = ({ peserta, onKeluar }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [daftarDokumen, setDaftarDokumen] = useState<DokumenRihlah[]>([]);
  const [loadingDokumen, setLoadingDokumen] = useState<boolean>(true);

  useEffect(() => {
    if (peserta.id && peserta.partisipasi === 'Ikut') {
      QRCode.toDataURL(peserta.id, {
        width: 220,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    }
  }, [peserta.id, peserta.partisipasi]);

  useEffect(() => {
    let mounted = true;
    const muatDokumen = async () => {
      setLoadingDokumen(true);
      const res = await apiService.getDokumen();
      if (mounted && res.ok) {
        setDaftarDokumen(res.data);
      }
      if (mounted) setLoadingDokumen(false);
    };
    muatDokumen();
    return () => {
      mounted = false;
    };
  }, []);

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${peserta.id}_${peserta.nama.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header Avatar & Nama */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 font-black rounded-2xl flex items-center justify-center text-lg shadow-inner">
            {peserta.nama.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base leading-tight">
              {peserta.nama}
            </h4>
            <p className="text-xs text-slate-500">{peserta.unit}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onKeluar}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
        >
          Keluar
        </button>
      </div>

      {/* Baris Status & ID */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1">
            Status Partisipasi
          </span>
          <span
            className={`text-sm font-black px-2.5 py-0.5 rounded-full inline-block ${
              peserta.partisipasi === 'Ikut'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {peserta.partisipasi}
          </span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1">
            ID Peserta
          </span>
          <span className="text-sm font-mono font-black text-slate-800">
            {peserta.id}
          </span>
        </div>
      </div>

      {/* Konten untuk Peserta Ikut */}
      {peserta.partisipasi === 'Ikut' ? (
        <div className="space-y-4">
          {/* Status Presensi */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-600">Check-in Berangkat</span>
              <span
                className={`text-xs font-bold flex items-center space-x-1 ${
                  peserta.waktuBerangkat ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full inline-block ${
                    peserta.waktuBerangkat ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                />
                <span>{peserta.waktuBerangkat || 'Belum Check-in'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Check-in Pulang</span>
              <span
                className={`text-xs font-bold flex items-center space-x-1 ${
                  peserta.waktuPulang ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full inline-block ${
                    peserta.waktuPulang ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                />
                <span>{peserta.waktuPulang || 'Belum Check-in'}</span>
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Tiket Presensi QR Code
            </span>
            <div className="flex justify-center my-2">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 inline-block">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Peserta" className="w-44 h-44 mx-auto" />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                    Memuat QR...
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Tunjukkan QR ini ke panitia untuk presensi keberangkatan &amp; kepulangan
            </p>
          </div>

          {/* Tombol Aksi */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="w-full bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Unduh QR Code</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Cetak Bukti</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100 text-center text-sm font-semibold">
          Anda terdaftar sebagai Tidak Ikut pada kegiatan ini.
        </div>
      )}

      {/* Dokumen & Berkas (Fase C) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Dokumen &amp; Berkas</h4>
            <p className="text-xs text-slate-500">Panduan umum dan sertifikat / berkas personal Anda</p>
          </div>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
            {daftarDokumen.length} Berkas
          </span>
        </div>

        {loadingDokumen ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Memuat berkas...
          </div>
        ) : daftarDokumen.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
            <svg className="w-8 h-8 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs text-slate-500 font-medium">Belum ada dokumen yang tersedia untuk kamu saat ini.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Dokumen global atau berkas personal dari panitia akan muncul di sini.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {daftarDokumen.map((doc) => {
              // Menggunakan blobDownloadUrl untuk unduhan langsung (fallback ke blobUrl jika belum terisi)
              const downloadUrl = doc.blobDownloadUrl || doc.blobUrl;
              return (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                          doc.scope === 'GLOBAL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {doc.scope === 'GLOBAL' ? 'Dokumen Umum' : 'Personal'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatSize(doc.ukuranByte)}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-800 truncate" title={doc.judul}>
                      {doc.judul}
                    </h5>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {new Date(doc.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <a
                    href={downloadUrl}
                    download={doc.judul.toLowerCase().endsWith('.pdf') ? doc.judul : `${doc.judul}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Unduh</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Catatan Akses Publik (Sesuai Konfirmasi Blob Store Publik) */}
        <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
          💡 <span className="font-semibold">Catatan:</span> Dokumen tersimpan secara publik dan dapat diakses langsung melalui tautan unduhan tanpa otentikasi tambahan jika tautan dibagikan ulang (tautan acak, tidak dijaga sesi).
        </p>
      </div>
    </div>
  );
};
