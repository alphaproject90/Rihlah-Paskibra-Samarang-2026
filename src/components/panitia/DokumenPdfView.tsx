import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Download, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Globe, 
  ExternalLink, 
  RefreshCw,
  Info,
  FileCheck
} from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { DokumenRihlah } from '../../types';
import { apiService } from '../../services/apiService';

interface DokumenPdfViewProps {
  tampilkanNotif?: (pesan: string, tipe?: 'info' | 'success' | 'error') => void;
}

interface UploadStatusItem {
  fileName: string;
  idPeserta: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  pesan?: string;
}

export function formatUkuranFile(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const DokumenPdfView: React.FC<DokumenPdfViewProps> = ({ tampilkanNotif }) => {
  // State Dokumen
  const [daftarDokumen, setDaftarDokumen] = useState<DokumenRihlah[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Tab Seksi: 'global' | 'personal'
  const [activeSection, setActiveSection] = useState<'global' | 'personal'>('global');

  // State Form Global Upload
  const [judulGlobal, setJudulGlobal] = useState<string>('');
  const [fileGlobal, setFileGlobal] = useState<File | null>(null);
  const [uploadingGlobal, setUploadingGlobal] = useState<boolean>(false);

  // State Form Bulk Personal Upload
  const [filesPersonal, setFilesPersonal] = useState<File[]>([]);
  const [uploadingPersonal, setUploadingPersonal] = useState<boolean>(false);
  const [uploadQueue, setUploadQueue] = useState<UploadStatusItem[]>([]);

  // Search & Filter state untuk tabel personal
  const [searchPersonal, setSearchPersonal] = useState<string>('');

  // Fetch dokumen
  const muatDokumen = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getDokumen();
      if (res.ok) {
        setDaftarDokumen(res.data);
      } else if (tampilkanNotif) {
        tampilkanNotif(res.message || 'Gagal memuat dokumen.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [tampilkanNotif]);

  // Helper retry fetch dokumen setelah upload untuk mengatasi race condition webhook onUploadCompleted
  const muatDokumenDenganRetry = useCallback(async (
    cekBaru: (list: DokumenRihlah[]) => boolean,
    maxRetry = 3,
    delayMs = 700
  ) => {
    for (let i = 0; i < maxRetry; i++) {
      const res = await apiService.getDokumen();
      if (res.ok) {
        setDaftarDokumen(res.data);
        if (cekBaru(res.data)) return;
      }
      if (i < maxRetry - 1) await new Promise(r => setTimeout(r, delayMs));
    }
  }, []);

  useEffect(() => {
    muatDokumen();
  }, [muatDokumen]);

  // Handler Hapus Dokumen
  const handleHapusDokumen = async (doc: DokumenRihlah) => {
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin menghapus dokumen "${doc.judul}"? File akan dihapus permanen.`);
    if (!konfirmasi) return;

    setDeletingId(doc.id);
    try {
      const res = await apiService.deleteDokumen(doc.id);
      if (res.ok) {
        if (tampilkanNotif) tampilkanNotif(`Dokumen "${doc.judul}" berhasil dihapus.`, 'success');
        setDaftarDokumen(prev => prev.filter(d => d.id !== doc.id));
      } else if (tampilkanNotif) {
        tampilkanNotif(res.message || 'Gagal menghapus dokumen.', 'error');
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Handler Upload Dokumen Global
  const handleUploadGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileGlobal) {
      if (tampilkanNotif) tampilkanNotif('Pilih file PDF terlebih dahulu.', 'error');
      return;
    }
    if (!fileGlobal.name.toLowerCase().endsWith('.pdf')) {
      if (tampilkanNotif) tampilkanNotif('Hanya file berformat .pdf yang diizinkan.', 'error');
      return;
    }

    setUploadingGlobal(true);
    try {
      const judul = judulGlobal.trim() || fileGlobal.name.replace(/\.[^/.]+$/, '');
      const jumlahSebelum = daftarDokumen.length;
      
      // Upload via Vercel Blob client helper
      // Catatan: PutBlobResult tidak memiliki properti size di v2.8.0, kirim ukuranByte via clientPayload
      await upload(fileGlobal.name, fileGlobal, {
        access: 'public',
        handleUploadUrl: '/api/dokumen/upload',
        clientPayload: JSON.stringify({
          judul,
          scope: 'GLOBAL',
          ukuranByte: fileGlobal.size,
        }),
      });

      if (tampilkanNotif) tampilkanNotif(`Dokumen global "${judul}" berhasil diunggah!`, 'success');
      setJudulGlobal('');
      setFileGlobal(null);
      await muatDokumenDenganRetry(list => list.length > jumlahSebelum);
    } catch (err: any) {
      console.error('Upload global error:', err);
      if (tampilkanNotif) tampilkanNotif(err.message || 'Gagal mengunggah dokumen global.', 'error');
    } finally {
      setUploadingGlobal(false);
    }
  };

  // Handler Pemilihan Multiple Files Personal
  const handleSelectPersonalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    setFilesPersonal(selected);

    const initialQueue: UploadStatusItem[] = selected.map(f => {
      const candidateId = f.name.replace(/\.[^/.]+$/, '').trim();
      return {
        fileName: f.name,
        idPeserta: candidateId,
        status: 'pending',
      };
    });
    setUploadQueue(initialQueue);
  };

  // Handler Proses Upload Bulk Personal
  const handleProsesBulkPersonal = async () => {
    if (filesPersonal.length === 0) return;

    setUploadingPersonal(true);
    const jumlahSebelum = daftarDokumen.length;
    let suksesCount = 0;
    let gagalCount = 0;

    for (let i = 0; i < filesPersonal.length; i++) {
      const file = filesPersonal[i];
      const candidateId = file.name.replace(/\.[^/.]+$/, '').trim();

      // Update status queue ke 'uploading'
      setUploadQueue(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'uploading' } : item
      ));

      try {
        await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/dokumen/upload',
          clientPayload: JSON.stringify({
            judul: file.name,
            scope: 'PERSONAL',
            idPeserta: candidateId,
            ukuranByte: file.size,
          }),
        });

        suksesCount++;
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'success', pesan: 'Berhasil diunggah & dicocokkan' } : item
        ));
      } catch (err: any) {
        gagalCount++;
        console.error(`Gagal upload ${file.name}:`, err);
        const pesanErr = err.message || 'Gagal upload';
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'error', pesan: pesanErr } : item
        ));
      }
    }

    setUploadingPersonal(false);
    if (tampilkanNotif) {
      if (gagalCount === 0) {
        tampilkanNotif(`Semua ${suksesCount} dokumen personal berhasil diunggah!`, 'success');
      } else {
        tampilkanNotif(`Proses selesai: ${suksesCount} berhasil, ${gagalCount} gagal. Periksa tabel ringkasan.`, 'info');
      }
    }

    // Refresh daftar dokumen dengan retry untuk menutup race condition webhook server
    await muatDokumenDenganRetry(list => list.length >= jumlahSebelum + suksesCount);
  };

  // Dokumen Global Filtered
  const dokumenGlobalList = useMemo(() => {
    return daftarDokumen.filter(d => d.scope === 'GLOBAL');
  }, [daftarDokumen]);

  // Dokumen Personal Filtered
  const dokumenPersonalList = useMemo(() => {
    return daftarDokumen.filter(d => {
      if (d.scope !== 'PERSONAL') return false;
      if (!searchPersonal.trim()) return true;
      const q = searchPersonal.toLowerCase().trim();
      const id = (d.idPeserta || '').toLowerCase();
      const judul = (d.judul || '').toLowerCase();
      const namaPeserta = (d.peserta?.namaLengkap || '').toLowerCase();
      return id.includes(q) || judul.includes(q) || namaPeserta.includes(q);
    });
  }, [daftarDokumen, searchPersonal]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header & Sub-Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Manajemen Dokumen PDF
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              {daftarDokumen.length} Berkas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Penyimpanan terdistribusi Vercel Blob untuk berkas publik dan sertifikat personal
          </p>
        </div>

        {/* Tab Buttons: Global vs Personal */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            id="tab-btn-dokumen-global"
            onClick={() => setActiveSection('global')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSection === 'global'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-purple-600" />
            <span>Dokumen Global ({dokumenGlobalList.length})</span>
          </button>
          <button
            type="button"
            id="tab-btn-dokumen-personal"
            onClick={() => setActiveSection('personal')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSection === 'personal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Dokumen Personal ({daftarDokumen.filter(d => d.scope === 'PERSONAL').length})</span>
          </button>
        </div>
      </div>

      {/* Catatan Transparansi Akses Dokumen */}
      <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Informasi Hak Akses &amp; Keamanan Tautan:</span>
          <p className="text-[11px] text-purple-800 leading-relaxed">
            Daftar dokumen hanya dapat dilihat oleh pengguna yang terautentikasi (panitia atau peserta yang bersangkutan). 
            Namun, penyimpanan berkas menggunakan tautan langsung publik dengan akhiran acak yang aman; jika tautan unduh diteruskan ke pihak lain, berkas tersebut dapat diunduh tanpa sesi login.
          </p>
        </div>
      </div>

      {/* ─── SEKSI A: DOKUMEN GLOBAL ────────────────────────────────────────── */}
      {activeSection === 'global' && (
        <div className="space-y-5">
          {/* Form Upload Dokumen Global */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Unggah Dokumen Global Baru</h3>
                <p className="text-xs text-slate-500">Berkas ini dapat diakses dan diunduh oleh seluruh peserta (mis. Rundown, Petunjuk Teknis)</p>
              </div>
            </div>

            <form onSubmit={handleUploadGlobal} className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Dokumen
                  </label>
                  <input
                    type="text"
                    id="input-judul-dokumen-global"
                    value={judulGlobal}
                    onChange={(e) => setJudulGlobal(e.target.value)}
                    placeholder="Contoh: Buku Panduan Rihlah 2026"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Berkas PDF (Maks. 8 MB)
                  </label>
                  <input
                    type="file"
                    id="file-input-dokumen-global"
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFileGlobal(e.target.files[0]);
                      }
                    }}
                    required
                    className="w-full text-xs text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  id="btn-submit-upload-global"
                  disabled={uploadingGlobal || !fileGlobal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${uploadingGlobal ? 'animate-spin' : ''}`} />
                  <span>{uploadingGlobal ? 'Mengunggah ke Vercel Blob...' : 'Unggah Dokumen Global'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Daftar Dokumen Global */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Daftar Dokumen Global Aktif ({dokumenGlobalList.length})
              </h4>
              <button
                type="button"
                onClick={muatDokumen}
                className="p-1 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                title="Muat ulang daftar"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {dokumenGlobalList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Belum ada dokumen global yang diunggah.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dokumenGlobalList.map((doc) => (
                  <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {doc.judul}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono">{formatUkuranFile(doc.ukuranByte)}</span>
                          <span>•</span>
                          <span>Oleh: {doc.diunggahOleh || 'Panitia'}</span>
                          <span>•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <a
                        href={doc.blobDownloadUrl || doc.blobUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleHapusDokumen(doc)}
                        disabled={deletingId === doc.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                        title="Hapus dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SEKSI B: DOKUMEN PERSONAL (BULK UPLOAD) ────────────────────────── */}
      {activeSection === 'personal' && (
        <div className="space-y-5">
          {/* Form Bulk Upload Dokumen Personal */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Unggah Massal Dokumen Personal (Bulk Upload)</h3>
                <p className="text-xs text-slate-500">
                  Sistem otomatis mencocokkan nama berkas ke ID Peserta (Contoh: <code className="font-mono bg-slate-100 px-1 rounded">PASK-0001.pdf</code> akan ditautkan ke peserta dengan ID <code className="font-mono bg-slate-100 px-1 rounded">PASK-0001</code>)
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Satu atau Banyak Berkas PDF
                </label>
                <input
                  type="file"
                  id="file-input-dokumen-personal-bulk"
                  multiple
                  accept="application/pdf"
                  onChange={handleSelectPersonalFiles}
                  disabled={uploadingPersonal}
                  className="w-full text-xs text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              {filesPersonal.length > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-600">
                    Terpilih: <span className="font-bold text-slate-900">{filesPersonal.length} berkas PDF</span>
                  </span>
                  <button
                    type="button"
                    id="btn-mulai-upload-bulk-personal"
                    onClick={handleProsesBulkPersonal}
                    disabled={uploadingPersonal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud className={`w-3.5 h-3.5 ${uploadingPersonal ? 'animate-spin' : ''}`} />
                    <span>{uploadingPersonal ? 'Memproses Berkas...' : `Mulai Unggah ${filesPersonal.length} Dokumen`}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tabel Ringkasan Antrean Upload */}
            {uploadQueue.length > 0 && (
              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-50 px-3.5 py-2 font-bold text-slate-700 border-b border-slate-200">
                  Ringkasan Pemrosesan Berkas
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {uploadQueue.map((item, idx) => (
                    <div key={idx} className="px-3.5 py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-slate-700 truncate">{item.fileName}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold shrink-0">
                          ID: {item.idPeserta}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.status === 'pending' && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Antre
                          </span>
                        )}
                        {item.status === 'uploading' && (
                          <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Mengunggah...
                          </span>
                        )}
                        {item.status === 'success' && (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-[11px] text-red-600 font-bold flex items-center gap-1" title={item.pesan}>
                            <XCircle className="w-3.5 h-3.5" /> {item.pesan || 'Gagal'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Daftar Dokumen Personal yang Tersimpan */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-3">
            <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Dokumen Personal Tersimpan ({dokumenPersonalList.length})
                </h4>
              </div>

              {/* Filter Search ID Peserta / Judul */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="search-dokumen-personal"
                  value={searchPersonal}
                  onChange={(e) => setSearchPersonal(e.target.value)}
                  placeholder="Cari ID Peserta atau Nama..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            {dokumenPersonalList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">
                  {searchPersonal ? 'Tidak ada dokumen yang cocok dengan pencarian.' : 'Belum ada dokumen personal yang tersimpan.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3.5">ID Peserta</th>
                      <th className="py-2.5 px-3.5">Nama Pemilik</th>
                      <th className="py-2.5 px-3.5">Judul Dokumen</th>
                      <th className="py-2.5 px-3.5">Ukuran</th>
                      <th className="py-2.5 px-3.5">Tanggal</th>
                      <th className="py-2.5 px-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dokumenPersonalList.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            {doc.idPeserta || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-800">
                          <div>{doc.peserta?.namaLengkap || '-'}</div>
                          {doc.peserta?.asalSekolah && (
                            <div className="text-[10px] text-slate-400">{doc.peserta.asalSekolah}</div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 max-w-[220px] truncate" title={doc.judul}>
                          {doc.judul}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-500">
                          {formatUkuranFile(doc.ukuranByte)}
                        </td>
                        <td className="py-3 px-3.5 text-slate-500 text-[11px]">
                          {new Date(doc.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={doc.blobDownloadUrl || doc.blobUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Unduh berkas"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleHapusDokumen(doc)}
                              disabled={deletingId === doc.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                              title="Hapus berkas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
