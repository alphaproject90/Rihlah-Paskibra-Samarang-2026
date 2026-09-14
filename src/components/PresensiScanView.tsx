import React, { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Volume2, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  UserCheck, 
  Flame,
  Award
} from 'lucide-react';
import { Peserta, PresensiLog, ReguInfo } from '../types';
import { playSuccessBeep, playErrorBeep } from '../utils/audio';

interface PresensiScanViewProps {
  peserta: Peserta[];
  reguList: ReguInfo[];
  presensiLogs: PresensiLog[];
  onCheckIn: (pesertaId: string, sesi: string) => { success: boolean; message: string; peserta?: Peserta };
}

export const PresensiScanView: React.FC<PresensiScanViewProps> = ({
  peserta,
  reguList,
  presensiLogs,
  onCheckIn
}) => {
  const [inputCode, setInputCode] = useState('');
  const [selectedSesi, setSelectedSesi] = useState('Apel Pelepasan Samarang');
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    peserta?: Peserta;
  }>({ status: null, message: '' });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Quick stats
  const totalPeserta = peserta.length;
  const hadirCount = peserta.filter(p => p.statusPresensi === 'Hadir').length;
  const belumCount = peserta.filter(p => p.statusPresensi === 'Belum Hadir').length;
  const hadirPercent = totalPeserta > 0 ? Math.round((hadirCount / totalPeserta) * 100) : 0;

  // Handle Form Manual / Barcode Gun Submission
  const handleProcessCode = (codeToProcess: string) => {
    const trimmed = codeToProcess.trim();
    if (!trimmed) return;

    let targetId = trimmed;
    // Check if JSON QR format was scanned
    if (trimmed.startsWith('{') && trimmed.includes('id')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.id) targetId = parsed.id;
      } catch {
        // fallback
      }
    }

    const res = onCheckIn(targetId, selectedSesi);
    if (res.success && res.peserta) {
      playSuccessBeep();
      setScanResult({
        status: 'success',
        message: res.message,
        peserta: res.peserta
      });
    } else {
      playErrorBeep();
      setScanResult({
        status: 'error',
        message: res.message
      });
    }
    setInputCode('');
  };

  const handleSubmitInput = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessCode(inputCode);
  };

  // Camera start/stop
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Izin kamera belum diberikan atau kamera tidak tersedia pada perangkat ini.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Presensi & Check-in Lapangan
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
              {hadirPercent}% Hadir ({hadirCount}/{totalPeserta})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Scan QR Code E-Badge peserta atau masukkan ID pendaftaran untuk check-in apel & kegiatan rihlah
          </p>
        </div>

        {/* Sesi Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Sesi Kegiatan:</label>
          <select
            value={selectedSesi}
            onChange={(e) => setSelectedSesi(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
          >
            <option value="Apel Pelepasan Samarang">Apel Pelepasan di Samarang</option>
            <option value="Kedatangan Kamojang">Tiba di Kamojang Camping Ground</option>
            <option value="Apel Api Unggun Malam">Apel Malam Api Unggun</option>
            <option value="Lintas Alam / Outbound">Jelajah Alam / Outbound</option>
            <option value="Apel Penutupan Rihlah">Apel Penutupan & Pemulangan</option>
          </select>
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Scanner & Quick Input (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Barcode Gun / Manual Input Bar */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-red-600" />
                Input ID / Scan Barcode Scanner
              </label>
              <span className="text-[11px] text-slate-400">Tekan Enter untuk Check-in</span>
            </div>

            <form onSubmit={handleSubmitInput} className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Ketik ID (contoh: PKB-SMG-001) atau gunakan scanner barcode..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Check-in
              </button>
            </form>

            {/* Quick click chips of attendees not yet present */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Klik Cepat Peserta Belum Hadir:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {peserta.filter(p => p.statusPresensi === 'Belum Hadir').slice(0, 8).map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleProcessCode(p.id)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 rounded-lg text-slate-700 font-medium transition cursor-pointer"
                  >
                    + {p.nama.split(' ')[0]} ({p.id})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Camera Scanner Box */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Pemindai Kamera Langsung</h3>
              </div>
              {!isCameraActive ? (
                <button
                  onClick={startCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Aktifkan Kamera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition cursor-pointer"
                >
                  Matikan Kamera
                </button>
              )}
            </div>

            {/* Video Preview or Placeholder */}
            <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-800">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Visual QR target guide overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-red-500 rounded-2xl relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white"></div>
                      <div className="h-0.5 w-full bg-red-500/80 absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    Kamera belum aktif. Klik tombol "Aktifkan Kamera" di atas atau gunakan input ID cepat.
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Feedback Result Banner */}
          {scanResult.status && (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                scanResult.status === 'success'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.status === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-sm">
                    {scanResult.status === 'success' ? 'Presensi Berhasil Dikonfirmasi!' : 'Gagal Memproses Presensi'}
                  </h4>
                  <p className="text-xs">{scanResult.message}</p>

                  {/* If participant details available */}
                  {scanResult.peserta && (
                    <div className="mt-2 pt-2 border-t border-emerald-200/80 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-emerald-700 block text-[10px] uppercase font-bold">Nama / Sekolah</span>
                        <span className="font-bold text-slate-900">{scanResult.peserta.nama}</span>
                        <span className="block text-slate-600 text-[11px]">{scanResult.peserta.sekolah}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 block text-[10px] uppercase font-bold">Regu / Tingkat</span>
                        <span className="font-bold text-slate-900">{scanResult.peserta.regu}</span>
                        <span className="block text-slate-600 text-[11px]">Tingkat: {scanResult.peserta.tingkat}</span>
                      </div>
                      {scanResult.peserta.riwayatMedis && scanResult.peserta.riwayatMedis !== 'Tidak ada' && (
                        <div className="col-span-2 bg-amber-100/70 p-2 rounded-lg text-amber-900 font-semibold text-[11px]">
                          ⚠️ Catatan Medis Peserta: {scanResult.peserta.riwayatMedis}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Attendance by Regu & Recent Logs (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Regu Attendance Progress Cards */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Rekapitulasi Kehadiran Tiap Regu
            </h3>

            <div className="space-y-2.5">
              {reguList.map((regu) => {
                const members = peserta.filter(p => p.regu === regu.namaRegu);
                const hadirMembers = members.filter(p => p.statusPresensi === 'Hadir');
                const percent = members.length > 0 ? Math.round((hadirMembers.length / members.length) * 100) : 0;

                return (
                  <div key={regu.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: regu.warnaBendera }}
                        />
                        <span>{regu.namaRegu}</span>
                      </div>
                      <span className="font-bold text-slate-600">
                        {hadirMembers.length} / {members.length} ({percent}%)
                      </span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Realtime Attendance Feed Logs */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Log Presensi Lapangan Terkini
              </h3>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Realtime
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {presensiLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  Belum ada catatan presensi pada sesi ini.
                </p>
              ) : (
                presensiLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{log.nama}</div>
                      <div className="text-[10px] text-slate-500">
                        {log.regu} • {log.sesi}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 block">
                        ✓ Hadir
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.waktu.split(' ')[1] || log.waktu}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
