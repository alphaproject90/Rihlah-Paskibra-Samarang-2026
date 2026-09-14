'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserX,
  CheckCircle2,
  Clock,
  QrCode,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Phone,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';

interface PesertaItem {
  id: string;
  nama: string;
  jk: string;
  unit: string;
  partisipasi: string;
  alasan?: string;
  waPeserta?: string;
  waDarurat?: string;
  medis?: string;
  waktuBerangkat?: string;
  waktuPulang?: string;
  username?: string;
}

interface StatData {
  total: number;
  tidakIkut: number;
  berangkat: number;
  pulang: number;
}

export default function DashboardPanitiaPage() {
  const router = useRouter();

  const [stats, setStats] = useState<StatData>({ total: 0, tidakIkut: 0, berangkat: 0, pulang: 0 });
  const [pesertaList, setPesertaList] = useState<PesertaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resStats, resPeserta] = await Promise.all([
        fetch('/api/statistik'),
        fetch('/api/peserta'),
      ]);

      if (resStats.status === 401 || resPeserta.status === 401) {
        router.push('/login/panitia');
        return;
      }

      const jsonStats = await resStats.json();
      const jsonPeserta = await resPeserta.json();

      if (jsonStats.status === 'success') {
        setStats({
          total: jsonStats.total,
          tidakIkut: jsonStats.tidakIkut,
          berangkat: jsonStats.berangkat,
          pulang: jsonStats.pulang,
        });
      }

      if (jsonPeserta.status === 'success' && Array.isArray(jsonPeserta.data)) {
        setPesertaList(jsonPeserta.data);
      }
    } catch {
      setToast({ message: 'Gagal menyinkronkan data dengan server.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter daftar unit unik
  const units = Array.from(new Set(pesertaList.map((p) => p.unit))).filter(Boolean);

  const filteredData = pesertaList.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.unit.toLowerCase().includes(search.toLowerCase());

    const matchUnit = filterUnit === 'ALL' || p.unit === filterUnit;

    let matchStatus = true;
    if (filterStatus === 'IKUT') matchStatus = p.partisipasi === 'Ikut';
    else if (filterStatus === 'TIDAK_IKUT') matchStatus = p.partisipasi === 'Tidak Ikut';
    else if (filterStatus === 'SUDAH_BERANGKAT') matchStatus = !!p.waktuBerangkat;
    else if (filterStatus === 'BELUM_BERANGKAT') matchStatus = p.partisipasi === 'Ikut' && !p.waktuBerangkat;
    else if (filterStatus === 'SUDAH_PULANG') matchStatus = !!p.waktuPulang;

    return matchSearch && matchUnit && matchStatus;
  });

  const exportCSV = () => {
    const headers = ['ID Peserta', 'Nama Lengkap', 'Jenis Kelamin', 'Asal Unit', 'Partisipasi', 'Alasan', 'WA Pribadi', 'WA Darurat', 'Riwayat Medis', 'Waktu Berangkat', 'Waktu Pulang'];
    const rows = filteredData.map((p) => [
      `"${p.id}"`,
      `"${p.nama}"`,
      `"${p.jk}"`,
      `"${p.unit}"`,
      `"${p.partisipasi}"`,
      `"${p.alasan || ''}"`,
      `"${p.waPeserta || ''}"`,
      `"${p.waDarurat || ''}"`,
      `"${p.medis || ''}"`,
      `"${p.waktuBerangkat ? new Date(p.waktuBerangkat).toLocaleString('id-ID') : ''}"`,
      `"${p.waktuPulang ? new Date(p.waktuPulang).toLocaleString('id-ID') : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap-Giat-Rihlah-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header userType="panitia" userName="Panitia Samarang" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" />
              Portal Administrator Panitia
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Presensi & Peserta</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>

            <Link
              href="/panitia/scan"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Buka Scanner Presensi</span>
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Peserta Ikut</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.total}</div>
            <span className="text-[11px] text-slate-500">Konfirmasi hadir di rihlah</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Presensi Berangkat</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{stats.berangkat}</div>
            <span className="text-[11px] text-slate-500">
              {stats.total > 0 ? `${Math.round((stats.berangkat / stats.total) * 100)}% dari total ikut` : '0%'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Presensi Pulang</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">{stats.pulang}</div>
            <span className="text-[11px] text-slate-500">
              {stats.total > 0 ? `${Math.round((stats.pulang / stats.total) * 100)}% dari total ikut` : '0%'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Tidak Ikut</span>
              <UserX className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400">{stats.tidakIkut}</div>
            <span className="text-[11px] text-slate-500">Tercatat berhalangan hadir</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama, ID, atau unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Unit */}
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Semua Unit ({pesertaList.length})</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="IKUT">Hanya Ikut</option>
              <option value="SUDAH_BERANGKAT">Sudah Scan Berangkat</option>
              <option value="BELUM_BERANGKAT">Belum Scan Berangkat</option>
              <option value="SUDAH_PULANG">Sudah Scan Pulang</option>
              <option value="TIDAK_IKUT">Tidak Ikut</option>
            </select>

            {/* Export CSV */}
            <button
              onClick={exportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold flex items-center gap-1.5 transition"
              title="Download Rekap CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Tabel Data Peserta */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">ID & Nama Peserta</th>
                  <th className="px-4 py-3.5">Unit Asal</th>
                  <th className="px-4 py-3.5">Kontak</th>
                  <th className="px-4 py-3.5 text-center">Keberangkatan</th>
                  <th className="px-4 py-3.5 text-center">Kepulangan</th>
                  <th className="px-4 py-3.5">Keterangan Medis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      Tidak ada data peserta yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      {/* ID & Nama */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-blue-400 block text-[11px]">{p.id}</span>
                        <span className="font-semibold text-white text-sm block">{p.nama}</span>
                        <span className="text-[10px] text-slate-400">{p.jk}</span>
                      </td>

                      {/* Asal Unit */}
                      <td className="px-4 py-3.5 text-slate-300 font-medium">
                        {p.unit}
                        {p.partisipasi === 'Tidak Ikut' && (
                          <span className="block text-[10px] text-rose-400 font-semibold mt-0.5">
                            Tidak Ikut ({p.alasan})
                          </span>
                        )}
                      </td>

                      {/* Kontak */}
                      <td className="px-4 py-3.5 text-slate-400">
                        {p.waPeserta ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-300">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{p.waPeserta}</span>
                            </div>
                            {p.waDarurat && (
                              <span className="text-[10px] text-slate-500 block">Darurat: {p.waDarurat}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Keberangkatan */}
                      <td className="px-4 py-3.5 text-center">
                        {p.partisipasi === 'Tidak Ikut' ? (
                          <span className="text-[10px] text-slate-600">-</span>
                        ) : p.waktuBerangkat ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            {new Date(p.waktuBerangkat).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            Belum Hadir
                          </span>
                        )}
                      </td>

                      {/* Kepulangan */}
                      <td className="px-4 py-3.5 text-center">
                        {p.partisipasi === 'Tidak Ikut' ? (
                          <span className="text-[10px] text-slate-600">-</span>
                        ) : p.waktuPulang ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            {new Date(p.waktuPulang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            Belum Scan
                          </span>
                        )}
                      </td>

                      {/* Catatan Medis */}
                      <td className="px-4 py-3.5 text-slate-400">
                        {p.medis && p.medis !== '-' ? (
                          <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
                            {p.medis}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
            <span>Menampilkan {filteredData.length} dari {pesertaList.length} total peserta</span>
          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
