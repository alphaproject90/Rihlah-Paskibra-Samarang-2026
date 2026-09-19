import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PesertaRihlah, ScanResult } from '../types';
import {
  Search,
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
} from 'lucide-react';

// ─── Tipe Props ───────────────────────────────────────────────────────────────
export interface PesertaCheckInPanelProps {
  scanMode: 'registrasi_ulang' | 'berangkat' | 'pulang' | 'pulang_dari_lokasi' | 'tiba_di_rumah';
  onKembali?: () => void;
  onSubmitScan: (idPeserta: string) => Promise<ScanResult>;
  loading?: boolean;
  pesertaList: PesertaRihlah[];
}

// ─── Label mode ───────────────────────────────────────────────────────────────
const LABEL_MODE: Record<PesertaCheckInPanelProps['scanMode'], string> = {
  registrasi_ulang: 'Registrasi Ulang',
  berangkat: 'Keberangkatan',
  pulang: 'Kepulangan',
  pulang_dari_lokasi: 'Kepulangan dari Lokasi',
  tiba_di_rumah: 'Tiba di Rumah',
};

const WARNA_MODE: Record<PesertaCheckInPanelProps['scanMode'], string> = {
  registrasi_ulang: '#6366f1',
  berangkat: '#16a34a',
  pulang: '#dc2626',
  pulang_dari_lokasi: '#d97706',
  tiba_di_rumah: '#0891b2',
};

// ─── Komponen utama ───────────────────────────────────────────────────────────
export const PesertaCheckInPanel: React.FC<PesertaCheckInPanelProps> = ({
  scanMode,
  onKembali,
  onSubmitScan,
  loading = false,
  pesertaList,
}) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PesertaRihlah | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ─── Behavior a & d: timer auto-reset ref & fokus input ──────────────────
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const clearAutoResetTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const focusInput = () => {
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Behavior a (i): batalkan timer saat komponen unmount
  useEffect(() => {
    return () => {
      clearAutoResetTimer();
    };
  }, []);

  // Simpan handle timer auto-reset di ref (dipakai oleh handleSubmit)
  const setTimeout = (fn: () => void, ms?: number) => {
    clearAutoResetTimer();
    const id = window.setTimeout(() => {
      fn();
      timerRef.current = null;
      focusInput();
    }, ms);
    timerRef.current = id;
    return id;
  };

  // ─── Behavior b: hitung peserta eligible ──────────────────────────────────
  const totalPesertaIkut = useMemo(() => {
    return pesertaList.filter((p) => p.partisipasi === 'Ikut' && !p.deletedAt).length;
  }, [pesertaList]);

  // ─── Behavior c: hitung total kecocokan pencarian ──────────────────────────
  const totalKecocokan = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return 0;
    return pesertaList.filter((p) => {
      if (p.partisipasi !== 'Ikut') return false;
      if (p.deletedAt) return false;
      const nama = (p.nama || p.namaLengkap || '').toLowerCase();
      const unit = (p.unit || '').toLowerCase();
      const id = (p.idPeserta || p.id || '').toLowerCase();
      return nama.includes(q) || unit.includes(q) || id.includes(q);
    }).length;
  }, [query, pesertaList]);

  const labelMode = LABEL_MODE[scanMode];
  const warnaMode = WARNA_MODE[scanMode];

  // ─── Filter peserta berdasarkan query ──────────────────────────────────────
  const hasilFilter = useMemo<PesertaRihlah[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return pesertaList
      .filter((p) => {
        // BUG-2 fix: kecualikan peserta yang tidak eligible scan
        // (partisipasi !== 'Ikut' atau soft-deleted) sebelum pencocokan query.
        if (p.partisipasi !== 'Ikut') return false;
        if (p.deletedAt) return false;
        const nama = (p.nama || p.namaLengkap || '').toLowerCase();
        const unit = (p.unit || '').toLowerCase();
        const id = (p.idPeserta || p.id || '').toLowerCase();
        return nama.includes(q) || unit.includes(q) || id.includes(q);
      })
      .slice(0, 10);
  }, [query, pesertaList]);

  // ─── Handler pilih peserta ─────────────────────────────────────────────────
  const handlePilih = (p: PesertaRihlah) => {
    clearAutoResetTimer();
    setSelected(p);
    setQuery(p.nama || p.namaLengkap || '');
    setConfirmed(false);
    setErrorMsg('');
  };

  // ─── Handler konfirmasi / submit ───────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selected) return;
    const id = selected.idPeserta || selected.id;
    if (!id) {
      setErrorMsg('ID peserta tidak ditemukan. Hubungi panitia.');
      return;
    }
    setErrorMsg('');
    try {
      // BUG-1 fix: gunakan nilai kembalian ScanResult — jangan asumsikan sukses.
      const result = await onSubmitScan(id);
      if (result.success) {
        setConfirmed(true);
        // Reset form setelah 2.2 detik agar bisa scan peserta berikutnya
        setTimeout(() => {
          setSelected(null);
          setQuery('');
          setConfirmed(false);
        }, 2200);
      } else {
        setErrorMsg(result.message || 'Gagal mengirim presensi. Coba lagi.');
      }
    } catch {
      // Exception jaringan tak terduga di luar ScanResult (misal fetch timeout)
      setErrorMsg('Gagal mengirim presensi. Coba lagi.');
    }
  };

  // ─── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    clearAutoResetTimer();
    setSelected(null);
    setQuery('');
    setConfirmed(false);
    setErrorMsg('');
    focusInput();
  };

  return (
    <div style={{ minHeight: '100%' }} className="flex flex-col bg-white">
      {/* ── Header strip ── */}
      <div
        className="flex items-center gap-3 px-5 py-4 shadow-sm"
        style={{ background: warnaMode }}
      >
        {onKembali && (
          <button
            id="btn-checkin-kembali"
            onClick={onKembali}
            aria-label="Kembali"
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <UserCheck size={20} className="text-white flex-shrink-0" />
          <span className="text-white font-semibold text-sm truncate">
            Check-In Peserta &mdash; {labelMode}
          </span>
        </div>
        <span className="text-white/70 text-xs font-mono hidden sm:block">
          {totalPesertaIkut} peserta ikut
        </span>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col p-5 gap-5 overflow-y-auto">

        {/* Banner sukses */}
        <AnimatePresence>
          {confirmed && (
            <motion.div
              key="success-banner"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl"
              style={{ background: `${warnaMode}15`, border: `2px solid ${warnaMode}40` }}
            >
              <CheckCircle2 size={48} style={{ color: warnaMode }} />
              <p className="font-bold text-lg text-center" style={{ color: warnaMode }}>
                Presensi Berhasil!
              </p>
              <p className="text-slate-500 text-sm text-center">
                {selected?.nama || selected?.namaLengkap} &mdash; {labelMode}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search box + kartu */}
        {!confirmed && (
          <>
            <div>
              <label
                htmlFor="input-cari-peserta"
                className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
              >
                Cari nama, unit, atau ID peserta
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  ref={inputRef}
                  id="input-cari-peserta"
                  type="search"
                  value={query}
                  onChange={(e) => {
                    clearAutoResetTimer();
                    setQuery(e.target.value);
                    if (
                      selected &&
                      e.target.value !== (selected.nama || selected.namaLengkap)
                    ) {
                      setSelected(null);
                    }
                    setErrorMsg('');
                  }}
                  placeholder="Ketik nama peserta..."
                  autoComplete="off"
                  disabled={loading}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 transition-shadow disabled:opacity-60 bg-slate-50"
                />
              </div>
            </div>

            {/* Dropdown hasil pencarian */}
            <AnimatePresence>
              {hasilFilter.length > 0 && !selected && (
                <motion.ul
                  key="dropdown"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm"
                  role="listbox"
                  aria-label="Hasil pencarian peserta"
                >
                  {hasilFilter.map((p) => (
                    <motion.li
                      key={p.id}
                      whileHover={{ backgroundColor: '#f8fafc' }}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      role="option"
                      aria-selected={false}
                      onClick={() => handlePilih(p)}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                        style={{ background: warnaMode }}
                      >
                        {(p.nama || p.namaLengkap || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {p.nama || p.namaLengkap}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {p.unit}
                          {p.idPeserta ? ` \u00b7 ID: ${p.idPeserta}` : ''}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                    </motion.li>
                  ))}
                  {totalKecocokan > 10 && (
                    <li className="px-4 py-2.5 bg-slate-50 text-center text-xs text-slate-500">
                      Menampilkan 10 dari {totalKecocokan} hasil &mdash; persempit pencarian.
                    </li>
                  )}
                </motion.ul>
              )}
            </AnimatePresence>

            {/* Tidak ada hasil */}
            <AnimatePresence>
              {query.trim().length >= 2 && hasilFilter.length === 0 && !selected && (
                <motion.div
                  key="no-result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2 py-6 text-slate-400"
                >
                  <Users size={32} />
                  <p className="text-sm">Tidak ada peserta yang cocok</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Kartu peserta terpilih */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  key="selected-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="rounded-2xl border-2 p-4 flex flex-col gap-4"
                  style={{ borderColor: warnaMode, background: `${warnaMode}08` }}
                >
                  {/* Info peserta */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                      style={{ background: warnaMode }}
                    >
                      {(selected.nama || selected.namaLengkap || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {selected.nama || selected.namaLengkap}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selected.unit}
                        {selected.jk ? ` \u00b7 ${selected.jk}` : ''}
                      </p>
                      {selected.idPeserta && (
                        <p className="text-xs font-mono text-slate-400">
                          ID: {selected.idPeserta}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Label sesi */}
                  <div
                    className="rounded-xl px-3 py-2 text-center text-sm font-semibold"
                    style={{ background: `${warnaMode}20`, color: warnaMode }}
                  >
                    Sesi: {labelMode}
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2"
                      >
                        <AlertCircle size={15} className="flex-shrink-0" />
                        <span>{errorMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tombol aksi */}
                  <div className="flex gap-2">
                    <button
                      id="btn-checkin-ganti"
                      onClick={handleReset}
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Ganti Peserta
                    </button>
                    <motion.button
                      id="btn-checkin-konfirmasi"
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-[2] py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                      style={{ background: warnaMode }}
                    >
                      {loading ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          Konfirmasi Presensi
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Panduan kosong */}
            {!selected && query.trim().length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 text-slate-300">
                <Search size={40} strokeWidth={1.5} />
                <p className="text-sm text-slate-400 text-center">
                  Ketikkan nama atau ID peserta untuk memulai check-in
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PesertaCheckInPanel;
