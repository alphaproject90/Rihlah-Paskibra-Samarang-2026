import React, { useState, useEffect } from 'react';
import { Peserta, TingkatPeserta, StatusBayar, GolonganDarah, UkuranKaos } from '../types';
import { X, UserPlus, Check, Save } from 'lucide-react';

interface PesertaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (peserta: Peserta) => void;
  initialData?: Peserta | null;
  existingCount: number;
}

const SEKOLAH_OPTIONS = [
  'SMAN 1 Samarang',
  'SMKN 1 Garut (Samarang)',
  'MA Nurul Huda Samarang',
  'SMPN 1 Samarang',
  'SMPN 2 Samarang',
  'SMK Patriot Samarang',
  'SMK IT Al-Hasan Samarang',
  'Purna Paskibra Samarang'
];

const REGU_OPTIONS = [
  'Regu Garuda',
  'Regu Rajawali',
  'Regu Komodo',
  'Regu Elang',
  'Regu Badak',
  'Regu Cendrawasih'
];

export const PesertaModal: React.FC<PesertaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingCount
}) => {
  const [formData, setFormData] = useState<Partial<Peserta>>({
    nama: '',
    sekolah: 'SMAN 1 Samarang',
    tingkat: 'Capas',
    regu: 'Regu Garuda',
    noHp: '',
    kontakDarurat: '',
    golonganDarah: '-',
    riwayatMedis: 'Tidak ada',
    ukuranKaos: 'L',
    statusBayar: 'Lunas',
    jumlahBayar: 150000,
    totalIuran: 150000,
    statusPresensi: 'Belum Hadir',
    catatan: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const nextNum = String(existingCount + 1).padStart(3, '0');
      setFormData({
        id: `PKB-SMG-${nextNum}`,
        nama: '',
        sekolah: 'SMAN 1 Samarang',
        tingkat: 'Capas',
        regu: 'Regu Garuda',
        noHp: '',
        kontakDarurat: '',
        golonganDarah: '-',
        riwayatMedis: 'Tidak ada',
        ukuranKaos: 'L',
        statusBayar: 'Belum Lunas',
        jumlahBayar: 0,
        totalIuran: 150000,
        statusPresensi: 'Belum Hadir',
        catatan: '',
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
  }, [initialData, existingCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.id) return;

    onSave({
      id: formData.id,
      nama: formData.nama,
      sekolah: formData.sekolah || 'SMAN 1 Samarang',
      tingkat: (formData.tingkat as TingkatPeserta) || 'Capas',
      regu: formData.regu || 'Regu Garuda',
      noHp: formData.noHp || '',
      kontakDarurat: formData.kontakDarurat || '',
      golonganDarah: (formData.golonganDarah as GolonganDarah) || '-',
      riwayatMedis: formData.riwayatMedis || 'Tidak ada',
      ukuranKaos: (formData.ukuranKaos as UkuranKaos) || 'L',
      statusBayar: (formData.statusBayar as StatusBayar) || 'Belum Lunas',
      jumlahBayar: Number(formData.jumlahBayar) || 0,
      totalIuran: Number(formData.totalIuran) || 150000,
      statusPresensi: formData.statusPresensi || 'Belum Hadir',
      waktuPresensi: formData.waktuPresensi,
      catatan: formData.catatan || '',
      createdAt: formData.createdAt || new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialData ? 'Ubah Data Peserta' : 'Pendaftaran Peserta Rihlah Baru'}
              </h3>
              <p className="text-xs text-slate-300">Giat Rihlah Paskibar Kecamatan Samarang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Registrasi / ID
              </label>
              <input
                type="text"
                required
                value={formData.id || ''}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-100 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Peserta *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Muhammad Farhan"
                value={formData.nama || ''}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Asal Pangkalan / Sekolah *
              </label>
              <select
                value={formData.sekolah || ''}
                onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
              >
                {SEKOLAH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tingkatan / Status *
              </label>
              <select
                value={formData.tingkat || 'Capas'}
                onChange={(e) => setFormData({ ...formData, tingkat: e.target.value as TingkatPeserta })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
              >
                <option value="Capas">Capas (Calon Paskibra)</option>
                <option value="Paskibra Inti">Paskibra Inti</option>
                <option value="Purna">Purna Paskibra</option>
                <option value="Panitia">Panitia Pelaksana</option>
                <option value="Pembina">Pembina / Pendamping</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Regu / Kelompok Tenda
              </label>
              <select
                value={formData.regu || 'Regu Garuda'}
                onChange={(e) => setFormData({ ...formData, regu: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
              >
                {REGU_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. WhatsApp Peserta
              </label>
              <input
                type="text"
                placeholder="Contoh: 08123456789"
                value={formData.noHp || ''}
                onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Golongan Darah
              </label>
              <select
                value={formData.golonganDarah || '-'}
                onChange={(e) => setFormData({ ...formData, golonganDarah: e.target.value as GolonganDarah })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
              >
                <option value="-">- Belum Tahu -</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ukuran Kaos Rihlah
              </label>
              <select
                value={formData.ukuranKaos || 'L'}
                onChange={(e) => setFormData({ ...formData, ukuranKaos: e.target.value as UkuranKaos })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
              >
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="3XL">3XL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Pembayaran
              </label>
              <select
                value={formData.statusBayar || 'Belum Lunas'}
                onChange={(e) => setFormData({ ...formData, statusBayar: e.target.value as StatusBayar })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
              >
                <option value="Lunas">Lunas</option>
                <option value="Cicil">Cicil</option>
                <option value="Belum Lunas">Belum Lunas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kontak Darurat Orang Tua / Wali
              </label>
              <input
                type="text"
                placeholder="Contoh: 081298765432 (Bpk. Mulyana)"
                value={formData.kontakDarurat || ''}
                onChange={(e) => setFormData({ ...formData, kontakDarurat: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Riwayat Medis / Alergi Khusus
              </label>
              <input
                type="text"
                placeholder="Contoh: Asma, Maag, Alergi Dingin, atau Tidak ada"
                value={formData.riwayatMedis || ''}
                onChange={(e) => setFormData({ ...formData, riwayatMedis: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Khusus Panitia
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Danton apel, sie perlengkapan, izin telat 30 menit..."
              value={formData.catatan || ''}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Data Peserta
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
