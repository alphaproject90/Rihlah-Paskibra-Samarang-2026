import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';
import { getSession } from '../lib/api/auth.js';
import { logSystem } from '../lib/logger.js';
import { isAdminMobil, getMobilFromSession } from '../lib/auth/roles.js';

type ScanMode = 'registrasi_ulang' | 'berangkat' | 'pulang_dari_lokasi' | 'tiba_di_rumah';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ success: false, status: 'error', error: 'Method not allowed', message: 'Method not allowed' });
    return;
  }

  let targetId = '';
  let scanMode: ScanMode = 'berangkat';

  try {
    // Verifikasi sesi panitia sebelum memproses scan
    const session = await getSession(req, 'panitia');
    if (!session || (session as any).role !== 'panitia') {
      res.status(401).json({ success: false, status: 'error', error: 'Akses ditolak. Fitur scanner hanya dapat digunakan oleh Panitia.', message: 'Akses ditolak. Fitur scanner hanya dapat digunakan oleh Panitia.' });
      return;
    }

    const { id, idPeserta, mode } = req.body || {};
    targetId = (id || idPeserta || '').toString().trim().toUpperCase();

    // Normalisasi mode: 4 tahap berurutan (dengan alias backward-compat 'pulang')
    if (mode === 'pulang' || mode === 'pulang_dari_lokasi') scanMode = 'pulang_dari_lokasi';
    else if (mode === 'tiba_di_rumah') scanMode = 'tiba_di_rumah';
    else if (mode === 'registrasi_ulang') scanMode = 'registrasi_ulang';
    else scanMode = 'berangkat';

    if (!targetId) {
      res.status(400).json({ success: false, status: 'error', error: 'ID Peserta tidak boleh kosong.', message: 'ID Peserta tidak boleh kosong.' });
      return;
    }

    // Transaksi Prisma mencegah race condition scan bersamaan
    const result = await prisma.$transaction(async (tx) => {
      const peserta = await tx.peserta.findUnique({
        where: { idPeserta: targetId },
      });

      if (!peserta || peserta.deletedAt) {
        throw new Error('NOT_FOUND');
      }

      if (peserta.partisipasi !== 'Ikut') {
        throw new Error('STATUS_TIDAK_IKUT');
      }

      // ─── FILTER MOBIL — khusus ADMIN_MOBIL (Tahap 2) ───────────────────────
      // Token lama (tanpa panitiaRole) diperlakukan sebagai SUPER_ADMIN — tidak ada filter.
      // SUPER_ADMIN bisa scan peserta dari mobil mana pun.
      // ADMIN_MOBIL hanya bisa scan peserta yang mobilnya sama dengan mobilnya sendiri.
      // Peserta dengan mobil = null → hanya SUPER_ADMIN yang boleh scan (by design:
      //   assign mobil peserta dulu sebelum hari-H via tab Data & Rekap).
      if (isAdminMobil(session)) {
        const mobilSession = getMobilFromSession(session);
        if (!peserta.mobil || peserta.mobil !== mobilSession) {
          throw new Error('MOBIL_MISMATCH');
        }
      }

      const now = new Date();

      // ─── TAHAP 1: REGISTRASI ULANG ─────────────────────────────────────────
      // Hanya catat LogScan, TIDAK ubah waktuBerangkat / waktuPulang.
      if (scanMode === 'registrasi_ulang') {
        await tx.logScan.create({
          data: {
            idPeserta: peserta.idPeserta,
            nama: peserta.namaLengkap,
            keterangan: 'Registrasi Ulang',
            waktuScan: now,
          },
        });
        return { peserta, waktu: now, mode: 'registrasi_ulang' as const };
      }

      // ─── TAHAP 2: KEBERANGKATAN ─────────────────────────────────────────────
      if (scanMode === 'berangkat') {
        if (peserta.waktuBerangkat) {
          throw new Error('ALREADY_SCANNED_BERANGKAT');
        }
        await tx.peserta.update({
          where: { id: peserta.id },
          data: { waktuBerangkat: now },
        });
        await tx.logScan.create({
          data: {
            idPeserta: peserta.idPeserta,
            nama: peserta.namaLengkap,
            keterangan: 'Scan Keberangkatan',
            waktuScan: now,
          },
        });
        return { peserta, waktu: now, mode: 'berangkat' as const };
      }

      // ─── TAHAP 3: KEPULANGAN DARI LOKASI ────────────────────────────────────
      if (scanMode === 'pulang_dari_lokasi') {
        // Validasi urutan: tidak boleh pulang jika belum scan berangkat
        if (!peserta.waktuBerangkat) {
          throw new Error('NOT_SCANNED_BERANGKAT');
        }
        if (peserta.waktuPulang) {
          throw new Error('ALREADY_SCANNED_PULANG');
        }
        await tx.peserta.update({
          where: { id: peserta.id },
          data: { waktuPulang: now },
        });
        await tx.logScan.create({
          data: {
            idPeserta: peserta.idPeserta,
            nama: peserta.namaLengkap,
            keterangan: 'Scan Kepulangan dari Lokasi',
            waktuScan: now,
          },
        });
        return { peserta, waktu: now, mode: 'pulang_dari_lokasi' as const };
      }

      // ─── TAHAP 4: TIBA DI RUMAH ─────────────────────────────────────────────
      if (scanMode === 'tiba_di_rumah') {
        // Validasi urutan: tidak boleh tiba di rumah jika belum scan kepulangan
        if (!peserta.waktuPulang) {
          throw new Error('NOT_SCANNED_PULANG');
        }
        // Cek duplikasi tiba di rumah
        const existingTiba = await tx.logScan.findFirst({
          where: {
            idPeserta: peserta.idPeserta,
            keterangan: 'Scan Tiba di Rumah',
          },
        });
        if (existingTiba) {
          throw new Error('ALREADY_SCANNED_TIBA');
        }
        await tx.logScan.create({
          data: {
            idPeserta: peserta.idPeserta,
            nama: peserta.namaLengkap,
            keterangan: 'Scan Tiba di Rumah',
            waktuScan: now,
          },
        });
        return { peserta, waktu: now, mode: 'tiba_di_rumah' as const };
      }

      throw new Error('INVALID_MODE');
    });

    const labelMode: Record<ScanMode, string> = {
      registrasi_ulang: 'Registrasi Ulang',
      berangkat: 'Keberangkatan',
      pulang_dari_lokasi: 'Kepulangan dari Lokasi',
      tiba_di_rumah: 'Tiba di Rumah',
    };
    const pesanMode = labelMode[result.mode] || 'Presensi';

    res.status(200).json({
      success: true,
      status: 'success',
      nama: result.peserta.namaLengkap,
      idPeserta: result.peserta.idPeserta,
      mode: result.mode,
      message: `Presensi ${pesanMode} ${result.peserta.namaLengkap} berhasil dicatat!`,
    });
  } catch (err: any) {
    if (err?.message === 'NOT_FOUND') {
      logSystem({
        level: 'WARN',
        action: 'SCAN_INVALID_ID',
        details: { targetId, mode: scanMode },
        actorId: 'panitia',
      });
      res.status(404).json({ success: false, status: 'error', error: 'ID Peserta tidak ditemukan dalam sistem.', message: 'ID Peserta tidak ditemukan dalam sistem.' });
      return;
    }
    if (err?.message === 'STATUS_TIDAK_IKUT') {
      res.status(422).json({ success: false, status: 'error', error: 'Peserta terdaftar dengan status TIDAK IKUT kegiatan.', message: 'Peserta terdaftar dengan status TIDAK IKUT kegiatan.' });
      return;
    }
    if (err?.message === 'MOBIL_MISMATCH') {
      logSystem({
        level: 'WARN',
        action: 'SCAN_MOBIL_MISMATCH',
        details: { targetId, mode: scanMode },
        actorId: 'panitia',
      });
      res.status(403).json({ success: false, status: 'error', error: 'Akses ditolak: Peserta ini bukan bagian dari mobil Anda.', message: 'Akses ditolak: Peserta ini bukan bagian dari mobil Anda.' });
      return;
    }
    if (err?.message === 'NOT_SCANNED_BERANGKAT') {
      res.status(422).json({
        success: false,
        status: 'error',
        error: 'Presensi Kepulangan ditolak: Peserta belum tercatat presensi Keberangkatan.',
        message: 'Presensi Kepulangan ditolak: Peserta belum tercatat presensi Keberangkatan.',
      });
      return;
    }
    if (err?.message === 'NOT_SCANNED_PULANG') {
      res.status(422).json({
        success: false,
        status: 'error',
        error: 'Presensi Tiba di Rumah ditolak: Peserta belum tercatat presensi Kepulangan dari Lokasi.',
        message: 'Presensi Tiba di Rumah ditolak: Peserta belum tercatat presensi Kepulangan dari Lokasi.',
      });
      return;
    }
    if (err?.message === 'ALREADY_SCANNED_BERANGKAT') {
      logSystem({
        level: 'INFO',
        action: 'SCAN_DUPLICATE',
        details: { targetId, mode: scanMode },
        actorId: 'panitia',
      });
      res.status(409).json({ success: false, status: 'error', error: 'Peserta sudah tercatat presensi Keberangkatan sebelumnya.', message: 'Peserta sudah tercatat presensi Keberangkatan sebelumnya.' });
      return;
    }
    if (err?.message === 'ALREADY_SCANNED_PULANG') {
      logSystem({
        level: 'INFO',
        action: 'SCAN_DUPLICATE',
        details: { targetId, mode: scanMode },
        actorId: 'panitia',
      });
      res.status(409).json({ success: false, status: 'error', error: 'Peserta sudah tercatat presensi Kepulangan dari Lokasi sebelumnya.', message: 'Peserta sudah tercatat presensi Kepulangan dari Lokasi sebelumnya.' });
      return;
    }
    if (err?.message === 'ALREADY_SCANNED_TIBA') {
      logSystem({
        level: 'INFO',
        action: 'SCAN_DUPLICATE',
        details: { targetId, mode: scanMode },
        actorId: 'panitia',
      });
      res.status(409).json({ success: false, status: 'error', error: 'Peserta sudah tercatat presensi Tiba di Rumah sebelumnya.', message: 'Peserta sudah tercatat presensi Tiba di Rumah sebelumnya.' });
      return;
    }

    console.error('Error saat proses scan presensi:', err);
    res.status(500).json({ success: false, status: 'error', error: 'Gagal memproses presensi scan.', message: 'Gagal memproses presensi scan.' });
  }
}
