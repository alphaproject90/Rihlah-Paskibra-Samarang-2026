import React, { useState } from 'react';
import { RundownItem } from '../types';
import { 
  CalendarClock, 
  MapPin, 
  User, 
  CheckCircle2, 
  Clock, 
  Plus, 
  X, 
  Download,
  Flame,
  Check
} from 'lucide-react';
import { exportToCsv } from '../utils/storage';

interface RundownViewProps {
  rundown: RundownItem[];
  onUpdateStatus: (id: string, status: 'Selesai' | 'Sedang Berlangsung' | 'Mendatang') => void;
  onAddRundownItem: (item: RundownItem) => void;
}

export const RundownView: React.FC<RundownViewProps> = ({
  rundown,
  onUpdateStatus,
  onAddRundownItem
}) => {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<RundownItem>>({
    hari: 1,
    waktu: '',
    namaKegiatan: '',
    lokasi: 'Bumi Perkemahan Kamojang',
    penanggungJawab: 'Sie Acara',
    keterangan: '',
    status: 'Mendatang'
  });

  const filteredItems = rundown.filter(r => r.hari === activeDay);

  const handleExport = () => {
    exportToCsv('Rundown_Giat_Rihlah_Paskibar_Samarang.csv', rundown);
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.namaKegiatan || !newItem.waktu) return;

    onAddRundownItem({
      id: 'RD-' + Date.now(),
      hari: newItem.hari || 1,
      waktu: newItem.waktu,
      namaKegiatan: newItem.namaKegiatan,
      lokasi: newItem.lokasi || 'Kamojang',
      penanggungJawab: newItem.penanggungJawab || 'Sie Acara',
      keterangan: newItem.keterangan || '',
      status: (newItem.status as any) || 'Mendatang'
    });

    setIsModalOpen(false);
    setNewItem({
      hari: activeDay,
      waktu: '',
      namaKegiatan: '',
      lokasi: 'Bumi Perkemahan Kamojang',
      penanggungJawab: 'Sie Acara',
      keterangan: '',
      status: 'Mendatang'
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Jadwal & Rundown Acara Rihlah
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
              2 Hari 1 Malam
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rangkaian kegiatan apel, pelatihan lapangan PBB, materi keorganisasian, api unggun, dan tadabbur alam
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
            + Tambah Agenda
          </button>
        </div>
      </div>

      {/* Day Switcher Tab */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveDay(1)}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer ${
            activeDay === 1
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Hari ke-1 (Sabtu: Apel, Perjalanan, Tenda & Api Unggun)
        </button>
        <button
          onClick={() => setActiveDay(2)}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer ${
            activeDay === 2
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Hari ke-2 (Minggu: Senam, Jelajah Alam & Apel Penutupan)
        </button>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-3">
        {filteredItems.map((item, index) => {
          const isOngoing = item.status === 'Sedang Berlangsung';
          const isDone = item.status === 'Selesai';

          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isOngoing
                  ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300 shadow-xs ring-2 ring-red-400/20'
                  : isDone
                  ? 'bg-slate-50 border-slate-200 opacity-80'
                  : 'bg-white border-slate-200/90 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Left: Time and Title */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                      {item.waktu}
                    </span>
                    {isOngoing && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                        <Flame className="w-3 h-3" />
                        Aktif Sekarang
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        Selesai
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{item.namaKegiatan}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.keterangan}</p>
                </div>

                {/* Right: Location, PIC & Status Action */}
                <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <div className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {item.lokasi}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    PJ: <strong className="text-slate-700">{item.penanggungJawab}</strong>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() => onUpdateStatus(item.id, 'Selesai')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                        isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ✓ Selesai
                    </button>
                    <button
                      onClick={() => onUpdateStatus(item.id, 'Sedang Berlangsung')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                        isOngoing ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ● Berjalan
                    </button>
                    <button
                      onClick={() => onUpdateStatus(item.id, 'Mendatang')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                        item.status === 'Mendatang' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Mendatang
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Add Rundown Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="text-sm font-bold">Tambah Agenda Rundown Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hari Ke-</label>
                  <select
                    value={newItem.hari}
                    onChange={(e) => setNewItem({ ...newItem, hari: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  >
                    <option value={1}>Hari 1 (Sabtu)</option>
                    <option value={2}>Hari 2 (Minggu)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Waktu (WIB)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 14:00 - 15:30"
                    value={newItem.waktu}
                    onChange={(e) => setNewItem({ ...newItem, waktu: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Agenda / Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Latihan Formasi PBB Gabungan"
                  value={newItem.namaKegiatan}
                  onChange={(e) => setNewItem({ ...newItem, namaKegiatan: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi</label>
                  <input
                    type="text"
                    value={newItem.lokasi}
                    onChange={(e) => setNewItem({ ...newItem, lokasi: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penanggung Jawab (PJ)</label>
                  <input
                    type="text"
                    value={newItem.penanggungJawab}
                    onChange={(e) => setNewItem({ ...newItem, penanggungJawab: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Perlengkapan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan rincian kegiatan..."
                  value={newItem.keterangan}
                  onChange={(e) => setNewItem({ ...newItem, keterangan: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
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
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
