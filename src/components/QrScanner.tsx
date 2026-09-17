import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { 
  Camera, 
  SwitchCamera, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

export interface QrScannerProps {
  scanMode?: 'registrasi_ulang' | 'berangkat' | 'pulang' | 'pulang_dari_lokasi' | 'tiba_di_rumah';
  onKembali?: () => void;
  onSubmitScan: (idPeserta: string) => Promise<void>;
  loading?: boolean;
}

export const QrScanner: React.FC<QrScannerProps> = ({
  scanMode = 'berangkat',
  onKembali,
  onSubmitScan,
  loading = false
}) => {
  const [manualId, setManualId] = useState('');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [currentFacingMode, setCurrentFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState(false);
  const [cameraErrorMessage, setCameraErrorMessage] = useState('');
  const [cameraLoading, setCameraLoading] = useState(true);
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const switchingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  const scannerId = 'qr-reader-container';

  // Helper untuk mengenali nama kamera yang mudah dipahami
  const getCameraFriendlyLabel = (device: CameraDevice, index: number): string => {
    const label = (device.label || '').toLowerCase();
    if (label.includes('front') || label.includes('depan') || label.includes('user') || label.includes('selfie') || label.includes('facing front')) {
      return 'Kamera Depan (Selfie)';
    }
    if (label.includes('back') || label.includes('rear') || label.includes('belakang') || label.includes('environment') || label.includes('facing back')) {
      return 'Kamera Belakang (Utama)';
    }
    if (label.includes('wide') || label.includes('ultrawide') || label.includes('0')) {
      return `Kamera Belakang (Lensa ${index + 1})`;
    }
    if (device.label && device.label.trim().length > 0) {
      return device.label;
    }
    return index === 0 ? 'Kamera Belakang (Utama)' : `Kamera ${index + 1} (Depan/Sekunder)`;
  };

  const isFrontCamera = (device?: CameraDevice, facing?: 'environment' | 'user'): boolean => {
    if (facing === 'user') return true;
    if (!device) return false;
    const label = (device.label || '').toLowerCase();
    return label.includes('front') || label.includes('depan') || label.includes('user') || label.includes('selfie');
  };

  const currentCamera = cameras.find(c => c.id === selectedCameraId) || cameras[0];
  const isCurrentFront = isFrontCamera(currentCamera, currentFacingMode);
  const currentCameraName = currentCamera ? getCameraFriendlyLabel(currentCamera, cameras.indexOf(currentCamera)) : (isCurrentFront ? 'Kamera Depan' : 'Kamera Belakang');

  // Callback ketika QR berhasil dibaca
  const handleDecodedText = (decodedText: string) => {
    if (!isScanningRef.current) {
      isScanningRef.current = true;
      const cleanText = decodedText.trim();
      setLastScanned(cleanText);
      setAriaAnnouncement(`QR Code berhasil dipindai: ${cleanText}`);

      onSubmitScan(cleanText).finally(() => {
        // Beri jeda 2.5 detik sebelum scan berikutnya agar tidak duplikat
        setTimeout(() => {
          isScanningRef.current = false;
        }, 2500);
      });
    }
  };

  // Mulai atau ganti kamera ke kamera target
  const activateCamera = async (targetCameraId: string, cameraIndex: number) => {
    if (switchingRef.current) return;
    switchingRef.current = true;
    setSwitchingCamera(true);
    setCameraLoading(true);
    setCameraError(false);

    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } else {
        html5QrCodeRef.current = new Html5Qrcode(scannerId);
      }

      // Jeda sejenak untuk melepaskan resource hardware kamera
      await new Promise((r) => setTimeout(r, 150));

      await html5QrCodeRef.current.start(
        targetCameraId,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0
        },
        handleDecodedText,
        () => {} // Abaikan frame tanpa QR
      );

      if (isMountedRef.current) {
        setSelectedCameraId(targetCameraId);
        const targetCam = cameras[cameraIndex];
        const isFront = isFrontCamera(targetCam);
        setCurrentFacingMode(isFront ? 'user' : 'environment');

        const friendlyName = targetCam ? getCameraFriendlyLabel(targetCam, cameraIndex) : `Kamera ${cameraIndex + 1}`;
        setAriaAnnouncement(`Kamera berhasil dialihkan ke ${friendlyName}`);
      }
    } catch (err: any) {
      console.warn('Gagal mengaktifkan kamera dengan ID spesifik:', err);
      // Fallback: Gunakan facingMode jika direct camera ID ditolak oleh peramban
      try {
        const fallbackFacing = currentFacingMode === 'environment' ? 'user' : 'environment';
        if (html5QrCodeRef.current) {
          await html5QrCodeRef.current.start(
            { facingMode: fallbackFacing },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
              aspectRatio: 1.0
            },
            handleDecodedText,
            () => {}
          );
          if (isMountedRef.current) {
            setCurrentFacingMode(fallbackFacing);
            setAriaAnnouncement(`Kamera dialihkan menggunakan mode: ${fallbackFacing}`);
          }
        }
      } catch (err2: any) {
        console.error('Fallback kamera juga gagal:', err2);
        if (isMountedRef.current) {
          setCameraError(true);
          setCameraErrorMessage('Tidak dapat mengakses kamera yang dipilih. Periksa izin kamera browser Anda.');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setCameraLoading(false);
        setSwitchingCamera(false);
        switchingRef.current = false;
      }
    }
  };

  // Toggle beralih antara kamera depan & belakang
  const handleSwitchCamera = async () => {
    if (switchingRef.current || cameraLoading) return;

    if (cameras.length > 1) {
      const currentIdx = cameras.findIndex(c => c.id === selectedCameraId);
      const nextIdx = (currentIdx + 1) % cameras.length;
      const nextCam = cameras[nextIdx];
      if (nextCam) {
        await activateCamera(nextCam.id, nextIdx);
      }
    } else {
      // Toggle facing mode jika hanya 1 entri device terdaftar namun perangkat mendukung switch
      const newFacing = currentFacingMode === 'environment' ? 'user' : 'environment';
      try {
        switchingRef.current = true;
        setSwitchingCamera(true);
        setCameraLoading(true);

        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }

        await new Promise(r => setTimeout(r, 150));

        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(scannerId);
        }

        await html5QrCodeRef.current.start(
          { facingMode: newFacing },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0
          },
          handleDecodedText,
          () => {}
        );

        setCurrentFacingMode(newFacing);
        setAriaAnnouncement(`Kamera dialihkan ke ${newFacing === 'user' ? 'Kamera Depan' : 'Kamera Belakang'}`);
      } catch (err: any) {
        console.warn('Gagal toggle facingMode:', err);
        setCameraError(true);
        setCameraErrorMessage('Gagal beralih mode kamera.');
      } finally {
        setCameraLoading(false);
        setSwitchingCamera(false);
        switchingRef.current = false;
      }
    }
  };

  // Inisialisasi awal pemindai
  const startInitialScanner = async () => {
    try {
      setCameraLoading(true);
      setCameraError(false);
      setCameraErrorMessage('');

      let detectedDevices: CameraDevice[] = [];
      try {
        detectedDevices = await Html5Qrcode.getCameras();
      } catch (e) {
        console.warn('Pengecekan getCameras awal:', e);
      }

      if (!isMountedRef.current) return;

      const scanner = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = scanner;

      // Prioritaskan kamera belakang (environment) untuk kemudahan memindai QR
      let targetCameraId: string | null = null;
      if (detectedDevices && detectedDevices.length > 0) {
        setCameras(detectedDevices);
        const backCamera = detectedDevices.find(d => 
          /back|rear|belakang|environment|facing back/i.test(d.label)
        );
        targetCameraId = backCamera ? backCamera.id : detectedDevices[0].id;
      }

      const cameraConfig = targetCameraId ? targetCameraId : { facingMode: 'environment' };

      await scanner.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0
        },
        handleDecodedText,
        () => {}
      );

      if (targetCameraId && isMountedRef.current) {
        setSelectedCameraId(targetCameraId);
      }

      // Ambil kembali daftar kamera setelah izin disetujui (label kamera akan terisi lengkap)
      try {
        const refreshedDevices = await Html5Qrcode.getCameras();
        if (refreshedDevices && refreshedDevices.length > 0 && isMountedRef.current) {
          setCameras(refreshedDevices);
          if (!targetCameraId) {
            const backCam = refreshedDevices.find(d => 
              /back|rear|belakang|environment/i.test(d.label)
            );
            setSelectedCameraId(backCam ? backCam.id : refreshedDevices[0].id);
          }
        }
      } catch {}

      if (isMountedRef.current) {
        setCameraLoading(false);
        setAriaAnnouncement('Kamera pemindai aktif. Arahkan ke kode QR peserta.');
      }
    } catch (err: any) {
      console.warn('Gagal mengaktifkan kamera awal:', err);
      if (isMountedRef.current) {
        setCameraError(true);
        setCameraErrorMessage('Izin kamera belum diberikan atau kamera tidak terdeteksi pada perangkat ini.');
        setCameraLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(() => {
      startInitialScanner();
    }, 150);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current
              .stop()
              .then(() => html5QrCodeRef.current?.clear())
              .catch(() => {});
          } else {
            html5QrCodeRef.current.clear();
          }
        } catch {}
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    const clean = manualId.trim().toUpperCase();
    onSubmitScan(clean);
    setManualId('');
  };

  const hasMultipleCameras = cameras.length > 1;

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Live Region untuk Aksesibilitas Pembaca Layar (Screen Reader) */}
      <div className="sr-only" aria-live="polite" role="status">
        {ariaAnnouncement}
      </div>

      {/* Header Pemindai */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 font-heading flex items-center gap-2">
            Pemindai {
              scanMode === 'registrasi_ulang'
                ? 'Registrasi Ulang'
                : scanMode === 'berangkat'
                ? 'Keberangkatan'
                : scanMode === 'pulang_dari_lokasi' || scanMode === 'pulang'
                ? 'Kepulangan dari Lokasi'
                : 'Tiba di Rumah'
            }
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              Panitia
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Arahkan kamera ke kartu QR peserta untuk pencatatan otomatis
          </p>
        </div>

        {onKembali && (
          <button
            type="button"
            id="btn-kembali-scanner"
            onClick={onKembali}
            aria-label="Kembali ke menu panitia"
            className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-bold transition cursor-pointer min-h-[40px] focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </button>
        )}
      </div>

      {/* Kontrol Kamera & Aksesibilitas Kamera Depan/Belakang */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Status Kamera Aktif */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">
                {currentCameraName}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {hasMultipleCameras 
                ? `${cameras.length} kamera terdeteksi di perangkat` 
                : '1 kamera terdeteksi'}
            </span>
          </div>
        </div>

        {/* Tombol Switch Kamera (Ganti Depan/Belakang) */}
        {hasMultipleCameras && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-switch-camera"
              onClick={handleSwitchCamera}
              disabled={switchingCamera || cameraLoading}
              aria-label={isCurrentFront ? 'Beralih ke Kamera Belakang' : 'Beralih ke Kamera Depan'}
              title={isCurrentFront ? 'Beralih ke Kamera Belakang' : 'Beralih ke Kamera Depan'}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs border border-slate-700 transition cursor-pointer disabled:opacity-50 min-h-[44px] focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
            >
              <SwitchCamera className={`w-4 h-4 text-emerald-400 ${switchingCamera ? 'animate-spin' : ''}`} />
              <span>{isCurrentFront ? 'Ganti ke Kamera Belakang' : 'Ganti ke Kamera Depan'}</span>
            </button>

            {/* Dropdown Spesifik jika ada lebih dari 2 kamera (Multi-lensa) */}
            {cameras.length > 2 && (
              <div className="relative">
                <select
                  id="select-camera-lens"
                  aria-label="Pilih lensa kamera"
                  value={selectedCameraId}
                  onChange={(e) => {
                    const idx = cameras.findIndex(c => c.id === e.target.value);
                    if (idx !== -1) activateCamera(e.target.value, idx);
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-2 font-medium min-h-[44px] focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  {cameras.map((cam, idx) => (
                    <option key={cam.id || idx} value={cam.id}>
                      {getCameraFriendlyLabel(cam, idx)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Frame Viewport Pemindai Kamera */}
      <div className="bg-slate-950 rounded-3xl overflow-hidden relative shadow-xl aspect-square flex items-center justify-center border border-slate-800">
        
        {/* Kontainer Library html5-qrcode */}
        <div id={scannerId} className="w-full h-full" />

        {/* Overlay Target Pemindaian (Aksentuasi Visual) */}
        {!cameraLoading && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-5">
            <div className="w-[220px] h-[220px] border-2 border-emerald-400/80 rounded-2xl relative shadow-lg">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              <div className="h-0.5 w-full bg-emerald-400/80 absolute top-1/2 -translate-y-1/2 animate-pulse" />
            </div>
          </div>
        )}

        {/* Tombol Cepat Switch Kamera Melayang di Atas Video (Float) */}
        {hasMultipleCameras && !cameraLoading && !cameraError && (
          <button
            type="button"
            id="btn-switch-camera-floating"
            onClick={handleSwitchCamera}
            disabled={switchingCamera}
            aria-label={isCurrentFront ? 'Beralih ke Kamera Belakang' : 'Beralih ke Kamera Depan'}
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 text-xs font-bold transition active:scale-95 shadow-lg min-h-[44px] cursor-pointer"
          >
            <SwitchCamera className={`w-4 h-4 text-emerald-400 ${switchingCamera ? 'animate-spin' : ''}`} />
            <span className="text-[11px]">{isCurrentFront ? 'Belakang' : 'Depan'}</span>
          </button>
        )}

        {/* Indikator Loading / Transisi Beralih Kamera */}
        {(cameraLoading || switchingCamera) && !cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-15">
            <RefreshCw className="animate-spin h-8 w-8 text-emerald-400" />
            <div className="text-xs font-medium text-slate-200">
              {switchingCamera ? 'Beralih kamera...' : 'Menghubungkan ke sensor kamera...'}
            </div>
            <div className="text-[11px] text-slate-400">
              Mohon izinkan akses kamera jika muncul permintaan browser
            </div>
          </div>
        )}

        {/* Tampilan Error Kamera */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-15">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">Kamera Tidak Dapat Diakses</div>
            <div className="text-xs text-slate-400 max-w-xs leading-relaxed">
              {cameraErrorMessage || 'Pastikan izin kamera telah disetujui di pengaturan browser Anda.'}
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                id="btn-coba-lagi-kamera"
                onClick={startInitialScanner}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer min-h-[40px]"
              >
                Coba Hubungkan Ulang
              </button>
              {hasMultipleCameras && (
                <button
                  type="button"
                  id="btn-coba-kamera-lain"
                  onClick={handleSwitchCamera}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer min-h-[40px]"
                >
                  Coba Kamera Lain
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Terakhir Terpindai Notifikasi Ringan */}
      {lastScanned && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <span className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Terakhir dipindai: {lastScanned}
          </span>
          <span className="text-[11px] text-emerald-600">Berhasil</span>
        </div>
      )}

      {/* Input Manual ID Peserta (Alternatif jika QR Rusak / HP Gelap) */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
        <label htmlFor="input-manual-id" className="block text-xs font-bold text-slate-700">
          Input ID Peserta Manual (Bila QR Bermasalah / Layar Redup)
        </label>
        <form onSubmit={handleManualSubmit} className="flex space-x-2">
          <input
            id="input-manual-id"
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="PASK-XXXX"
            className="flex-1 bg-white border border-slate-300 text-slate-800 p-2.5 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-red-500 focus:outline-hidden"
          />
          <button
            type="submit"
            id="btn-verifikasi-manual"
            disabled={loading || !manualId.trim()}
            className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white px-4 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer min-h-[40px] focus:ring-2 focus:ring-slate-500 focus:outline-hidden"
          >
            {loading ? '...' : 'Verifikasi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QrScanner;
