import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Menu, 
  Printer, 
  Download, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  Car, 
  ShieldCheck, 
  RefreshCw,
  FileCheck,
  AlertCircle,
  FileUp,
  User,
  Phone,
  HeartPulse
} from 'lucide-react';
import { DokumenRihlah, PesertaRihlah, BuktiPendaftaranData } from '../types';
import { apiService } from '../services/apiService';
import { SidebarPeserta, PesertaTabType } from './peserta/SidebarPeserta';
import { GantiPasswordView } from './GantiPasswordView';

interface DashboardPesertaViewProps {
  peserta: PesertaRihlah;
  onKeluar: () => void;
}

export const DashboardPesertaView: React.FC<DashboardPesertaViewProps> = ({ peserta, onKeluar }) => {
  const [activeTab, setActiveTab] = useState<PesertaTabType>('ringkasan');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [currentPeserta, setCurrentPeserta] = useState<PesertaRihlah>(peserta);

  // QR Code State
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Dokumen State
  const [daftarDokumen, setDaftarDokumen] = useState<DokumenRihlah[]>([]);
  const [loadingDokumen, setLoadingDokumen] = useState<boolean>(true);

  // Bukti Pendaftaran Server State
  const [buktiServerData, setBuktiServerData] = useState<BuktiPendaftaranData | null>(null);
  const [loadingBukti, setLoadingBukti] = useState<boolean>(false);
  const [qrBuktiDataUrl, setQrBuktiDataUrl] = useState<string>('');

  // Upload Surat Ortu State
  const [isUploadingSurat, setIsUploadingSurat] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showReupload, setShowReupload] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sinkronkan prop peserta ke state lokal jika ada perubahan luar
  useEffect(() => {
    setCurrentPeserta(peserta);
  }, [peserta]);

  // Generate QR Code Peserta
  useEffect(() => {
    if (currentPeserta.id && currentPeserta.partisipasi === 'Ikut') {
      QRCode.toDataURL(currentPeserta.id, {
        width: 240,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    }
  }, [currentPeserta.id, currentPeserta.partisipasi]);

  // Muat Dokumen Global & Personal
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

  // Muat Data Bukti Pendaftaran Resmi dari Server saat tab bukti dibuka
  useEffect(() => {
    let mounted = true;
    if (activeTab === 'bukti' && !buktiServerData) {
      setLoadingBukti(true);
      apiService.getBuktiPendaftaran().then((res) => {
        if (mounted && res.ok && res.data) {
          setBuktiServerData(res.data);
        }
        if (mounted) setLoadingBukti(false);
      });
    }
    return () => {
      mounted = false;
    };
  }, [activeTab, buktiServerData]);

  // Generate QR Code Khusus Bukti Pendaftaran (dari qrPayload resmi)
  useEffect(() => {
    if (buktiServerData?.qrPayload) {
      QRCode.toDataURL(buktiServerData.qrPayload, {
        width: 240,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      })
        .then((url) => setQrBuktiDataUrl(url))
        .catch((err) => console.error('Error generating QR Bukti:', err));
    }
  }, [buktiServerData?.qrPayload]);

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
    const namaClean = (currentPeserta.nama || currentPeserta.namaLengkap || 'Peserta').replace(/\s+/g, '_');
    a.download = `QR_${currentPeserta.id}_${namaClean}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  // Handler Upload Surat Pernyataan Orang Tua
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    // Validasi Ukuran File (Maksimal 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('Ukuran berkas terlalu besar. Maksimal 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validasi Tipe File
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Format berkas tidak valid. Harap gunakan format PDF, JPG, atau PNG.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingSurat(true);
    try {
      const res = await apiService.uploadSuratOrtu(file);
      if (res.ok && res.blob) {
        setUploadSuccess('Surat pernyataan orang tua berhasil diunggah!');
        setShowReupload(false);
        // Perbarui status peserta lokal seketika
        const urlDownload = res.blob?.downloadUrl || res.blob?.url || null;
        setCurrentPeserta(prev => ({
          ...prev,
          hasSuratOrtu: true,
          suratOrtuUrl: urlDownload
        }));

        // Refresh juga daftar dokumen
        const resDoc = await apiService.getDokumen();
        if (resDoc.ok) {
          setDaftarDokumen(resDoc.data);
        }
      } else {
        setUploadError(res.message || 'Gagal mengunggah berkas surat orang tua.');
      }
    } catch {
      setUploadError('Terjadi kesalahan koneksi saat mengunggah berkas.');
    } finally {
      setIsUploadingSurat(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const namaLengkap = currentPeserta.nama || currentPeserta.namaLengkap || '-';
  const asalUnit = currentPeserta.unit || '-';
  const assignedMobil = currentPeserta.mobil ? `Mobil #${currentPeserta.mobil}` : 'Belum Ditentukan';

  return (
    <div className="flex flex-col lg:flex-row min-h-[680px] bg-slate-100 text-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
      {/* Sidebar Peserta */}
      <SidebarPeserta
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onKeluar}
        peserta={currentPeserta}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
        {/* Top Mobile Bar */}
        <header className="lg:hidden bg-white/95 backdrop-blur-md text-slate-800 px-4 py-3.5 flex items-center justify-between border-b border-rose-100 shadow-xs shrink-0">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsOpenMobile(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-rose-50 transition cursor-pointer"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xs font-bold text-slate-900 leading-tight">
                Dasbor Peserta
              </h1>
              <p className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">
                {currentPeserta.id} • {namaLengkap}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onKeluar}
            className="text-[11px] font-bold bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-transparent px-2.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
          >
            Keluar
          </button>
        </header>

        {/* Tab Content Container */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: RINGKASAN & QR CODE                                                */}
          {/* ========================================================================= */}
          {activeTab === 'ringkasan' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Profile Card Banner - Dynamic Red Gradient */}
              <div className="bg-gradient-to-br from-red-700 via-red-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-red-600/20 relative overflow-hidden border border-red-500/30">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 bg-black/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-lg border-2 border-white/30 shrink-0">
                      {namaLengkap.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-black bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full text-white">
                          {currentPeserta.id}
                        </span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          currentPeserta.partisipasi === 'Ikut'
                            ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40'
                            : 'bg-black/20 text-rose-100 border border-white/20'
                        }`}>
                          {currentPeserta.partisipasi === 'Ikut' ? 'Partisipasi: Ikut' : 'Tidak Ikut'}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        {namaLengkap}
                      </h2>
                      <p className="text-xs sm:text-sm text-rose-100 font-medium mt-0.5">
                        {asalUnit} {currentPeserta.jk ? `• ${currentPeserta.jk}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Assigned Mobil Badge */}
                  <div className="bg-white/15 border border-white/25 rounded-2xl p-4 sm:text-right backdrop-blur-md shrink-0 shadow-xs">
                    <div className="flex items-center sm:justify-end gap-1.5 text-xs text-rose-100 font-medium mb-1">
                      <Car className="w-4 h-4 text-white" />
                      <span>Alokasi Transportasi:</span>
                    </div>
                    <div className="text-base font-black text-white">
                      {assignedMobil}
                    </div>
                    <div className="text-[11px] text-rose-100/90 mt-0.5">
                      Rombongan Mobil Peserta
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Status Surat Ortu Alert */}
              {!currentPeserta.hasSuratOrtu ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Surat Pernyataan Orang Tua Belum Diunggah
                      </h4>
                      <p className="text-[11px] text-amber-700">
                        Wajib melampirkan berkas surat izin/pernyataan orang tua sebelum hari keberangkatan.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dokumen')}
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Unggah Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">
                        Surat Pernyataan Orang Tua Terverifikasi
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        Berkas surat pernyataan sudah terunggah ke sistem.
                      </p>
                    </div>
                  </div>
                  {currentPeserta.suratOrtuUrl && (
                    <a
                      href={currentPeserta.suratOrtuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Lihat Berkas</span>
                    </a>
                  )}
                </div>
              )}

              {/* 4 Checkpoint Live Tracker */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Live Tracker Checkpoint Kegiatan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Status presensi dan pergerakan peserta di seluruh titik kegiatan
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    4 Checkpoint
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {/* Checkpoint 1: Registrasi Ulang */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Pos 1 • Registrasi
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Registrasi Ulang
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Pendaftaran &amp; verifikasi data peserta
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/40 text-[11px] font-bold text-emerald-700">
                      ✅ Terdaftar Resmi
                    </div>
                  </div>

                  {/* Checkpoint 2: Keberangkatan */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Pos 2 • Berangkat
                        </span>
                        {currentPeserta.waktuBerangkat ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Pemberangkatan
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Titik kumpul &amp; naik mobil rombongan
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/40 text-[11px] font-bold">
                      {currentPeserta.waktuBerangkat ? (
                        <span className="text-emerald-700">
                          Sudah: {currentPeserta.waktuBerangkat}
                        </span>
                      ) : (
                        <span className="text-amber-700">
                          ⏳ Menunggu Presensi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checkpoint 3: Pulang Lokasi */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Pos 3 • Pulang Lokasi
                        </span>
                        {currentPeserta.waktuPulang ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Kepulangan Lokasi
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Check-out saat meninggalkan lokasi rihlah
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/40 text-[11px] font-bold">
                      {currentPeserta.waktuPulang ? (
                        <span className="text-emerald-700">
                          Sudah: {currentPeserta.waktuPulang}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          ⏳ Menunggu Jadwal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checkpoint 4: Tiba di Rumah */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Pos 4 • Selesai
                        </span>
                        {currentPeserta.waktuPulang ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Tiba di Rumah
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Konfirmasi kepulangan dan keselamatan
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/40 text-[11px] font-bold">
                      {currentPeserta.waktuPulang ? (
                        <span className="text-blue-700">
                          ✅ Selesai Giat
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Menunggu Kepulangan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Presensi & Download / Cetak */}
              {currentPeserta.partisipasi === 'Ikut' ? (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 inline-block">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR Code Peserta" className="w-44 h-44 mx-auto" />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                          Membuat QR...
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-600 mt-3">
                      {currentPeserta.id}
                    </span>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 block mb-1">
                        Tiket Presensi Resmi
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                        Pindai QR Code untuk Setiap Titik Presensi
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                        Tunjukkan kode QR ini ke kamera ponsel Panitia / Admin Mobil saat keberangkatan, di lokasi kegiatan, maupun saat kepulangan untuk pencatatan otomatis.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition shadow-md shadow-red-600/20 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh QR Code (PNG)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('bukti')}
                        className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition shadow-xs cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Cetak Bukti Pendaftaran</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 text-red-700 p-6 rounded-3xl border border-red-200 text-center space-y-1">
                  <h4 className="font-bold text-sm">Status Partisipasi: Tidak Ikut</h4>
                  <p className="text-xs text-red-600">
                    Anda telah mengonfirmasi tidak mengikuti kegiatan rihlah ini. Tiket presensi tidak diaktifkan.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BUKTI PENDAFTARAN RESMI (PRINTABLE)                                */}
          {/* ========================================================================= */}
          {activeTab === 'bukti' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Tanda Bukti Pendaftaran Resmi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Slip bukti keikutsertaan kegiatan Rihlah Paskibra Samarang 2026
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Slip (PDF)</span>
                </button>
              </div>

              {/* Status Validasi Server Banner */}
              {buktiServerData?.verificationCode && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-xs gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5 text-emerald-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tervalidasi Resmi: <code className="font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[11px]">{buktiServerData.verificationCode}</code></span>
                  </div>
                  <span className="text-[11px] text-emerald-700">
                    Diterbitkan: {new Date(buktiServerData.officialIssuedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              )}

              {/* Slip Card */}
              <div id="slip-pendaftaran" className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200 shadow-md space-y-6 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0">
                {/* Official Letterhead Bar */}
                <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1 relative">
                  <div className="h-1 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-700 mb-3" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                    Panitia Pelaksana Rihlah Akbar 2026
                  </h3>
                  <h2 className="text-base sm:text-xl font-black uppercase text-slate-900">
                    PASKIBRA KECAMATAN SAMARANG
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    Sekretariat: Samarang, Garut, Jawa Barat • Kontak: 0813-1383-1490
                  </p>
                </div>

                <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    LEMBAR BUKTI PENDAFTARAN &amp; TIKET PESERTA
                  </span>
                </div>

                {/* Details Grid & QR */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  <div className="sm:col-span-2 space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-medium">Nomor ID</span>
                      <span className="col-span-2 font-mono font-bold text-slate-900">{currentPeserta.id}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-medium">Nama Lengkap</span>
                      <span className="col-span-2 font-bold text-slate-900">{namaLengkap}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-medium">Jenis Kelamin</span>
                      <span className="col-span-2 text-slate-800">{currentPeserta.jk || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-medium">Asal Unit/Sekolah</span>
                      <span className="col-span-2 font-semibold text-slate-800">{asalUnit}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-medium">Alokasi Mobil</span>
                      <span className="col-span-2 font-bold text-red-600">{assignedMobil}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-medium">Kontak WhatsApp</span>
                      <span className="col-span-2 text-slate-800">{currentPeserta.waPeserta || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-medium">Kontak Darurat</span>
                      <span className="col-span-2 text-slate-800">{currentPeserta.waDarurat || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-medium">Catatan Medis</span>
                      <span className="col-span-2 text-slate-800">{currentPeserta.medis || 'Tidak Ada'}</span>
                    </div>
                    {buktiServerData?.verificationCode && (
                      <div className="grid grid-cols-3 gap-2 items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-400 font-medium">Kode Verifikasi</span>
                        <div className="col-span-2 flex items-center justify-between gap-3">
                          <span className="font-mono font-bold text-emerald-700">
                            {buktiServerData.verificationCode}
                          </span>
                          {qrBuktiDataUrl && (
                            <div className="flex flex-col items-center p-1 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                              <img src={qrBuktiDataUrl} alt="QR Verifikasi Keaslian" className="w-16 h-16" />
                              <span className="text-[8px] font-semibold text-slate-500 mt-0.5">
                                QR Verifikasi Keaslian
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Box in Slip */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    {qrDataUrl && (
                      <img src={qrDataUrl} alt="QR Code" className="w-36 h-36" />
                    )}
                    <span className="text-[10px] text-slate-500 font-mono font-bold mt-2">
                      Scan untuk Presensi
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
                      {buktiServerData?.verificationCode ? buktiServerData.verificationCode : 'VALIDASI SISTEM 2026'}
                    </span>
                  </div>
                </div>

                {/* Footer Notes & Signature Placeholder */}
                <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
                  <div className="space-y-1 max-w-sm">
                    <p className="font-semibold text-slate-700">Ketentuan Peserta:</p>
                    <p>1. Wajib membawa lembar tanda bukti ini saat presensi keberangkatan.</p>
                    <p>2. Menjaga ketertiban, disiplin dan keselamatan rombongan.</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p>Samarang, {buktiServerData ? new Date(buktiServerData.officialIssuedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold text-slate-800 mt-6">
                      {buktiServerData?.panitiaContact ? `Panitia Pelaksana (${buktiServerData.panitiaContact})` : 'Panitia Pelaksana Rihlah'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DOKUMEN SAYA (UPLOAD SURAT ORTU + DOKUMEN UMUM)                     */}
          {/* ========================================================================= */}
          {activeTab === 'dokumen' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* SECTION A: Upload Surat Pernyataan Orang Tua */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 block">
                      Berkas Wajib Peserta
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Surat Pernyataan &amp; Izin Orang Tua
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Unggah scan / foto surat pernyataan izin orang tua (PDF, JPG, PNG maks 5MB)
                    </p>
                  </div>
                  <div className="shrink-0">
                    {currentPeserta.hasSuratOrtu ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sudah Diunggah</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Belum Diunggah</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Feedback Alerts */}
                {uploadSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}
                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Existing Document Card if Uploaded */}
                {currentPeserta.hasSuratOrtu && !showReupload ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Surat Pernyataan Orang Tua (Tersimpan)
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tersimpan aman di penyimpanan dokumen panitia
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentPeserta.suratOrtuUrl && (
                        <a
                          href={currentPeserta.suratOrtuUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Berkas</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowReupload(true)}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Ganti Berkas
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Upload Form / Dropzone */
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="application/pdf,image/jpeg,image/png"
                      className="hidden"
                      id="input-surat-ortu"
                    />

                    <label
                      htmlFor="input-surat-ortu"
                      className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition cursor-pointer ${
                        isUploadingSurat 
                          ? 'border-blue-400 bg-blue-50/50 pointer-events-none' 
                          : 'border-slate-300 hover:border-red-500 hover:bg-slate-50/80'
                      }`}
                    >
                      {isUploadingSurat ? (
                        <div className="flex flex-col items-center space-y-2">
                          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                          <span className="text-xs font-bold text-slate-700">
                            Mengunggah berkas ke server...
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Mohon tunggu beberapa detik hingga token diverifikasi
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 block">
                            Klik atau seret file surat pernyataan ke sini
                          </span>
                          <span className="text-[11px] text-slate-500 mt-1 block">
                            Format yang didukung: <span className="font-semibold text-slate-700">PDF, JPG, PNG</span> (Maks. 5 MB)
                          </span>
                          <span className="mt-3 inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs">
                            Pilih File dari Perangkat
                          </span>
                        </>
                      )}
                    </label>

                    {showReupload && (
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setShowReupload(false)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-bold transition cursor-pointer"
                        >
                          Batal Ganti Berkas
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION B: Dokumen & Berkas Kegiatan (Global & Personal) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Dokumen &amp; Panduan Kegiatan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Unduh berkas panduan umum, jadwal, dan dokumen resmi lainnya
                    </p>
                  </div>
                  <span className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                    {daftarDokumen.length} Berkas
                  </span>
                </div>

                {loadingDokumen ? (
                  <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    <span>Memuat daftar berkas...</span>
                  </div>
                ) : daftarDokumen.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Belum ada dokumen panduan yang tersedia saat ini.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Dokumen global dari panitia akan muncul di sini secara otomatis.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {daftarDokumen.map((doc) => {
                      const downloadUrl = doc.blobDownloadUrl || doc.blobUrl;
                      return (
                        <div
                          key={doc.id}
                          className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-50 transition flex items-center justify-between gap-3"
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
                            className="shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: GANTI PASSWORD AKUN                                                */}
          {/* ========================================================================= */}
          {activeTab === 'password' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="pb-2 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  Keamanan &amp; Ganti Kata Sandi
                </h2>
                <p className="text-xs text-slate-500">
                  Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan data
                </p>
              </div>

              <div className="py-2">
                <GantiPasswordView
                  onBatal={() => setActiveTab('ringkasan')}
                  onSuccess={() => {
                    setActiveTab('ringkasan');
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
