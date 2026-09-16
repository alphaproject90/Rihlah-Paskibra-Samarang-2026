import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  Filter,
  AlertTriangle,
  AlertOctagon,
  Info,
  ChevronDown,
  ShieldAlert,
  Server
} from 'lucide-react';
import { SystemLogEntry } from '../../types';
import { apiService } from '../../services/apiService';

interface LogSistemViewProps {
  tampilkanNotif?: (pesan: string, tipe?: 'info' | 'success' | 'error') => void;
}

export const LogSistemView: React.FC<LogSistemViewProps> = ({ tampilkanNotif }) => {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('Semua');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const muatLogs = useCallback(async (level: string) => {
    setLoading(true);
    try {
      const res = await apiService.getSystemLog({
        level: level !== 'Semua' ? level : undefined,
        limit: 50,
      });

      if (res.ok) {
        setLogs(res.data);
        setNextCursor(res.nextCursor);
      } else {
        if (tampilkanNotif) tampilkanNotif(res.message || 'Gagal memuat log sistem.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [tampilkanNotif]);

  useEffect(() => {
    muatLogs(levelFilter);
  }, [levelFilter, muatLogs]);

  const handleMuatLebihBanyak = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await apiService.getSystemLog({
        level: levelFilter !== 'Semua' ? levelFilter : undefined,
        cursor: nextCursor,
        limit: 50,
      });

      if (res.ok) {
        setLogs((prev) => [...prev, ...res.data]);
        setNextCursor(res.nextCursor);
      } else if (tampilkanNotif) {
        tampilkanNotif(res.message || 'Gagal memuat log lanjutan.', 'error');
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const renderBadgeLevel = (level: SystemLogEntry['level']) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black bg-rose-900 text-rose-100 border border-rose-600 shadow-xs">
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            <span>CRITICAL</span>
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            <span>ERROR</span>
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>WARN</span>
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Info className="w-3 h-3 text-slate-500" />
            <span>INFO</span>
          </span>
        );
    }
  };

  const formatTanggalWaktu = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900">
              Audit Trail &amp; Log Sistem
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {logs.length} Entri
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Riwayat aktivitas keamanan, percakapan autentikasi, pemindaian QR, dan pengaturan sistem
          </p>
        </div>

        {/* Filter & Tombol Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 text-[11px] font-medium">Level:</span>
            <select
              id="filter-level-log"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-xs"
            >
              <option value="Semua">Semua Level</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <button
            type="button"
            id="btn-refresh-log"
            onClick={() => muatLogs(levelFilter)}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Muat ulang log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabel Log */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 mx-auto text-slate-300 animate-spin" />
            <p className="text-xs font-medium">Memuat log sistem...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Server className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium">
              {levelFilter !== 'Semua'
                ? `Tidak ada catatan log dengan level "${levelFilter}".`
                : 'Belum ada aktivitas yang dicatat dalam log sistem.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3.5">Waktu</th>
                  <th className="py-2.5 px-3.5">Level</th>
                  <th className="py-2.5 px-3.5">Aksi</th>
                  <th className="py-2.5 px-3.5">Aktor</th>
                  <th className="py-2.5 px-3.5">IP Address</th>
                  <th className="py-2.5 px-3.5">Rincian Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition align-top">
                    <td className="py-3 px-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {formatTanggalWaktu(item.createdAt)}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {renderBadgeLevel(item.level)}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-800 text-[11px]">
                      {item.action}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-slate-700 whitespace-nowrap text-[11px]">
                      {item.actorId || '-'}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {item.ipAddress || '-'}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 text-[11px] max-w-xs">
                      {item.details ? (
                        <details className="group cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 select-none">
                            <span>Lihat rincian</span>
                            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                          </summary>
                          <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-40">
                            {typeof item.details === 'object'
                              ? JSON.stringify(item.details, null, 2)
                              : String(item.details)}
                          </div>
                        </details>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tombol Muat Lebih Banyak */}
        {nextCursor && (
          <div className="p-4 border-t border-slate-100 text-center bg-slate-50/50">
            <button
              type="button"
              id="btn-muat-lebih-banyak-log"
              onClick={handleMuatLebihBanyak}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMore ? 'animate-spin' : ''}`} />
              <span>{loadingMore ? 'Memuat data lanjutan...' : 'Muat Lebih Banyak'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
