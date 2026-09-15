import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';
import { getSession } from '../lib/api/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ success: false, status: 'error', error: 'Method not allowed', message: 'Method not allowed' });
    return;
  }

  try {
    // ⚠️ SECURITY FIX #2 (Tahap 1, dipertahankan): verifikasi sesi panitia sebelum memproses scan
    const session = await getSession(req, 'panitia');
    if (!session || (session as any).role !== 'panitia') {
      res.status(401).json({ success: false, status: 'error', error: 'Akses ditolak. Fitur scanner hanya dapat digunakan oleh Panitia.', message: 'Akses ditolak. Fitur scanner hanya dapat digunakan oleh Panitia.' });
      return;
    }

    const { id, idPeserta, mode } = req.body || {};
    const targetId = (id || idPeserta || '').toString().trim().toUpperCase();
    const scanMode = mode === 'pulang' ? 'pulang' : 'berangkat';

    if (!targetId) {
      res.status(400).json({ success: false, status: 'error', error: 'ID Peserta tidak boleh kosong.', message: 'ID Peserta tidak boleh kosong.' });
      return;
    }

    // Transaksi Prisma mencegah race condition scan bersamaan
    const result = await prisma.$transaction(async (tx) => {
      const peserta = await tx.peserta.findUnique({
        where: { idPeserta: targetId },
      });

      if (!peserta) {
        throw new Error('NOT_FOUND');
      }

      if (peserta.partisipasi !== 'Ikut') {
        throw new Error('STATUS_TIDAK_IKUT');
      }

      const now = new Date();
      const sesi = scanMode === 'berangkat' ? 'Keberangkatan' : 'Kepulangan';

      if (scanMode === 'berangkat') {
        if (peserta.waktuBerangkat) {
          throw new Error('ALREADY_SCANNED_BERANGKAT');
        }
        await tx.peserta.update({
          where: { id: peserta.id },
          data: { waktuBerangkat: now },
        });
      } else {
        if (peserta.waktuPulang) {
          throw new Error('ALREADY_SCANNED_PULANG');
        }
        await tx.peserta.update({
          where: { id: peserta.id },
          data: { waktuPulang: now },
        });
      }

      // Catat ke LogScan
      await tx.logScan.create({
        data: {
          idPeserta: peserta.idPeserta,
          nama: peserta.namaLengkap,
          keterangan: `Scan ${sesi}`,
          waktuScan: now,
        },
      });

      return { peserta, waktu: now };
    });

    res.status(200).json({
      success: true,
      status: 'success',
      nama: result.peserta.namaLengkap,
      idPeserta: result.peserta.idPeserta,
      mode: scanMode,
      message: `Presensi ${scanMode === 'berangkat' ? 'Keberangkatan' : 'Kepulangan'} ${result.peserta.namaLengkap} berhasil dicatat!`,
    });
  } catch (err: any) {
    if (err?.message === 'NOT_FOUND') {
      res.status(404).json({ success: false, status: 'error', error: 'ID Peserta tidak ditemukan dalam sistem.', message: 'ID Peserta tidak ditemukan dalam sistem.' });
      return;
    }
    if (err?.message === 'STATUS_TIDAK_IKUT') {
      res.status(422).json({ success: false, status: 'error', error: 'Peserta terdaftar dengan status TIDAK IKUT kegiatan.', message: 'Peserta terdaftar dengan status TIDAK IKUT kegiatan.' });
      return;
    }
    if (err?.message === 'ALREADY_SCANNED_BERANGKAT') {
      res.status(409).json({ success: false, status: 'error', error: 'Peserta sudah tercatat presensi Keberangkatan sebelumnya.', message: 'Peserta sudah tercatat presensi Keberangkatan sebelumnya.' });
      return;
    }
    if (err?.message === 'ALREADY_SCANNED_PULANG') {
      res.status(409).json({ success: false, status: 'error', error: 'Peserta sudah tercatat presensi Kepulangan sebelumnya.', message: 'Peserta sudah tercatat presensi Kepulangan sebelumnya.' });
      return;
    }

    console.error('Error saat proses scan presensi:', err);
    res.status(500).json({ success: false, status: 'error', error: 'Gagal memproses presensi scan.', message: 'Gagal memproses presensi scan.' });
  }
}
