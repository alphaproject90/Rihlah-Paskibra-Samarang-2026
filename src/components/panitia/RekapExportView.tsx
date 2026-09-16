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
  ChevronDown
} from 'lucide-react';
import { PesertaRihlah } from '../../types';
import { exportToCsv } from '../../utils/storage';

export type FilterPresensiType = 'semua' | 'belum-hadir' | 'sudah-berangkat' | 'sudah-pulang' | 'tidak-ikut';

export function getStatusPresensi(peserta: PesertaRihlah): 'Tidak Ikut' | 'Belum Hadir' | 'Sudah Berangkat' | 'Sudah Pulang' {
  // Guard pertama: jika konfirmasi Tidak Ikut
  if (peserta.partisipasi === 'Tidak Ikut') {
    return 'Tidak Ikut';
  }

  // Khusus peserta dengan partisipasi 'Ikut'
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

interface RekapExportViewProps {
  pesertaList: PesertaRihlah[];
  onRefreshPeserta: () => void | Promise<void>;
  tampilkanNotif?: (pesan: string, tipe?: 'info' | 'success' | 'error') => void;
}

export const RekapExportView: React.FC<RekapExportViewProps> = ({
  pesertaList,
  onRefreshPeserta,
  tampilkanNotif
}) => {
  // Filter & Search states
  const [keyword, setKeyword] = useState('');
  const [filterSekolah, setFilterSekolah] = useState<string>('semua');
  const [filterPartisipasi, setFilterPartisipasi] = useState<'semua' | 'Ikut' | 'Tidak Ikut'>('semua');
  const [filterPresensi, setFilterPresensi] = useState<FilterPresensiType>('semua');

  // Waktu pembaruan data & status refreshing
  const [waktuUpdate, setWaktuUpdate] = useState<string>(() => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Auto-refresh 30 detik dengan cleanup interval saat unmount
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        await onRefreshPeserta();
        setWaktuUpdate(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('Auto-refresh peserta gagal:', err);
      }
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
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
    } catch (err) {
      if (tampilkanNotif) {
        tampilkanNotif('Gagal memperbarui data peserta.', 'error');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshPeserta, tampilkanNotif]);

  // Daftar unik sekolah/unit untuk opsi filter
  const daftarSekolah = useMemo(() => {
    const units = pesertaList
      .map(p => p.unit?.trim())
      .filter((u): u is string => Boolean(u));
    return Array.from(new Set(units)).sort();
  }, [pesertaList]);

  // Logika Filter Data
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
        return p.partisipasi === 'Tidak Ikut';
      }
      if (filterPresensi === 'belum-hadir') {
        return p.partisipasi === 'Ikut' && !p.waktuBerangkat;
      }
      if (filterPresensi === 'sudah-berangkat') {
        return p.partisipasi === 'Ikut' && Boolean(p.waktuBerangkat) && !p.waktuPulang;
      }
      if (filterPresensi === 'sudah-pulang') {
        return p.partisipasi === 'Ikut' && Boolean(p.waktuPulang);
      }

      return true;
    });
  }, [pesertaList, keyword, filterSekolah, filterPartisipasi, filterPresensi]);

  // Export CSV Baku 13 Kolom
  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      if (tampilkanNotif) {
        tampilkanNotif('Tidak ada data yang cocok dengan filter saat ini untuk diekspor.', 'error');
      }
      return;
    }

    const dataToExport = filteredData; // selalu ikut apa yang tampil di layar, tanpa fallback diam-diam

    const rows = dataToExport.map(p => ({
      'ID Peserta': p.id || '',
      'Nama Lengkap': p.nama || p.namaLengkap || '',
      'Jenis Kelamin': p.jk || '',
      'Asal Sekolah': p.unit || '',
      'Partisipasi': p.partisipasi || '',
      'Alasan Tidak Ikut': p.alasan || '-',
      'WA Pribadi': p.waPeserta || '',
      'WA Darurat': p.waDarurat || '',
      'Riwayat Medis': p.medis || '-',
      'Waktu Berangkat': formatWaktuPresensi(p.waktuBerangkat),
      'Waktu Pulang': formatWaktuPresensi(p.waktuPulang),
      'Username': p.username || '',
      'Status Password': p.statusPassword || '-'
    }));

    const tanggalStr = new Date().toISOString().slice(0, 10);
    exportToCsv(`Data_Peserta_Rihlah_2026_${tanggalStr}.csv`, rows);

    if (tampilkanNotif) {
      tampilkanNotif(`Berhasil mengekspor ${rows.length} data peserta ke format CSV!`, 'success');
    }
  };

  const resetSemuaFilter = () => {
    setKeyword('');
    setFilterSekolah('semua');
    setFilterPartisipasi('semua');
    setFilterPresensi('semua');
  };

  const adaFilterAktif = keyword.trim() !== '' || filterSekolah !== 'semua' || filterPartisipasi !== 'semua' || filterPresensi !== 'semua';

  return (
    <div className="space-y-5">
      {/* Top Action & Summary Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Rekapitulasi &amp; Ekspor Data Peserta
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
              {filteredData.length} / {pesertaList.length} Peserta
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-sync 30s
            </span>
            <span>•</span>
            <span id="label-waktu-update" className="text-slate-600 font-medium">
              Diperbarui pukul {waktuUpdate}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Tombol Perbarui Data Peserta */}
          <button
            type="button"
            id="btn-refresh-peserta-table"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition disabled:opacity-50 cursor-pointer border border-slate-200"
            title="Muat ulang seluruh data peserta dari server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600' : 'text-slate-600'}`} />
            <span>{isRefreshing ? 'Memuat Data...' : 'Perbarui Data Peserta'}</span>
          </button>

          {/* Tombol Export CSV 13 Kolom */}
          <button
            type="button"
            id="btn-export-csv-peserta"
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs transition cursor-pointer"
            title="Unduh data dalam format CSV UTF-8 BOM kompatibel Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV ({filteredData.length})</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-red-600" />
            Penyaringan Data
          </div>
          {adaFilterAktif && (
            <button
              type="button"
              onClick={resetSemuaFilter}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Keyword Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="rekap-search-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari nama, ID, WA, akun..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Filter Asal Sekolah */}
          <div className="relative">
            <select
              id="rekap-filter-sekolah"
              value={filterSekolah}
              onChange={(e) => setFilterSekolah(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none appearance-none cursor-pointer pr-8"
            >
              <option value="semua">Semua Asal Sekolah ({daftarSekolah.length})</option>
              {daftarSekolah.map((sekolah) => (
                <option key={sekolah} value={sekolah}>
                  {sekolah}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 3. Filter Partisipasi */}
          <div className="relative">
            <select
              id="rekap-filter-partisipasi"
              value={filterPartisipasi}
              onChange={(e) => setFilterPartisipasi(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none appearance-none cursor-pointer pr-8"
            >
              <option value="semua">Status Partisipasi: Semua</option>
              <option value="Ikut">Konfirmasi Ikut</option>
              <option value="Tidak Ikut">Konfirmasi Tidak Ikut</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 4. Filter Presensi (Logika Eksplisit) */}
          <div className="relative">
            <select
              id="rekap-filter-presensi"
              value={filterPresensi}
              onChange={(e) => setFilterPresensi(e.target.value as FilterPresensiType)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none appearance-none cursor-pointer pr-8"
            >
              <option value="semua">Status Presensi: Semua</option>
              <option value="belum-hadir">Belum Hadir (Ikut, Belum Scan)</option>
              <option value="sudah-berangkat">Sudah Berangkat (Scan Pagi)</option>
              <option value="sudah-pulang">Sudah Pulang (Scan Akhir)</option>
              <option value="tidak-ikut">Tidak Ikut Kegiatan</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tabel Data Peserta */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              Tidak ada data peserta yang cocok
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {adaFilterAktif 
                ? 'Silakan ubah kriteria pencarian atau setel ulang filter untuk melihat seluruh peserta.' 
                : 'Belum ada data peserta yang tersimpan dalam sistem.'}
            </p>
            {adaFilterAktif && (
              <button
                type="button"
                onClick={resetSemuaFilter}
                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5 text-center w-12">No</th>
                  <th className="py-3 px-3.5">Peserta</th>
                  <th className="py-3 px-3.5">Asal Unit / Sekolah</th>
                  <th className="py-3 px-3.5 text-center">Partisipasi</th>
                  <th className="py-3 px-3.5 text-center">Status Presensi</th>
                  <th className="py-3 px-3.5">Waktu Presensi</th>
                  <th className="py-3 px-3.5">Kontak WA</th>
                  <th className="py-3 px-3.5">Keterangan / Medis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((p, idx) => {
                  const statusPresensi = getStatusPresensi(p);
                  const namaLengkap = p.nama || p.namaLengkap || '-';
                  const waBersih = p.waPeserta ? p.waPeserta.replace(/[^0-9]/g, '') : '';
                  const waLink = waBersih.startsWith('0') 
                    ? `https://wa.me/62${waBersih.substring(1)}`
                    : waBersih.startsWith('62') 
                      ? `https://wa.me/${waBersih}` 
                      : '';

                  return (
                    <tr 
                      key={p.id || idx} 
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-3.5 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* Info Peserta */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 leading-tight">
                          {namaLengkap}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-semibold">
                            {p.id}
                          </span>
                          <span>•</span>
                          <span>{p.jk || '-'}</span>
                          {p.username && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">@{p.username}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Asal Sekolah */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-800">
                          {p.unit || '-'}
                        </div>
                      </td>

                      {/* Partisipasi */}
                      <td className="py-3 px-3.5 text-center">
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

                      {/* Status Presensi (Eksplisit) */}
                      <td className="py-3 px-3.5 text-center">
                        {statusPresensi === 'Sudah Pulang' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Sudah Pulang
                          </span>
                        )}
                        {statusPresensi === 'Sudah Berangkat' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Sudah Berangkat
                          </span>
                        )}
                        {statusPresensi === 'Belum Hadir' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Belum Hadir
                          </span>
                        )}
                        {statusPresensi === 'Tidak Ikut' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-slate-400">
                            -
                          </span>
                        )}
                      </td>

                      {/* Waktu Presensi */}
                      <td className="py-3 px-3.5 text-[11px]">
                        {p.partisipasi === 'Tidak Ikut' ? (
                          <span className="text-slate-400 italic">Konfirmasi Absen</span>
                        ) : (
                          <div className="space-y-0.5 text-slate-600">
                            <div>
                              <span className="text-slate-400">Berangkat: </span>
                              <span className="font-semibold text-slate-800">
                                {formatWaktuPresensi(p.waktuBerangkat)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Pulang: </span>
                              <span className="font-semibold text-slate-800">
                                {formatWaktuPresensi(p.waktuPulang)}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Kontak WA */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700">
                            {p.waPeserta || '-'}
                          </span>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                              title="Buka WhatsApp Peserta"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {p.waDarurat && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Darurat: {p.waDarurat}
                          </div>
                        )}
                      </td>

                      {/* Keterangan / Medis */}
                      <td className="py-3 px-3.5 max-w-[200px] truncate text-slate-600" title={p.alasan || p.medis || '-'}>
                        {p.partisipasi === 'Tidak Ikut' ? (
                          <span className="text-slate-500 italic">
                            Alasan: {p.alasan || '-'}
                          </span>
                        ) : (
                          <span>
                            {p.medis ? `Medis: ${p.medis}` : '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Stats */}
        <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{filteredData.length}</span> dari total <span className="font-bold text-slate-800">{pesertaList.length}</span> peserta
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Berangkat: {pesertaList.filter(p => p.partisipasi === 'Ikut' && p.waktuBerangkat).length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Pulang: {pesertaList.filter(p => p.partisipasi === 'Ikut' && p.waktuPulang).length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Tidak Ikut: {pesertaList.filter(p => p.partisipasi === 'Tidak Ikut').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
