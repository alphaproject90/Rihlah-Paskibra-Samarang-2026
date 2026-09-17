import React, { useState, useMemo, useEffect } from 'react';
import { PesertaRihlah, StatsRihlah, PesertaPublikItem } from '../types';
import { apiService } from '../services/apiService';
import { Users, CheckCircle2, Clock, Search, Filter, RefreshCw, LogIn } from 'lucide-react';

interface PesertaStatistikViewProps {
  stats: StatsRihlah;
  pesertaList?: PesertaRihlah[];
  onOpenLoginPeserta: () => void;
}

export const PesertaStatistikView: React.FC<PesertaStatistikViewProps> = ({
  stats,
  pesertaList = [],
  onOpenLoginPeserta
}) => {
  // Normalisasi data statistik
  const statsAktif: StatsRihlah = (stats as any)?.data ?? stats ?? {
    total: 0,
    tidakIkut: 0,
    berangkat: 0,
    pulang: 0,
  };

  const [filterSekolah, setFilterSekolah] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchNama, setSearchNama] = useState('');
  const [detailPeserta, setDetailPeserta] = useState<PesertaPublikItem | null>(null);

  // State untuk data publik jika pesertaList kosong (pengunjung publik)
  const [publikData, setPublikData] = useState<PesertaPublikItem[]>([]);
  const [loadingPublik, setLoadingPublik] = useState(false);

  // Muat data publik jika tidak disediakan dari props
  useEffect(() => {
    let mounted = true;
    if (pesertaList.length === 0) {
      setLoadingPublik(true);
      apiService.getPesertaPublik({
        sekolah: filterSekolah || undefined,
        status: filterStatus || undefined
      }).then(res => {
        if (mounted && res.ok) {
          setPublikData(res.data);
        }
        if (mounted) setLoadingPublik(false);
      });
    }
    return () => { mounted = false; };
  }, [pesertaList.length, filterSekolah, filterStatus]);

  // Gabungkan daftar peserta menjadi format PesertaPublikItem yang seragam & aman Non-PII
  const dataPublikBersih: PesertaPublikItem[] = useMemo(() => {
    if (pesertaList.length > 0) {
      return pesertaList.map((p, idx) => ({
        no: idx + 1,
        nama: p.nama || p.namaLengkap || '-',
        unit: p.unit || '-',
        partisipasi: p.partisipasi,
        sudahBerangkat: Boolean(p.waktuBerangkat),
        sudahPulang: Boolean(p.waktuPulang),
      }));
    }
    return publikData;
  }, [pesertaList, publikData]);

  // Daftar sekolah unik
  const daftarSekolahTerpakai = useMemo(() => {
    const setSekolah = new Set<string>();
    dataPublikBersih.forEach((p) => {
      if (p.unit && p.unit.trim() !== '') setSekolah.add(p.unit);
    });
    return Array.from(setSekolah).sort();
  }, [dataPublikBersih]);

  // Filter pencarian nama
  const pesertaTerfilter = useMemo(() => {
    return dataPublikBersih.filter((p) => {
      const matchSekolah = !filterSekolah || p.unit === filterSekolah;
      const matchStatus = !filterStatus || (
        filterStatus === 'ikut' ? p.partisipasi === 'Ikut' :
        filterStatus === 'tidak_ikut' ? p.partisipasi === 'Tidak Ikut' :
        filterStatus === 'berangkat' ? p.sudahBerangkat :
        filterStatus === 'pulang' ? p.sudahPulang : true
      );
      const matchNama = !searchNama || p.nama.toLowerCase().includes(searchNama.toLowerCase());
      return matchSekolah && matchStatus && matchNama;
    });
  }, [dataPublikBersih, filterSekolah, filterStatus, searchNama]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-slate-900">Statistik Publik Peserta</h3>
        <p className="text-xs text-slate-500">Rekapitulasi partisipasi dan kehadiran kegiatan Rihlah 2026</p>
      </div>

      {/* Grid 4 Kartu Statistik */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Peserta Ikut
          </span>
          <span className="text-2xl font-black text-emerald-800 block mt-0.5">
            {statsAktif.total}
          </span>
        </div>
        <div className="bg-rose-50/70 border border-rose-200/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            Tidak Ikut
          </span>
          <span className="text-2xl font-black text-rose-800 block mt-0.5">
            {statsAktif.tidakIkut}
          </span>
        </div>
        <div className="bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
            Check-in Berangkat
          </span>
          <span className="text-2xl font-black text-blue-800 block mt-0.5">
            {statsAktif.berangkat}
          </span>
        </div>
        <div className="bg-indigo-50/70 border border-indigo-200/80 p-3.5 rounded-2xl">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
            Check-in Pulang
          </span>
          <span className="text-2xl font-black text-indigo-800 block mt-0.5">
            {statsAktif.pulang}
          </span>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchNama}
            onChange={(e) => setSearchNama(e.target.value)}
            placeholder="Cari nama peserta publik..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <select
              value={filterSekolah}
              onChange={(e) => setFilterSekolah(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Semua Status</option>
              <option value="ikut">Partisipasi: Ikut</option>
              <option value="tidak_ikut">Partisipasi: Tidak Ikut</option>
              <option value="berangkat">Sudah Berangkat</option>
              <option value="pulang">Sudah Pulang</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Peserta Publik */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {loadingPublik ? (
          <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
            <span>Memuat data peserta publik...</span>
          </div>
        ) : pesertaTerfilter.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-slate-100 p-6">
            Tidak ada data peserta yang sesuai dengan filter.
          </div>
        ) : (
          pesertaTerfilter.map((p, idx) => (
            <div
              key={idx + p.nama}
              onClick={() => setDetailPeserta(p)}
              className="bg-white hover:bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between transition cursor-pointer shadow-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
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
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {p.partisipasi}
                </span>
                {p.partisipasi === 'Ikut' && (
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {p.sudahPulang ? '✓ Sudah Pulang' : p.sudahBerangkat ? '✓ Berangkat' : 'Menunggu'}
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
          <LogIn className="w-4 h-4" />
          <span>Login Peserta untuk Cek Tiket &amp; Unggah Berkas</span>
        </button>
      </div>

      {/* Modal Detail Peserta Publik (Aman Non-PII) */}
      {detailPeserta && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Detail Status Peserta</h4>
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
                  className={`font-bold px-2.5 py-0.5 rounded-full inline-block text-[11px] mt-0.5 ${
                    detailPeserta.partisipasi === 'Ikut'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {detailPeserta.partisipasi}
                </span>
              </div>
              {detailPeserta.partisipasi === 'Ikut' && (
                <div className="border-t border-slate-100 pt-2 space-y-1.5">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Status Kehadiran</span>
                  <div className="flex justify-between text-slate-600">
                    <span>Keberangkatan:</span>
                    <span className="font-semibold">{detailPeserta.sudahBerangkat ? '✅ Tercatat' : '⏳ Belum'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Kepulangan:</span>
                    <span className="font-semibold">{detailPeserta.sudahPulang ? '✅ Tercatat' : '⏳ Belum'}</span>
                  </div>
                </div>
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
