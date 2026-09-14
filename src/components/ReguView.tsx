import React, { useState } from 'react';
import { ReguInfo, Peserta, LogistikItem } from '../types';
import { Tent, Users, Flag, Shield, CheckCircle, PackageCheck, AlertCircle, Plus } from 'lucide-react';

interface ReguViewProps {
  reguList: ReguInfo[];
  peserta: Peserta[];
  logistik: LogistikItem[];
  onToggleLogistik: (id: string) => void;
  onMovePesertaRegu: (pesertaId: string, newRegu: string) => void;
}

export const ReguView: React.FC<ReguViewProps> = ({
  reguList,
  peserta,
  logistik,
  onToggleLogistik,
  onMovePesertaRegu
}) => {
  const [selectedReguId, setSelectedReguId] = useState<string>(reguList[0]?.id || '');

  const activeRegu = reguList.find(r => r.id === selectedReguId) || reguList[0];
  const activeReguMembers = peserta.filter(p => p.regu === activeRegu?.namaRegu);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Pembagian Regu & Manajemen Barak Tenda
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              {reguList.length} Regu Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelompokan peleton rihlah, penempatan tenda perkemahan Kamojang, serta kesiapan logistik lapangan
          </p>
        </div>
      </div>

      {/* Regu Cards Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {reguList.map((r) => {
          const count = peserta.filter(p => p.regu === r.namaRegu).length;
          const isSelected = r.id === selectedReguId;

          return (
            <button
              key={r.id}
              onClick={() => setSelectedReguId(r.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md ring-2 ring-red-500'
                  : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/40"
                  style={{ backgroundColor: r.warnaBendera }}
                />
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {count} Org
                </span>
              </div>
              <h4 className="font-bold text-xs sm:text-sm truncate">{r.namaRegu}</h4>
              <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                {r.nomorTenda.split(' ')[0]} {r.nomorTenda.split(' ')[1]}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Regu Details & Members Breakdown */}
      {activeRegu && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Regu Identity & Members (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              
              {/* Regu Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: activeRegu.warnaBendera }}
                    />
                    <h3 className="text-lg font-bold text-slate-900 font-heading">
                      {activeRegu.namaRegu}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    "{activeRegu.semboyan}"
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-800 font-semibold border border-purple-200">
                    🏕️ {activeRegu.nomorTenda}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    Kapasitas: {activeReguMembers.length} / {activeRegu.kapasitas} Orang
                  </span>
                </div>
              </div>

              {/* Ketua Regu Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Ketua Regu / Penanggung Jawab:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{activeRegu.ketuaRegu}</p>
                </div>
                <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                  <Shield className="w-4 h-4" />
                </div>
              </div>

              {/* Regu Members List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Daftar Anggota Personel ({activeReguMembers.length} Orang)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeReguMembers.length === 0 ? (
                    <div className="col-span-2 text-center py-6 text-xs text-slate-400 italic">
                      Belum ada anggota yang ditempatkan di regu ini.
                    </div>
                  ) : (
                    activeReguMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">{member.nama}</div>
                          <div className="text-[11px] text-slate-500">{member.sekolah}</div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span>{member.tingkat}</span>
                            <span>•</span>
                            <span className={member.statusBayar === 'Lunas' ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                              {member.statusBayar}
                            </span>
                          </div>
                        </div>

                        {/* Move Regu selector */}
                        <select
                          value={member.regu}
                          onChange={(e) => onMovePesertaRegu(member.id, e.target.value)}
                          title="Pindahkan ke regu lain"
                          className="text-[10px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-hidden"
                        >
                          {reguList.map((r) => (
                            <option key={r.id} value={r.namaRegu}>
                              {r.namaRegu}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Right: Field Logistics & Equipment Checklist (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Checklist Logistik Rihlah</h3>
                    <p className="text-[11px] text-slate-500">Kesiapan perlengkapan perkemahan</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {logistik.map((item) => {
                  const isSiap = item.status === 'Siap';
                  return (
                    <div
                      key={item.id}
                      onClick={() => onToggleLogistik(item.id)}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-900 block leading-tight">{item.namaBarang}</span>
                        <div className="text-[10px] text-slate-500">
                          {item.jumlah} • PIC: {item.pic}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isSiap ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                <span className="font-bold block">Barang Wajib Pribadi Peserta:</span>
                <ul className="list-disc list-inside text-[11px] text-red-800 space-y-0.5">
                  <li>Seragam Lapangan Paskibra & Kaos Giat Rihlah</li>
                  <li>Jaket hangat / sweater tebal (suhu Kamojang dingin)</li>
                  <li>Matras, kantung tidur (sleeping bag), senter</li>
                  <li>Perlengkapan ibadah & obat-obatan pribadi</li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
