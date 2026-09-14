import React, { useState } from 'react';
import { TransaksiKeuangan, Peserta } from '../types';
import { Wallet, TrendingUp, TrendingDown, Plus, Download, X, DollarSign, Calendar, UserCheck } from 'lucide-react';
import { exportToCsv } from '../utils/storage';

interface KeuanganViewProps {
  keuangan: TransaksiKeuangan[];
  peserta: Peserta[];
  onAddTransaksi: (trx: TransaksiKeuangan) => void;
  onDeleteTransaksi: (id: string) => void;
}

export const KeuanganView: React.FC<KeuanganViewProps> = ({
  keuangan,
  peserta,
  onAddTransaksi,
  onDeleteTransaksi
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterTipe, setFilterTipe] = useState<'all' | 'Pemasukan' | 'Pengeluaran'>('all');

  const [formData, setFormData] = useState<Partial<TransaksiKeuangan>>({
    tipe: 'Pemasukan',
    kategori: 'Iuran Peserta',
    uraian: '',
    jumlah: 150000,
    pic: 'Sie Keuangan',
    status: 'Disetujui',
    tanggal: new Date().toISOString().split('T')[0]
  });

  // Financial statistics
  const totalPemasukan = keuangan
    .filter(k => k.tipe === 'Pemasukan' && k.status === 'Disetujui')
    .reduce((acc, k) => acc + k.jumlah, 0);

  const totalPengeluaran = keuangan
    .filter(k => k.tipe === 'Pengeluaran' && k.status === 'Disetujui')
    .reduce((acc, k) => acc + k.jumlah, 0);

  const saldoKas = totalPemasukan - totalPengeluaran;

  // Iuran stats from Peserta table
  const totalTargetIuran = peserta.reduce((acc, p) => acc + p.totalIuran, 0);
  const totalIuranTerkumpul = peserta.reduce((acc, p) => acc + p.jumlahBayar, 0);
  const sisaTunggakan = Math.max(0, totalTargetIuran - totalIuranTerkumpul);

  const filteredKeuangan = keuangan.filter(k => filterTipe === 'all' || k.tipe === filterTipe);

  const handleExport = () => {
    exportToCsv('Laporan_Keuangan_Giat_Rihlah_Paskibar_Samarang.csv', keuangan);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.uraian || !formData.jumlah) return;

    onAddTransaksi({
      id: 'TRX-' + Date.now(),
      tanggal: formData.tanggal || new Date().toISOString().split('T')[0],
      tipe: formData.tipe as any,
      kategori: formData.kategori || 'Iuran Peserta',
      uraian: formData.uraian,
      jumlah: Number(formData.jumlah),
      pic: formData.pic || 'Bendahara',
      status: 'Disetujui'
    });

    setIsModalOpen(false);
    setFormData({
      tipe: 'Pemasukan',
      kategori: 'Iuran Peserta',
      uraian: '',
      jumlah: 100000,
      pic: 'Sie Keuangan',
      status: 'Disetujui',
      tanggal: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Kas & Transparansi Keuangan Rihlah
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Bendahara Paskibar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan iuran peserta rihlah, bantuan donatur, kas internal, serta alokasi sewa armada & logistik
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Tambah Transaksi
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Saldo Kas */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sisa Saldo Kas Rihlah</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            Rp {saldoKas.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Saldo riil yang siap digunakan</p>
        </div>

        {/* Total Pemasukan */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pemasukan</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600">
            Rp {totalPemasukan.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Iuran peserta & donatur PPI/alumni</p>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pengeluaran</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-600">
            Rp {totalPengeluaran.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Armada Elf, Tiket Camping, Konsumsi, P3K</p>
        </div>

      </div>

      {/* Iuran Peserta Progress Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-200">Progres Pengumpulan Iuran Peserta</h3>
            <p className="text-xs text-slate-400">
              Tarif Iuran: Rp 150.000 / Peserta (Mencakup transport elf PP, tenda, kaos rihlah, sertifikat, konsumsi)
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-extrabold text-emerald-400">
              Rp {totalIuranTerkumpul.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-slate-400">
              Target Total: Rp {totalTargetIuran.toLocaleString('id-ID')} (Sisa: Rp {sisaTunggakan.toLocaleString('id-ID')})
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-700 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{
              width: `${totalTargetIuran > 0 ? (totalIuranTerkumpul / totalTargetIuran) * 100 : 0}%`
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'Pemasukan', 'Pengeluaran'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterTipe(type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
              filterTipe === type
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {type === 'all' ? 'Semua Arus Kas' : type}
          </button>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-3">Tipe & Kategori</th>
                <th className="py-3 px-4">Uraian Transaksi</th>
                <th className="py-3 px-3">PIC</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKeuangan.map((k) => {
                const isMasuk = k.tipe === 'Pemasukan';
                return (
                  <tr key={k.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                      {k.tanggal}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isMasuk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {k.tipe}
                      </span>
                      <div className="text-[11px] font-medium text-slate-600 mt-0.5">
                        {k.kategori}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {k.uraian}
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-xs">
                      {k.pic}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-xs sm:text-sm">
                      <span className={isMasuk ? 'text-emerald-600' : 'text-rose-600'}>
                        {isMasuk ? '+' : '-'} Rp {k.jumlah.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteTransaksi(k.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                        title="Hapus transaksi"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="text-sm font-bold">Catat Transaksi Kas Rihlah</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Transaksi</label>
                  <select
                    value={formData.tipe}
                    onChange={(e) => setFormData({ ...formData, tipe: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  >
                    <option value="Pemasukan">Pemasukan (+)</option>
                    <option value="Pengeluaran">Pengeluaran (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                >
                  <option value="Iuran Peserta">Iuran Peserta</option>
                  <option value="Kas Paskibar">Kas Paskibar</option>
                  <option value="Sponsor / Donatur">Sponsor / Donatur Alumni</option>
                  <option value="Transport & Armada">Transport & Armada Elf</option>
                  <option value="Sewa Tenda & Lokasi">Sewa Tenda & Lokasi Kamojang</option>
                  <option value="Konsumsi">Konsumsi & Snack</option>
                  <option value="P3K & Medis">P3K & Medis</option>
                  <option value="Dokumentasi & ID Card">Dokumentasi, Banner & ID Card</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Uraian / Keterangan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembayaran DP armada Elf 2 unit"
                  value={formData.uraian}
                  onChange={(e) => setFormData({ ...formData, uraian: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIC / Penanggung Jawab</label>
                  <input
                    type="text"
                    value={formData.pic}
                    onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
