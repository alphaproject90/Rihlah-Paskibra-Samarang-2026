/**
 * AbsenKegiatanView.tsx — Tab Absen Kegiatan Lapangan (Tahap 3)
 * Dapat diakses oleh semua panitia (SUPER_ADMIN dan ADMIN_MOBIL) secara global.
 * Panitia dapat menandai kehadiran peserta di setiap sesi kegiatan rihlah.
 * SUPER_ADMIN memiliki akses tambahan untuk membuat, mengaktifkan/menonaktifkan,
 * dan menghapus sesi kegiatan.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  RefreshCw, 
  Search, 
  Check, 
  X, 
  Calendar, 
  Users, 
  Clock, 
  Power, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { PesertaRihlah } from '../../types';
import { KegiatanRihlah, AbsenKegiatanItem } from './types';

interface AbsenKegiatanViewProps {
  isSuperAdmin?: boolean;
  pesertaList: PesertaRihlah[];
  tampilkanNotif?: (pesan: string, tipe?: 'info' | 'success' | 'error') => void;
}

export const AbsenKegiatanView: React.FC<AbsenKegiatanViewProps> = ({
  isSuperAdmin = false,
  pesertaList,
  tampilkanNotif,
}) => {
  const [daftarKegiatan, setDaftarKegiatan] = useState<KegiatanRihlah[]>([]);
  const [kegiatanTerpilihId, setKegiatanTerpilihId] = useState<string>('');
  const [daftarAbsen, setDaftarAbsen] = useState<AbsenKegiatanItem[]>([]);
  const [loadingKegiatan, setLoadingKegiatan] = useState<boolean>(false);
  const [loadingAbsen, setLoadingAbsen] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form tambah kegiatan (Super Admin)
  const [showModalTambah, setShowModalTambah] = useState<boolean>(false);
  const [namaBaru, setNamaBaru] = useState<string>('');
  const [deskripsiBaru, setDeskripsiBaru] = useState<string>('');
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMobil, setFilterMobil] = useState<string>('SEMUA');
  const [filterStatus, setFilterStatus] = useState<'SEMUA' | 'HADIR' | 'BELUM'>('SEMUA');

  // Muat daftar sesi kegiatan
  const muatKegiatan = useCallback(async (autoSelectFirst = false) => {
    setLoadingKegiatan(true);
    try {
      const res = await apiService.getKegiatan();
      if (res.ok && res.data) {
        setDaftarKegiatan(res.data);
        if (res.data.length > 0) {
          if (autoSelectFirst || !kegiatanTerpilihId) {
            setKegiatanTerpilihId(res.data[0].id);
          }
        } else {
          setKegiatanTerpilihId('');
        }
      } else {
        tampilkanNotif?.(res.message || 'Gagal memuat daftar kegiatan.', 'error');
      }
    } finally {
      setLoadingKegiatan(false);
    }
  }, [kegiatanTerpilihId, tampilkanNotif]);

  // Muat data absensi untuk kegiatan terpilih
  const muatAbsen = useCallback(async (kegiatanId: string) => {
    if (!kegiatanId) {
      setDaftarAbsen([]);
      return;
    }
    setLoadingAbsen(true);
    try {
      const res = await apiService.getAbsenKegiatan(kegiatanId);
      if (res.ok && res.data) {
        setDaftarAbsen(res.data);
      } else {
        tampilkanNotif?.(res.message || 'Gagal memuat data presensi kegiatan.', 'error');
      }
    } finally {
      setLoadingAbsen(false);
    }
  }, [tampilkanNotif]);

  useEffect(() => {
    muatKegiatan(true);
  }, []);

  useEffect(() => {
    if (kegiatanTerpilihId) {
      muatAbsen(kegiatanTerpilihId);
    }
  }, [kegiatanTerpilihId, muatAbsen]);

  // Handle Tambah Kegiatan Baru (SUPER_ADMIN)
  const handleTambahKegiatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBaru.trim()) {
      tampilkanNotif?.('Nama kegiatan wajib diisi.', 'error');
      return;
    }

    setLoadingSubmit(true);
    try {
      const res = await apiService.buatKegiatan(namaBaru.trim(), deskripsiBaru.trim() || undefined);
      if (res.ok && res.data) {
        tampilkanNotif?.(`Sesi kegiatan "${res.data.nama}" berhasil dibuat!`, 'success');
        setNamaBaru('');
        setDeskripsiBaru('');
        setShowModalTambah(false);
        await muatKegiatan();
        setKegiatanTerpilihId(res.data.id);
      } else {
        tampilkanNotif?.(res.message || 'Gagal membuat sesi kegiatan.', 'error');
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Handle Toggle Aktif Kegiatan (SUPER_ADMIN)
  const handleToggleAktif = async (kegiatan: KegiatanRihlah) => {
    try {
      const res = await apiService.toggleStatusKegiatan(kegiatan.id, !kegiatan.aktif);
      if (res.ok) {
        tampilkanNotif?.(
          `Status sesi "${kegiatan.nama}" diubah menjadi ${!kegiatan.aktif ? 'Aktif' : 'Ditutup'}.`,
          'info'
        );
        muatKegiatan();
      } else {
        tampilkanNotif?.(res.message || 'Gagal mengubah status kegiatan.', 'error');
      }
    } catch {
      tampilkanNotif?.('Terjadi kesalahan saat mengubah status kegiatan.', 'error');
    }
  };

  // Handle Hapus Kegiatan (SUPER_ADMIN)
  const handleHapusKegiatan = async (kegiatan: KegiatanRihlah) => {
    if (!window.confirm(`Yakin ingin menghapus sesi kegiatan "${kegiatan.nama}" beserta seluruh data absensinya?`)) {
      return;
    }
    try {
      const res = await apiService.hapusKegiatan(kegiatan.id);
      if (res.ok) {
        tampilkanNotif?.(`Sesi kegiatan "${kegiatan.nama}" berhasil dihapus.`, 'success');
        if (kegiatanTerpilihId === kegiatan.id) {
          setKegiatanTerpilihId('');
        }
        muatKegiatan(true);
      } else {
        tampilkanNotif?.(res.message || 'Gagal menghapus kegiatan.', 'error');
      }
    } catch {
      tampilkanNotif?.('Terjadi kesalahan saat menghapus kegiatan.', 'error');
    }
  };

  // Handle Tandai Hadir
  const handleTandaiHadir = async (idPeserta: string) => {
    if (!kegiatanTerpilihId) return;
    setActionLoadingId(idPeserta);
    try {
      const res = await apiService.tandaiHadirKegiatan(kegiatanTerpilihId, idPeserta);
      if (res.ok && res.data) {
        tampilkanNotif?.('Presensi hadir berhasil dicatat!', 'success');
        // Update state lokal langsung tanpa reload penuh
        setDaftarAbsen((prev) => [res.data as AbsenKegiatanItem, ...prev]);
        setDaftarKegiatan((prev) =>
          prev.map((k) =>
            k.id === kegiatanTerpilihId
              ? { ...k, _count: { absen: (k._count?.absen || 0) + 1 } }
              : k
          )
        );
      } else {
        tampilkanNotif?.(res.message || 'Gagal mencatat presensi.', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Batalkan Hadir
  const handleBatalkanHadir = async (idPeserta: string) => {
    if (!kegiatanTerpilihId) return;
    setActionLoadingId(idPeserta);
    try {
      const res = await apiService.batalkanHadirKegiatan(kegiatanTerpilihId, idPeserta);
      if (res.ok) {
        tampilkanNotif?.('Presensi kehadiran dibatalkan.', 'info');
        setDaftarAbsen((prev) => prev.filter((a) => a.idPeserta !== idPeserta));
        setDaftarKegiatan((prev) =>
          prev.map((k) =>
            k.id === kegiatanTerpilihId
              ? { ...k, _count: { absen: Math.max(0, (k._count?.absen || 0) - 1) } }
              : k
          )
        );
      } else {
        tampilkanNotif?.(res.message || 'Gagal membatalkan presensi.', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Daftar peserta yang berpartisipasi "Ikut"
  const pesertaIkut = useMemo(() => {
    return pesertaList.filter((p) => p.partisipasi === 'Ikut');
  }, [pesertaList]);

  // Map kehadiran peserta untuk kegiatan saat ini: idPeserta -> AbsenKegiatanItem
  const absenMap = useMemo(() => {
    const map = new Map<string, AbsenKegiatanItem>();
    daftarAbsen.forEach((item) => {
      map.set(item.idPeserta, item);
    });
    return map;
  }, [daftarAbsen]);

  // Daftar nama mobil unik untuk filter
  const opsiMobil = useMemo(() => {
    const mobilSet = new Set<string>();
    pesertaIkut.forEach((p) => {
      if (p.mobil && p.mobil.trim()) {
        mobilSet.add(p.mobil.trim());
      }
    });
    return Array.from(mobilSet).sort();
  }, [pesertaIkut]);

  // Filter peserta sesuai search, mobil, dan status hadir
  const pesertaFiltered = useMemo(() => {
    return pesertaIkut.filter((p) => {
      const pid = p.id || p.idPeserta || '';
      const pnama = p.nama || p.namaLengkap || '';

      // Filter search (nama atau ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cocokNama = pnama.toLowerCase().includes(q);
        const cocokId = pid.toLowerCase().includes(q);
        if (!cocokNama && !cocokId) return false;
      }

      // Filter mobil
      if (filterMobil !== 'SEMUA') {
        if (p.mobil !== filterMobil) return false;
      }

      // Filter status
      const isHadir = absenMap.has(pid);
      if (filterStatus === 'HADIR' && !isHadir) return false;
      if (filterStatus === 'BELUM' && isHadir) return false;

      return true;
    });
  }, [pesertaIkut, searchQuery, filterMobil, filterStatus, absenMap]);

  // Kegiatan yang sedang dipilih
  const kegiatanAktif = useMemo(() => {
    return daftarKegiatan.find((k) => k.id === kegiatanTerpilihId);
  }, [daftarKegiatan, kegiatanTerpilihId]);

  // Statistik kehadiran
  const totalPesertaIkut = pesertaIkut.length;
  const totalHadir = daftarAbsen.length;
  const totalBelumHadir = Math.max(0, totalPesertaIkut - totalHadir);
  const persentaseHadir = totalPesertaIkut > 0 ? Math.round((totalHadir / totalPesertaIkut) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-200/60">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Absen Sesi Kegiatan Lapangan
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Global Seluruh Mobil
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Presensi per agenda rihlah di lokasi. Panitia dapat menandai kehadiran tanpa batasan mobil.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              muatKegiatan();
              if (kegiatanTerpilihId) muatAbsen(kegiatanTerpilihId);
            }}
            disabled={loadingKegiatan || loadingAbsen}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingKegiatan || loadingAbsen ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setShowModalTambah(true)}
              id="btn-tambah-kegiatan-modal"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Sesi Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector Sesi Kegiatan (Pills) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>PILIH SESI KEGIATAN:</span>
          {daftarKegiatan.length > 0 && (
            <span className="text-slate-400">{daftarKegiatan.length} sesi terdaftar</span>
          )}
        </div>

        {loadingKegiatan && daftarKegiatan.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
            Memuat daftar kegiatan...
          </div>
        ) : daftarKegiatan.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">Belum ada sesi kegiatan yang dibuat</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isSuperAdmin
                ? 'Klik tombol "Sesi Baru" di atas untuk membuat sesi kegiatan pertama (misal: Apel Pembukaan, Sholat Dzuhur, Games Lapangan).'
                : 'Sesi kegiatan belum ditambahkan oleh Super Admin. Silakan hubungi Super Admin untuk membuat sesi kegiatan.'}
            </p>
            {isSuperAdmin && (
              <button
                onClick={() => setShowModalTambah(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Buat Sesi Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {daftarKegiatan.map((kegiatan) => {
              const isSelected = kegiatan.id === kegiatanTerpilihId;
              const countAbsen = kegiatan._count?.absen ?? 0;

              return (
                <button
                  key={kegiatan.id}
                  onClick={() => setKegiatanTerpilihId(kegiatan.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-transparent shadow-md shadow-red-600/25 ring-1 ring-red-400/40'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50/60 hover:border-rose-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${kegiatan.aktif ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span>{kegiatan.nama}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {countAbsen} hadir
                  </span>
                  {!kegiatan.aktif && (
                    <span className="text-[9px] uppercase px-1 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      Tutup
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Kartu Detail Kegiatan & Metrik Kehadiran */}
      {kegiatanAktif && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{kegiatanAktif.nama}</h2>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    kegiatanAktif.aktif
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {kegiatanAktif.aktif ? 'Sesi Terbuka (Aktif)' : 'Sesi Ditutup'}
                </span>
              </div>
              {kegiatanAktif.deskripsi && (
                <p className="text-xs text-slate-500 mt-0.5">{kegiatanAktif.deskripsi}</p>
              )}
            </div>

            {isSuperAdmin && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => handleToggleAktif(kegiatanAktif)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    kegiatanAktif.aktif
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{kegiatanAktif.aktif ? 'Tutup Sesi' : 'Buka Sesi'}</span>
                </button>

                <button
                  onClick={() => handleHapusKegiatan(kegiatanAktif)}
                  className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  title="Hapus Sesi Kegiatan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-medium text-slate-500">Total Peserta Ikut</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{totalPesertaIkut}</p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-medium text-emerald-700">Sudah Hadir</span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{totalHadir}</p>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
              <span className="text-[11px] font-medium text-amber-700">Belum Hadir</span>
              <p className="text-xl font-black text-amber-700 mt-0.5">{totalBelumHadir}</p>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
              <span className="text-[11px] font-medium text-rose-700">Persentase Kehadiran</span>
              <p className="text-xl font-black text-rose-700 mt-0.5">{persentaseHadir}%</p>
            </div>
          </div>

          {/* Progress Bar Visual */}
          <div className="space-y-1">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${persentaseHadir}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      {kegiatanAktif && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau ID peserta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Mobil */}
            <div className="sm:w-48">
              <select
                value={filterMobil}
                onChange={(e) => setFilterMobil(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition"
              >
                <option value="SEMUA">Semua Mobil ({pesertaIkut.length})</option>
                {opsiMobil.map((mobil) => (
                  <option key={mobil} value={mobil}>
                    {mobil} ({pesertaIkut.filter((p) => p.mobil === mobil).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status Hadir */}
            <div className="sm:w-44">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition"
              >
                <option value="SEMUA">Semua Status</option>
                <option value="HADIR">Hadir Saja ({totalHadir})</option>
                <option value="BELUM">Belum Hadir Saja ({totalBelumHadir})</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              Menampilkan <b className="text-slate-800">{pesertaFiltered.length}</b> dari {pesertaIkut.length} peserta
            </span>
            {(searchQuery || filterMobil !== 'SEMUA' || filterStatus !== 'SEMUA') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterMobil('SEMUA');
                  setFilterStatus('SEMUA');
                }}
                className="text-red-600 hover:underline font-semibold cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabel Peserta & Presensi */}
      {kegiatanAktif && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          {loadingAbsen ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Memuat data presensi...
            </div>
          ) : pesertaFiltered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Tidak ada peserta yang cocok dengan filter pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">ID & Nama Peserta</th>
                    <th className="py-3 px-4">Mobil</th>
                    <th className="py-3 px-4">Status Kehadiran</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pesertaFiltered.map((peserta, idx) => {
                    const idPeserta = peserta.id || peserta.idPeserta || '';
                    const namaLengkap = peserta.nama || peserta.namaLengkap || '';
                    const asalSekolah = peserta.unit || peserta.asalSekolah || '';
                    const absenRecord = absenMap.get(idPeserta);
                    const isHadir = Boolean(absenRecord);
                    const isLoadingThis = actionLoadingId === idPeserta;

                    return (
                      <tr
                        key={idPeserta}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isHadir ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{namaLengkap}</div>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                            <span>{idPeserta}</span>
                            <span>•</span>
                            <span>{asalSekolah}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {peserta.mobil || 'Belum di-assign'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isHadir ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" />
                                Hadir
                              </span>
                              {absenRecord?.waktuAbsen && (
                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(absenRecord.waktuAbsen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                  {absenRecord.dicatatOleh && (
                                    <span>oleh @{absenRecord.dicatatOleh}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              Belum Hadir
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isHadir ? (
                            <button
                              onClick={() => handleBatalkanHadir(idPeserta)}
                              disabled={isLoadingThis || !kegiatanAktif.aktif}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              title={!kegiatanAktif.aktif ? 'Sesi ditutup' : 'Batalkan tanda hadir'}
                            >
                              {isLoadingThis ? 'Memproses...' : 'Batal Hadir'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTandaiHadir(idPeserta)}
                              disabled={isLoadingThis || !kegiatanAktif.aktif}
                              className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 ml-auto cursor-pointer"
                              title={!kegiatanAktif.aktif ? 'Sesi ditutup' : 'Tandai peserta hadir'}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isLoadingThis ? 'Menyimpan...' : 'Hadir'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Kegiatan Baru (SUPER_ADMIN) */}
      {showModalTambah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Tambah Sesi Kegiatan Baru</h3>
              </div>
              <button
                onClick={() => setShowModalTambah(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTambahKegiatan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Apel Pembukaan, Sholat Dzuhur, Games Lapangan"
                  value={namaBaru}
                  onChange={(e) => setNamaBaru(e.target.value)}
                  maxLength={100}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Catatan (Opsional)
                </label>
                <textarea
                  placeholder="Keterangan singkat, waktu, atau lokasi kegiatan..."
                  value={deskripsiBaru}
                  onChange={(e) => setDeskripsiBaru(e.target.value)}
                  maxLength={255}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalTambah(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/25 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {loadingSubmit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Kegiatan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
