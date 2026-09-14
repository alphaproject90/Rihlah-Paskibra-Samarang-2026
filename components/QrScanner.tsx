'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle } from 'lucide-react';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  fps?: number;
  qrbox?: number;
}

export function QrScanner({ onScanSuccess, fps = 10, qrbox = 250 }: QrScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const scannerRef = useRef<any>(null);
  const elementId = 'rihlah-qr-reader';

  useEffect(() => {
    let isMounted = true;

    async function initScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prioritaskan kamera belakang (environment) jika ada
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('belakang'));
          const chosenId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(chosenId);

          const scanner = new Html5Qrcode(elementId);
          scannerRef.current = scanner;

          await scanner.start(
            chosenId,
            {
              fps,
              qrbox: { width: qrbox, height: qrbox },
              aspectRatio: 1.0,
            },
            (decodedText: string) => {
              // Beep sound feedback
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
              } catch {
                // ignore audio context restriction
              }
              onScanSuccess(decodedText);
            },
            () => {
              // Ignore scan frame error (empty frame)
            }
          );

          if (isMounted) {
            setCameraActive(true);
            setCameraError(null);
          }
        } else {
          if (isMounted) setCameraError('Tidak ada kamera yang terdeteksi pada perangkat ini.');
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Kamera scanner error:', err);
          setCameraError(
            err?.message || 'Izin akses kamera ditolak atau kamera sedang digunakan aplikasi lain.'
          );
        }
      }
    }

    initScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              scannerRef.current.clear();
            });
          } else {
            scannerRef.current.clear();
          }
        } catch (e) {
          console.error('Error saat stop scanner:', e);
        }
      }
    };
  }, [fps, qrbox, onScanSuccess]);

  const switchCamera = async (newId: string) => {
    setSelectedCameraId(newId);
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      await scannerRef.current.start(
        newId,
        { fps, qrbox: { width: qrbox, height: qrbox } },
        (decodedText: string) => onScanSuccess(decodedText),
        () => {}
      );
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {cameraError ? (
        <div className="w-full p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold">Kamera Tidak Aktif</p>
            <p className="text-xs text-rose-300/80 mt-1">{cameraError}</p>
            <p className="text-xs text-slate-400 mt-2">
              Pastikan Anda mengizinkan akses kamera di peramban dan menggunakan koneksi HTTPS. Anda juga dapat memasukkan ID Peserta secara manual.
            </p>
          </div>
        </div>
      ) : null}

      {/* Container video scanner */}
      <div className="relative w-full max-w-sm aspect-square bg-slate-950 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-2xl flex items-center justify-center">
        <div id={elementId} className="w-full h-full" />
        {!cameraActive && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-900/90">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-xs font-medium">Memulai kamera scanner...</span>
          </div>
        )}
      </div>

      {/* Switch kamera selector */}
      {cameras.length > 1 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <Camera className="w-4 h-4 text-indigo-400" />
          <select
            value={selectedCameraId}
            onChange={(e) => switchCamera(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label || `Kamera ${c.id}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
