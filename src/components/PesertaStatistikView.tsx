import React, { useState, useMemo } from 'react';
import { PesertaRihlah, StatsRihlah } from '../types';

interface PesertaStatistikViewProps {
  stats: StatsRihlah;
  pesertaList: PesertaRihlah[];
  onOpenLoginPeserta: () => void;
}

export const PesertaStatistikView: React.FC<PesertaStatistikViewProps> = ({
  stats,
  pesertaList,
  onOpenLoginPeserta
}) => {
  const [filterSekolah, setFilterSekolah] = useState('');
  const [searchNama, setSearchNama] = useState('');
  const [detailPeserta, setDetailPeserta] = useState<PesertaRihlah | null>(null);

  // Daftar sekolah yang terpakai di data
  const daftarSekolahTerpakai = useMemo(() => {
    const setSekolah = new Set<string>();
    pesertaList.forEach((p) => {
      if (p.unit && p.unit.trim() !== '') setSekolah.add(p.unit);
    });
    return Array.from(setSekolah).sort();
  }, [pesertaList]);

  // Peserta yang difilter
  const pesertaTerfilter = useMemo(() => {
    return pesertaList.filter((p) => {
      const matchSekolah = !filterSekolah || p.unit === filterSekolah;
      const matchNama = !searchNama || p.nama.toLowerCase().includes(searchNama.toLowerCase());
      return matchSekolah && matchNama;
    });
  }, [pesertaList, filterSekolah, searchNama]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-slate-800">Statistik Peserta</h3>
        <p className="text-xs text-slate-500">Rekap data kehadiran dan partisipasi</p>
      </div>

      {/* Grid 4 Kartu Statistik */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-green-50/70 border border-green-200/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider block">
            Peserta Ikut
          </span>
          <span className="text-2xl font-black text-green-800 block mt-0.5">
            {stats.total}
          </span>
        </div>
        <div className="bg-red-50/70 border border-red-200/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
            Tidak Ikut
          </span>
          <span className="text-2xl font-black text-red-800 block mt-0.5">
            {stats.tidakIkut}
          </span>
        </div>
        <div className="bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
            Check-in Berangkat
          </span>
          <span className="text-2xl font-black text-blue-800 block mt-0.5">
            {stats.berangkat}
          </span>
        </div>
        <div className="bg-purple-50/70 border border-purple-200/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
            Check-in Pulang
          </span>
          <span className="text-2xl font-black text-purple-800 block mt-0.5">
            {stats.pulang}
          </span>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <select
              value={filterSekolah}
              onChange={(e) => setFilterSekolah(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Semua Satuan / Sekolah</option>
              {daftarSekolahTerpakai.map((sek) => (
                <option key={sek} value={sek}>
                  {sek}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="text"
              value={searchNama}
              onChange={(e) => setSearchNama(e.target.value)}
              placeholder="Cari nama peserta..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* List Peserta */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {pesertaTerfilter.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Tidak ada data peserta yang sesuai filter.
          </div>
        ) : (
          pesertaTerfilter.map((p) => (
            <div
              key={p.id + p.nama}
              onClick={() => setDetailPeserta(p)}
              className="bg-white hover:bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between transition cursor-pointer shadow-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                  {p.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 leading-tight">
                    {p.nama}
                  </h5>
                  <p className="text-[10px] text-slate-500">{p.unit}</p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                    p.partisipasi === 'Ikut'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {p.partisipasi}
                </span>
                {p.partisipasi === 'Ikut' && (
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {p.waktuBerangkat ? '✓ Berangkat' : 'Belum hadir'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tombol Login Peserta */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onOpenLoginPeserta}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white p-3.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <span>Login Peserta untuk Cek Data &amp; Tiket Pribadi</span>
        </button>
      </div>

      {/* Modal Detail Peserta (Non-Sensitif) */}
      {detailPeserta && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Detail Peserta</h4>
              <button
                type="button"
                onClick={() => setDetailPeserta(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Nama Lengkap</span>
                <span className="font-bold text-slate-800 text-sm">{detailPeserta.nama}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Asal Satuan / Sekolah</span>
                <span className="text-slate-700 font-semibold">{detailPeserta.unit}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Status Partisipasi</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full inline-block text-[11px] ${
                    detailPeserta.partisipasi === 'Ikut'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {detailPeserta.partisipasi}
                </span>
              </div>
              {detailPeserta.partisipasi === 'Ikut' && (
                <>
                  <div className="border-t border-slate-100 pt-2 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Riwayat Presensi</span>
                    <div className="flex justify-between text-slate-600">
                      <span>Berangkat:</span>
                      <span className="font-semibold">{detailPeserta.waktuBerangkat || 'Belum'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Pulang:</span>
                      <span className="font-semibold">{detailPeserta.waktuPulang || 'Belum'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setDetailPeserta(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
