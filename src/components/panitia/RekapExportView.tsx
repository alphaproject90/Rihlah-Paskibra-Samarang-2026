import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle2, 
  Phone, 
  ShieldCheck, 
  AlertCircle,
  X,
  SlidersHorizontal,
  ChevronDown,
  FileText,
  Edit,
  Trash2,
  MessageSquare,
  Send,
  Car,
  FileSpreadsheet,
  Printer,
  Check
} from 'lucide-react';
import { PesertaRihlah } from '../../types';
import { exportToCsv } from '../../utils/storage';
import { apiService } from '../../services/apiService';

export type FilterPresensiType = 'semua' | 'belum-hadir' | 'sudah-berangkat' | 'sudah-pulang' | 'tidak-ikut';

export function getStatusPresensi(peserta: PesertaRihlah): 'Tidak Ikut' | 'Belum Hadir' | 'Sudah Berangkat' | 'Sudah Pulang' {
  if (peserta.partisipasi === 'Tidak Ikut') {
    return 'Tidak Ikut';
  }
  if (peserta.waktuPulang) {
    return 'Sudah Pulang';
  }
  if (peserta.waktuBerangkat) {
    return 'Sudah Berangkat';
  }
  return 'Belum Hadir';
}

export function formatWaktuPresensi(waktu?: string): string {
  if (!waktu) return '-';
  try {
    const d = new Date(waktu);
    if (isNaN(d.getTime())) return waktu;
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return waktu;
  }
}

// Format nomor telepon ke format internasional standar WhatsApp (628...)
export function formatNomorWa(no?: string): string {
  if (!no) return '';
  const clean = no.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    return `62${clean.substring(1)}`;
  }
  if (clean.startsWith('62')) {
    return clean;
  }
  return clean;
}

interface RekapExportViewProps {
  pesertaList: PesertaRihlah[];
  onRefreshPeserta: () => void | Promise<void>;
  tampilkanNotif?: (pesan: string, tipe?: 'info' | 'success' | 'error') => void;
  isSuperAdmin?: boolean;
}

export const RekapExportView: React.FC<RekapExportViewProps> = ({
  pesertaList,
  onRefreshPeserta,
  tampilkanNotif,
  isSuperAdmin = true,
}) => {
  // Sub-Tab: Rekap Data vs Export
  const [subTab, setSubTab] = useState<'rekap' | 'export'>('rekap');

  // Filter & Search states
  const [keyword, setKeyword] = useState('');
  const [filterSekolah, setFilterSekolah] = useState<string>('semua');
  const [filterPartisipasi, setFilterPartisipasi] = useState<'semua' | 'Ikut' | 'Tidak Ikut'>('semua');
  const [filterPresensi, setFilterPresensi] = useState<FilterPresensiType>('semua');
  const [filterMobil, setFilterMobil] = useState<string>('semua');

  // Modal Edit State
  const [pesertaEdit, setPesertaEdit] = useState<PesertaRihlah | null>(null);
  const [editForm, setEditForm] = useState<{
    namaLengkap: string;
    jenisKelamin: string;
    asalSekolah: string;
    partisipasi: 'Ikut' | 'Tidak Ikut';
    alasanTidakIkut: string;
    waPribadi: string;
    waDarurat: string;
    riwayatMedis: string;
    mobil: string;
  }>({
    namaLengkap: '',
    jenisKelamin: 'Laki-laki',
    asalSekolah: '',
    partisipasi: 'Ikut',
    alasanTidakIkut: '',
    waPribadi: '',
    waDarurat: '',
    riwayatMedis: '',
    mobil: '',
  });
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Modal Hapus (Soft Delete) State
  const [pesertaHapus, setPesertaHapus] = useState<PesertaRihlah | null>(null);
  const [loadingHapus, setLoadingHapus] = useState(false);

  // Modal Kirim WhatsApp State
  const [pesertaWa, setPesertaWa] = useState<PesertaRihlah | null>(null);
  const [tipePesanWa, setTipePesanWa] = useState<'konfirmasi' | 'status' | 'surat_ortu' | 'custom'>('konfirmasi');
  const [customPesanWa, setCustomPesanWa] = useState('');

  // Waktu pembaruan data & status refreshing
  const [waktuUpdate, setWaktuUpdate] = useState<string>(() => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Auto-refresh 30 detik
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        await onRefreshPeserta();
        setWaktuUpdate(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('Auto-refresh peserta gagal:', err);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [onRefreshPeserta]);

  // Handler Refresh Manual
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefreshPeserta();
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setWaktuUpdate(now);
      if (tampilkanNotif) {
        tampilkanNotif('Data peserta berhasil disinkronkan!', 'success');
      }
    } catch {
      if (tampilkanNotif) {
        tampilkanNotif('Gagal memperbarui data peserta.', 'error');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshPeserta, tampilkanNotif]);

  // Daftar unik sekolah/unit untuk filter
  const daftarSekolah = useMemo(() => {
    const units = pesertaList
      .map(p => p.unit?.trim())
      .filter((u): u is string => Boolean(u));
    return Array.from(new Set(units)).sort();
  }, [pesertaList]);

  // Daftar unik mobil untuk filter
  const daftarMobil = useMemo(() => {
    const mobils = pesertaList
      .map(p => p.mobil?.trim())
      .filter((m): m is string => Boolean(m));
    return Array.from(new Set(mobils)).sort();
  }, [pesertaList]);

  // Logika Filter Data (Pencarian & Multi-Filter)
  const filteredData = useMemo(() => {
    return pesertaList.filter(p => {
      // 1. Keyword search (nama, ID, wa, username, unit)
      if (keyword.trim()) {
        const q = keyword.toLowerCase().trim();
        const nama = (p.nama || p.namaLengkap || '').toLowerCase();
        const id = (p.id || '').toLowerCase();
        const wa = (p.waPeserta || '').toLowerCase();
        const username = (p.username || '').toLowerCase();
        const unit = (p.unit || '').toLowerCase();
        if (!nama.includes(q) && !id.includes(q) && !wa.includes(q) && !username.includes(q) && !unit.includes(q)) {
          return false;
        }
      }

      // 2. Filter Asal Sekolah
      if (filterSekolah !== 'semua' && p.unit !== filterSekolah) {
        return false;
      }

      // 3. Filter Partisipasi
      if (filterPartisipasi !== 'semua' && p.partisipasi !== filterPartisipasi) {
        return false;
      }

      // 4. Filter Presensi Eksplisit
      if (filterPresensi === 'tidak-ikut') {
        if (p.partisipasi !== 'Tidak Ikut') return false;
      }
      if (filterPresensi === 'belum-hadir') {
        if (p.partisipasi !== 'Ikut' || Boolean(p.waktuBerangkat)) return false;
      }
      if (filterPresensi === 'sudah-berangkat') {
        if (p.partisipasi !== 'Ikut' || !p.waktuBerangkat || Boolean(p.waktuPulang)) return false;
      }
      if (filterPresensi === 'sudah-pulang') {
        if (p.partisipasi !== 'Ikut' || !p.waktuPulang) return false;
      }

      // 5. Filter Mobil
      if (filterMobil !== 'semua') {
        if (filterMobil === 'tanpa-mobil') {
          if (p.mobil) return false;
        } else if (p.mobil !== filterMobil) {
          return false;
        }
      }

      return true;
    });
  }, [pesertaList, keyword, filterSekolah, filterPartisipasi, filterPresensi, filterMobil]);

  // Export CSV Baku 14 Kolom
  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      if (tampilkanNotif) {
        tampilkanNotif('Tidak ada data yang cocok dengan filter saat ini untuk diekspor.', 'error');
      }
      return;
    }

    const rows = filteredData.map(p => ({
      'ID Peserta': p.id || '',
      'Nama Lengkap': p.nama || p.namaLengkap || '',
      'Jenis Kelamin': p.jk || '',
      'Asal Sekolah': p.unit || '',
      'Alokasi Mobil': p.mobil || 'Belum Ditentukan',
      'Partisipasi': p.partisipasi || '',
      'Alasan Tidak Ikut': p.alasan || '-',
      'WA Pribadi': p.waPeserta || '',
      'WA Darurat': p.waDarurat || '',
      'Riwayat Medis': p.medis || '-',
      'Surat Pernyataan Ortu': p.hasSuratOrtu ? 'Sudah Upload' : 'Belum Upload',
      'Waktu Berangkat': formatWaktuPresensi(p.waktuBerangkat),
      'Waktu Pulang': formatWaktuPresensi(p.waktuPulang),
      'Username': p.username || '',
    }));

    const tanggalStr = new Date().toISOString().slice(0, 10);
    exportToCsv(`Data_Peserta_Rihlah_2026_${tanggalStr}.csv`, rows);

    if (tampilkanNotif) {
      tampilkanNotif(`Berhasil mengekspor ${rows.length} data peserta ke format CSV!`, 'success');
    }
  };

  // Handler Buka Modal Edit
  const handleBukaEdit = (p: PesertaRihlah) => {
    setPesertaEdit(p);
    setEditForm({
      namaLengkap: p.nama || p.namaLengkap || '',
      jenisKelamin: p.jk || 'Laki-laki',
      asalSekolah: p.unit || '',
      partisipasi: p.partisipasi || 'Ikut',
      alasanTidakIkut: p.alasan || '',
      waPribadi: p.waPeserta || '',
      waDarurat: p.waDarurat || '',
      riwayatMedis: p.medis || '',
      mobil: p.mobil || '',
    });
  };

  // Handler Simpan Edit
  const handleSimpanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesertaEdit) return;

    setLoadingEdit(true);
    try {
      const res = await apiService.editPeserta(pesertaEdit.id, {
        namaLengkap: editForm.namaLengkap,
        jenisKelamin: editForm.jenisKelamin as any,
        asalSekolah: editForm.asalSekolah,
        partisipasi: editForm.partisipasi,
        alasan: editForm.alasanTidakIkut,
        waPeserta: editForm.waPribadi,
        waDarurat: editForm.waDarurat,
        medis: editForm.riwayatMedis,
        mobil: editForm.mobil ? editForm.mobil.trim() : null,
      });

      if (res.ok) {
        if (tampilkanNotif) tampilkanNotif('Data peserta berhasil diperbarui!', 'success');
        setPesertaEdit(null);
        await onRefreshPeserta();
      } else {
        if (tampilkanNotif) tampilkanNotif(res.message || 'Gagal memperbarui data.', 'error');
      }
    } catch {
      if (tampilkanNotif) tampilkanNotif('Terjadi kesalahan koneksi.', 'error');
    } finally {
      setLoadingEdit(false);
    }
  };

  // Handler Konfirmasi Hapus (Soft Delete)
  const handleKonfirmasiHapus = async () => {
    if (!pesertaHapus) return;

    setLoadingHapus(true);
    try {
      const res = await apiService.hapusPeserta(pesertaHapus.id);
      if (res.ok) {
        if (tampilkanNotif) tampilkanNotif(res.message || 'Peserta berhasil dihapus (soft delete).', 'success');
        setPesertaHapus(null);
        await onRefreshPeserta();
      } else {
        if (tampilkanNotif) tampilkanNotif(res.message || 'Gagal menghapus peserta.', 'error');
      }
    } catch {
      if (tampilkanNotif) tampilkanNotif('Terjadi kesalahan saat menghapus.', 'error');
    } finally {
      setLoadingHapus(false);
    }
  };

  // Handler Generator Pesan WhatsApp
  const generatePesanWa = (p: PesertaRihlah, tipe: string): string => {
    const nama = p.nama || p.namaLengkap || 'Peserta';
    const status = getStatusPresensi(p);
    const mobil = p.mobil || 'Belum Ditentukan';

    switch (tipe) {
      case 'konfirmasi':
        return `Halo ${nama},\n\nKami dari Panitia Rihlah Paskibra Samarang 2026 mengonfirmasi bahwa data pendaftaran Anda telah tercatat secara resmi.\n\nNomor ID: ${p.id}\nUnit/Sekolah: ${p.unit}\nAlokasi Mobil: ${mobil}\nStatus Partisipasi: ${p.partisipasi}\n\nHarap simpan tiket QR Anda di dasbor dan patuhi tata tertib. Terima kasih!`;
      case 'status':
        return `Halo ${nama}/Keluarga,\n\nInformasi terkini kegiatan Rihlah Paskibra Samarang 2026:\nNama: ${nama} (${p.id})\nStatus Presensi: ${status}\nWaktu Berangkat: ${formatWaktuPresensi(p.waktuBerangkat)}\nWaktu Pulang: ${formatWaktuPresensi(p.waktuPulang)}\n\nTerima kasih atas kerja samanya.`;
      case 'surat_ortu':
        return `Halo ${nama},\n\nMengingatkan kembali bahwa berkas Surat Pernyataan & Izin Orang Tua Anda untuk kegiatan Rihlah Paskibra Samarang 2026 saat ini tercatat BELUM diunggah.\n\nMohon segera masuk ke Dasbor Peserta di website dan unggah dokumen surat izin orang tua (format PDF/JPG/PNG maks 5MB) sebelum jadwal keberangkatan. Terima kasih!`;
      case 'custom':
        return customPesanWa || `Halo ${nama},\n\n(Tuliskan pesan panitia di sini)`;
      default:
        return `Halo ${nama}, salam dari Panitia Rihlah Paskibra Samarang 2026.`;
    }
  };

  const handleKirimWa = (p: PesertaRihlah) => {
    const rawWa = p.waPeserta || p.waDarurat || '';
    const phone = formatNomorWa(rawWa);
    if (!phone) {
      if (tampilkanNotif) tampilkanNotif('Nomor WhatsApp peserta tidak valid atau belum diisi.', 'error');
      return;
    }
    const text = generatePesanWa(p, tipePesanWa);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setPesertaWa(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Rekap Data &amp; Ekspor Peserta
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Tahap 5 Final
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Pusat manajemen peserta, filter presensi, alokasi mobil, soft delete, dan integrasi WhatsApp
          </p>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('rekap')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'rekap'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Rekap Data
          </button>
          <button
            type="button"
            onClick={() => setSubTab('export')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'export'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Export &amp; Cetak
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: REKAP DATA & TABEL INTERAKTIF                                   */}
      {/* ========================================================================= */}
      {subTab === 'rekap' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filter Bar Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Cari nama, ID, WA, unit..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Refresh Manual */}
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600' : 'text-slate-400'}`} />
                <span>Sinkron</span>
              </button>
            </div>

            {/* Dropdown Filters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
              {/* Filter Sekolah */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Satuan / Unit
                </label>
                <select
                  value={filterSekolah}
                  onChange={(e) => setFilterSekolah(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="semua">Semua Satuan</option>
                  {daftarSekolah.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Filter Partisipasi */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Partisipasi
                </label>
                <select
                  value={filterPartisipasi}
                  onChange={(e) => setFilterPartisipasi(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="semua">Semua Partisipasi</option>
                  <option value="Ikut">Ikut</option>
                  <option value="Tidak Ikut">Tidak Ikut</option>
                </select>
              </div>

              {/* Filter Presensi */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Status Presensi
                </label>
                <select
                  value={filterPresensi}
                  onChange={(e) => setFilterPresensi(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="semua">Semua Presensi</option>
                  <option value="belum-hadir">Belum Hadir</option>
                  <option value="sudah-berangkat">Sudah Berangkat</option>
                  <option value="sudah-pulang">Sudah Pulang</option>
                  <option value="tidak-ikut">Tidak Ikut</option>
                </select>
              </div>

              {/* Filter Mobil */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Alokasi Mobil
                </label>
                <select
                  value={filterMobil}
                  onChange={(e) => setFilterMobil(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="semua">Semua Mobil</option>
                  <option value="tanpa-mobil">Belum Ditentukan</option>
                  {daftarMobil.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredData.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Tidak ada data yang cocok dengan kriteria filter.</p>
                <p className="text-xs">Coba sesuaikan kata kunci atau atur ulang opsi filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3 text-center w-10">No</th>
                      <th className="py-3 px-3">Peserta</th>
                      <th className="py-3 px-3">Satuan &amp; Mobil</th>
                      <th className="py-3 px-3 text-center">Partisipasi</th>
                      <th className="py-3 px-3 text-center">Presensi</th>
                      <th className="py-3 px-3 text-center">Surat Ortu</th>
                      <th className="py-3 px-3">Kontak WA</th>
                      <th className="py-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.map((p, idx) => {
                      const statusPresensi = getStatusPresensi(p);
                      const namaLengkap = p.nama || p.namaLengkap || '-';
                      const rawWa = p.waPeserta || p.waDarurat || '';
                      const phoneClean = formatNomorWa(rawWa);

                      return (
                        <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          {/* No */}
                          <td className="py-3 px-3 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>

                          {/* Info Peserta */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 leading-tight">
                              {namaLengkap}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-semibold">
                                {p.id}
                              </span>
                              <span>•</span>
                              <span>{p.jk || '-'}</span>
                            </div>
                          </td>

                          {/* Unit & Mobil */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">
                              {p.unit || '-'}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
                              <Car className="w-3 h-3 text-slate-400" />
                              <span className={p.mobil ? 'font-bold text-red-600' : 'italic text-slate-400'}>
                                {p.mobil || 'Belum dialokasikan'}
                              </span>
                            </div>
                          </td>

                          {/* Partisipasi */}
                          <td className="py-3 px-3 text-center">
                            {p.partisipasi === 'Ikut' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <UserCheck className="w-3 h-3" />
                                Ikut
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <UserX className="w-3 h-3" />
                                Tidak Ikut
                              </span>
                            )}
                          </td>

                          {/* Status Presensi */}
                          <td className="py-3 px-3 text-center">
                            {statusPresensi === 'Sudah Pulang' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Pulang
                              </span>
                            )}
                            {statusPresensi === 'Sudah Berangkat' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Berangkat
                              </span>
                            )}
                            {statusPresensi === 'Belum Hadir' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                Belum
                              </span>
                            )}
                            {statusPresensi === 'Tidak Ikut' && (
                              <span className="text-slate-400 font-medium">-</span>
                            )}
                          </td>

                          {/* Surat Ortu */}
                          <td className="py-3 px-3 text-center">
                            {p.hasSuratOrtu ? (
                              p.suratOrtuUrl ? (
                                <a
                                  href={p.suratOrtuUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                                  title="Buka Berkas Surat"
                                >
                                  <FileText className="w-3 h-3 text-emerald-600" />
                                  <span>Ada</span>
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <FileText className="w-3 h-3 text-emerald-600" />
                                  <span>Ada</span>
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                ⏳ Belum
                              </span>
                            )}
                          </td>

                          {/* Kontak WA & Tombol Kirim Pesan (Fitur 10) */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-700 text-[11px]">
                                {p.waPeserta || '-'}
                              </span>
                              {phoneClean && (
                                <button
                                  type="button"
                                  onClick={() => setPesertaWa(p)}
                                  className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition cursor-pointer"
                                  title="Kirim pesan WhatsApp terformat"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Kolom Aksi: Edit & Hapus (Khusus Super Admin) */}
                          <td className="py-3 px-3 text-center">
                            {isSuperAdmin ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleBukaEdit(p)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                                  title="Edit data peserta"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPesertaHapus(p)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition cursor-pointer"
                                  title="Hapus peserta (soft delete)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Read-Only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Stats Table */}
            <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Menampilkan <span className="font-bold text-slate-800">{filteredData.length}</span> dari total <span className="font-bold text-slate-800">{pesertaList.length}</span> peserta
              </div>
              <div className="text-[11px] text-slate-400">
                Pembaruan terakhir: {waktuUpdate} WIB
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: EXPORT DATA & CETAK (FITUR 7)                                    */}
      {/* ========================================================================= */}
      {subTab === 'export' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Export CSV */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ekspor Berkas CSV / Excel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Format spreadsheet baku 14 kolom lengkap dengan status surat orang tua
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>Ekspor ini mencakup data peserta sesuai filter aktif saat ini:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-500 text-[11px]">
                  <li>ID Peserta, Nama Lengkap, Jenis Kelamin, Asal Unit</li>
                  <li>Alokasi Mobil, Status Partisipasi, Alasan Jika Tidak Ikut</li>
                  <li>Kontak WA Pribadi, WA Darurat, Riwayat Medis</li>
                  <li>Status Surat Pernyataan Ortu, Waktu Berangkat, Waktu Pulang</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Data CSV ({filteredData.length} Baris)</span>
                </button>
              </div>
            </div>

            {/* Card Ringkasan Statistik Cetak */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cetak Laporan Rekapitulasi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cetak dokumen rekapitulasi data kehadiran peserta
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">Total Peserta Terdaftar:</span>
                  <span className="font-bold text-slate-800">{pesertaList.length}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-emerald-700">Peserta Berpartisipasi (Ikut):</span>
                  <span className="font-bold text-emerald-800">
                    {pesertaList.filter(p => p.partisipasi === 'Ikut').length}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="text-blue-700">Sudah Check-in Berangkat:</span>
                  <span className="font-bold text-blue-800">
                    {pesertaList.filter(p => p.waktuBerangkat).length}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                  <span className="text-purple-700">Sudah Check-in Pulang:</span>
                  <span className="font-bold text-purple-800">
                    {pesertaList.filter(p => p.waktuPulang).length}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Tampilan Ini (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT DATA PESERTA (KHUSUS SUPER ADMIN)                            */}
      {/* ========================================================================= */}
      {pesertaEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Data Peserta</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{pesertaEdit.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPesertaEdit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimpanEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editForm.namaLengkap}
                  onChange={(e) => setEditForm(f => ({ ...f, namaLengkap: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={editForm.jenisKelamin}
                    onChange={(e) => setEditForm(f => ({ ...f, jenisKelamin: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asal Unit / Sekolah</label>
                  <input
                    type="text"
                    required
                    value={editForm.asalSekolah}
                    onChange={(e) => setEditForm(f => ({ ...f, asalSekolah: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Partisipasi</label>
                  <select
                    value={editForm.partisipasi}
                    onChange={(e) => setEditForm(f => ({ ...f, partisipasi: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Ikut">Ikut</option>
                    <option value="Tidak Ikut">Tidak Ikut</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alokasi Mobil</label>
                  <input
                    type="text"
                    value={editForm.mobil}
                    onChange={(e) => setEditForm(f => ({ ...f, mobil: e.target.value }))}
                    placeholder="Contoh: Mobil 1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WA Pribadi</label>
                  <input
                    type="text"
                    value={editForm.waPribadi}
                    onChange={(e) => setEditForm(f => ({ ...f, waPribadi: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WA Darurat</label>
                  <input
                    type="text"
                    value={editForm.waDarurat}
                    onChange={(e) => setEditForm(f => ({ ...f, waDarurat: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Riwayat Medis</label>
                <textarea
                  rows={2}
                  value={editForm.riwayatMedis}
                  onChange={(e) => setEditForm(f => ({ ...f, riwayatMedis: e.target.value }))}
                  placeholder="Riwayat penyakit atau pantangan (jika ada)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPesertaEdit(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingEdit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loadingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KONFIRMASI HAPUS (SOFT DELETE)                                    */}
      {/* ========================================================================= */}
      {pesertaHapus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Peserta?</h3>
                <p className="text-xs text-slate-500">Konfirmasi tindakan soft-delete data</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-2xl text-xs text-rose-800 space-y-1">
              <p className="font-bold">
                {pesertaHapus.nama || pesertaHapus.namaLengkap} ({pesertaHapus.id})
              </p>
              <p className="text-[11px] leading-relaxed text-rose-700">
                Data akan dinonaktifkan dari seluruh rekapitulasi aktif dan statistik publik. Rekaman riwayat scan dan audit trail tetap tersimpan aman di database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPesertaHapus(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleKonfirmasiHapus}
                disabled={loadingHapus}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loadingHapus ? 'Menghapus...' : 'Ya, Hapus Peserta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KIRIM PESAN WHATSAPP (FITUR 10)                                   */}
      {/* ========================================================================= */}
      {pesertaWa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kirim Pesan WhatsApp</h3>
                  <p className="text-xs text-slate-500">
                    {pesertaWa.nama || pesertaWa.namaLengkap} • {formatNomorWa(pesertaWa.waPeserta || pesertaWa.waDarurat)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPesertaWa(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">Pilih Template Pesan:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipePesanWa('konfirmasi')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                    tipePesanWa === 'konfirmasi'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Konfirmasi Data
                </button>
                <button
                  type="button"
                  onClick={() => setTipePesanWa('status')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                    tipePesanWa === 'status'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Status Presensi
                </button>
                <button
                  type="button"
                  onClick={() => setTipePesanWa('surat_ortu')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                    tipePesanWa === 'surat_ortu'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pengingat Surat Ortu
                </button>
                <button
                  type="button"
                  onClick={() => setTipePesanWa('custom')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                    tipePesanWa === 'custom'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tulis Bebas
                </button>
              </div>
            </div>

            {/* Preview Pesan */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700">Isi Pesan (Preview):</label>
              {tipePesanWa === 'custom' ? (
                <textarea
                  rows={4}
                  value={customPesanWa}
                  onChange={(e) => setCustomPesanWa(e.target.value)}
                  placeholder="Ketik pesan Anda di sini..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-sans text-xs"
                />
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                  {generatePesanWa(pesertaWa, tipePesanWa)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPesertaWa(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleKirimWa(pesertaWa)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Buka di WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
