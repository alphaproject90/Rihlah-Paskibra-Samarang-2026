'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import { QrScanner } from '@/components/QrScanner';
import { QrCode, CheckCircle2, AlertCircle, ArrowLeft, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface RecentScan {
  idPeserta: string;
  nama: string;
  mode: 'berangkat' | 'pulang';
  waktu: string;
  status: 'success' | 'error';
  message: string;
}

export default function PanitiaScanPage() {
  const [mode, setMode] = useState<'berangkat' | 'pulang'>('berangkat');
  const [manualId, setManualId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const processScan = async (idToProcess: string) => {
    if (processing || !idToProcess.trim()) return;

    setProcessing(true);
    const cleanId = idToProcess.trim().toUpperCase();

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idPeserta: cleanId,
          mode,
        }),
      });

      const json = await res.json();
      const nowStr = new Date().toLocaleTimeString('id-ID');

      if (res.ok && json.status === 'success') {
        const scanItem: RecentScan = {
          idPeserta: cleanId,
          nama: json.nama,
          mode,
          waktu: nowStr,
          status: 'success',
          message: json.message,
        };
        setRecentScans((prev) => [scanItem, ...prev.slice(0, 9)]);
        setToast({ message: json.message, type: 'success' });
        setManualId('');
      } else {
        const errMsg = json.message || 'Presensi gagal dicatat.';
        const scanItem: RecentScan = {
          idPeserta: cleanId,
          nama: 'Gagal',
          mode,
          waktu: nowStr,
          status: 'error',
          message: errMsg,
        };
        setRecentScans((prev) => [scanItem, ...prev.slice(0, 9)]);
        setToast({ message: errMsg, type: 'error' });
      }
    } catch {
      setToast({ message: 'Terjadi gangguan jaringan saat memproses scan.', type: 'error' });
    } finally {
      setTimeout(() => {
        setProcessing(false);
      }, 1000); // 1 detik jeda untuk mencegah multiple trigger pada frame yang sama
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      processScan(manualId.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header userType="panitia" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/panitia"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Panitia</span>
          </Link>
          <div className="text-xs text-slate-500">Scanner QR Code Real-Time</div>
        </div>

        {/* Mode Selector */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Pilih Mode Presensi Aktif
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setMode('berangkat')}
              className={`py-3 px-4 rounded-xl font-bold text-sm border transition ${
                mode === 'berangkat'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Pos Keberangkatan
            </button>
            <button
              type="button"
              onClick={() => setMode('pulang')}
              className={`py-3 px-4 rounded-xl font-bold text-sm border transition ${
                mode === 'pulang'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Pos Kepulangan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Scanner Box */}
          <div className="md:col-span-7 flex flex-col items-center">
            <div className="w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center">
              <div className="w-full mb-4">
                <QrScanner onScanSuccess={(text) => processScan(text)} />
              </div>

              {processing && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  Memproses Tiket...
                </div>
              )}

              {/* Manual Input Fallback */}
              <form onSubmit={handleManualSubmit} className="w-full mt-2 pt-4 border-t border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Input Manual (Jika Barcode Rusak)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: PASK-0001"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500 uppercase font-mono"
                  />
                  <button
                    type="submit"
                    disabled={processing || !manualId.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 transition active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Presensi</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Riwayat Scan Terbaru */}
          <div className="md:col-span-5">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Riwayat Scan Terkini
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  {recentScans.length} dicatat
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[480px] pr-1">
                {recentScans.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    <QrCode className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Arahkan kamera ke QR Code peserta untuk mulai presensi.
                  </div>
                ) : (
                  recentScans.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs transition animate-in fade-in ${
                        item.status === 'success'
                          ? 'bg-slate-950 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-950 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-blue-400">{item.idPeserta}</span>
                        <span className="text-[10px] text-slate-500">{item.waktu}</span>
                      </div>
                      <div className="font-semibold text-white text-sm mb-0.5">{item.nama}</div>
                      <div className="text-[11px] opacity-90 flex items-center gap-1">
                        {item.status === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                        )}
                        <span>{item.message}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
