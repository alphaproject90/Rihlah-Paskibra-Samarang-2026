import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Download, 
  MessageCircle, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Award,
  ArrowUpDown,
  PhoneCall
} from 'lucide-react';
import { Peserta, TingkatPeserta, StatusBayar, StatusPresensi } from '../types';
import { exportToCsv } from '../utils/storage';

interface PesertaViewProps {
  peserta: Peserta[];
  onAddPeserta: () => void;
  onEditPeserta: (p: Peserta) => void;
  onDeletePeserta: (id: string) => void;
  onToggleBayar: (id: string) => void;
  onTogglePresensi: (id: string) => void;
  onViewIdCard: (p: Peserta) => void;
}

export const PesertaView: React.FC<PesertaViewProps> = ({
  peserta,
  onAddPeserta,
  onEditPeserta,
  onDeletePeserta,
  onToggleBayar,
  onTogglePresensi,
  onViewIdCard
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTingkat, setFilterTingkat] = useState<string>('all');
  const [filterBayar, setFilterBayar] = useState<string>('all');
  const [filterPresensi, setFilterPresensi] = useState<string>('all');
  const [filterRegu, setFilterRegu] = useState<string>('all');

  const filteredPeserta = useMemo(() => {
    return peserta.filter((p) => {
      const matchSearch =
        p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.regu.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTingkat = filterTingkat === 'all' || p.tingkat === filterTingkat;
      const matchBayar = filterBayar === 'all' || p.statusBayar === filterBayar;
      const matchPresensi = filterPresensi === 'all' || p.statusPresensi === filterPresensi;
      const matchRegu = filterRegu === 'all' || p.regu === filterRegu;

      return matchSearch && matchTingkat && matchBayar && matchPresensi && matchRegu;
    });
  }, [peserta, searchQuery, filterTingkat, filterBayar, filterPresensi, filterRegu]);

  const handleExportCsv = () => {
    const dataToExport = filteredPeserta.map((p) => ({
      ID: p.id,
      Nama: p.nama,
      Sekolah: p.sekolah,
      Tingkat: p.tingkat,
      Regu: p.regu,
      No_WhatsApp: p.noHp,
      Kontak_Darurat: p.kontakDarurat,
      Gol_Darah: p.golonganDarah,
      Ukuran_Kaos: p.ukuranKaos,
      Riwayat_Medis: p.riwayatMedis,
      Status_Bayar: p.statusBayar,
      Jumlah_Bayar: p.jumlahBayar,
      Status_Presensi: p.statusPresensi,
      Waktu_Presensi: p.waktuPresensi || '',
      Catatan: p.catatan || '',
      Tanggal_Daftar: p.createdAt
    }));
    exportToCsv('Data_Peserta_Giat_Rihlah_Paskibar_Samarang.csv', dataToExport);
  };

  const openWhatsApp = (phone: string, nama: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1);
    }
    const message = encodeURIComponent(
      `Halo Kak ${nama}, kami dari Panitia Giat Rihlah Paskibar Kecamatan Samarang menginfokan persiapan kegiatan di Kamojang.`
    );
    window.open(`https://wa.me/${clean}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Data & Registrasi Peserta Rihlah
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
              {filteredPeserta.length} / {peserta.length} Peserta
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data Capas, Paskibra Inti, Purna, Panitia, dan Pembina se-Kecamatan Samarang
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={onAddPeserta}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            + Tambah Peserta
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama peserta, asal sekolah, ID tiket, atau regu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Tingkat */}
            <select
              value={filterTingkat}
              onChange={(e) => setFilterTingkat(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            >
              <option value="all">Semua Tingkat</option>
              <option value="Capas">Capas</option>
              <option value="Paskibra Inti">Paskibra Inti</option>
              <option value="Purna">Purna</option>
              <option value="Panitia">Panitia</option>
              <option value="Pembina">Pembina</option>
            </select>

            {/* Status Bayar */}
            <select
              value={filterBayar}
              onChange={(e) => setFilterBayar(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            >
              <option value="all">Semua Iuran</option>
              <option value="Lunas">Lunas</option>
              <option value="Cicil">Cicil</option>
              <option value="Belum Lunas">Belum Lunas</option>
            </select>

            {/* Presensi */}
            <select
              value={filterPresensi}
              onChange={(e) => setFilterPresensi(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            >
              <option value="all">Semua Presensi</option>
              <option value="Hadir">Hadir</option>
              <option value="Belum Hadir">Belum Hadir</option>
              <option value="Izin">Izin / Sakit</option>
            </select>

            {/* Regu */}
            <select
              value={filterRegu}
              onChange={(e) => setFilterRegu(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            >
              <option value="all">Semua Regu</option>
              <option value="Regu Garuda">Regu Garuda</option>
              <option value="Regu Rajawali">Regu Rajawali</option>
              <option value="Regu Komodo">Regu Komodo</option>
              <option value="Regu Elang">Regu Elang</option>
              <option value="Regu Badak">Regu Badak</option>
              <option value="Regu Cendrawasih">Regu Cendrawasih</option>
            </select>

          </div>

        </div>
      </div>

      {/* Participants Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">ID & Nama Peserta</th>
                <th className="py-3 px-3">Asal Sekolah & Tingkat</th>
                <th className="py-3 px-3">Regu & Kaos</th>
                <th className="py-3 px-3">Kontak & Darurat</th>
                <th className="py-3 px-3">Status Iuran</th>
                <th className="py-3 px-3">Presensi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPeserta.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Tidak ada data peserta yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredPeserta.map((p) => {
                  const isLunas = p.statusBayar === 'Lunas';
                  const isHadir = p.statusPresensi === 'Hadir';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* ID & Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.nama}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                            {p.id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Gol: {p.golonganDarah}
                          </span>
                        </div>
                        {p.riwayatMedis && p.riwayatMedis !== 'Tidak ada' && (
                          <div className="mt-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block font-medium">
                            ⚠️ Medis: {p.riwayatMedis}
                          </div>
                        )}
                      </td>

                      {/* School & Level */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{p.sekolah}</div>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.tingkat === 'Capas' ? 'bg-amber-100 text-amber-800' :
                          p.tingkat === 'Paskibra Inti' ? 'bg-blue-100 text-blue-800' :
                          p.tingkat === 'Panitia' ? 'bg-rose-100 text-rose-800' :
                          p.tingkat === 'Purna' ? 'bg-purple-100 text-purple-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.tingkat}
                        </span>
                      </td>

                      {/* Regu & Shirt Size */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{p.regu}</div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Size: {p.ukuranKaos}
                        </span>
                      </td>

                      {/* Contact & WhatsApp */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-slate-700 text-xs">{p.noHp || '-'}</span>
                          {p.noHp && (
                            <button
                              title="Chat WhatsApp"
                              onClick={() => openWhatsApp(p.noHp, p.nama)}
                              className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={p.kontakDarurat}>
                          Darurat: {p.kontakDarurat}
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onToggleBayar(p.id)}
                          title="Klik untuk ubah status pembayaran"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            isLunas 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : p.statusBayar === 'Cicil'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          <CreditCard className="w-3 h-3" />
                          {p.statusBayar}
                        </button>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Rp {p.jumlahBayar.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Attendance Status */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onTogglePresensi(p.id)}
                          title="Klik untuk ubah status presensi"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            isHadir 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                              : p.statusPresensi === 'Izin'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {p.statusPresensi}
                        </button>
                        {p.waktuPresensi && (
                          <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {p.waktuPresensi.split(' ')[1] || p.waktuPresensi}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Lihat & Cetak E-Badge ID Card"
                            onClick={() => onViewIdCard(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit Data Peserta"
                            onClick={() => onEditPeserta(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            title="Hapus Peserta"
                            onClick={() => onDeletePeserta(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
