/**
 * ARCHITECTURE NOTE:
 * Endpoint hybrid statistik & kontrol pendaftaran:
 * - Method GET: Bersifat publik (read-only, tanpa session auth) untuk menyajikan rekapitulasi
 *   jumlah peserta, status presensi, dan status keterbukaan pendaftaran pada halaman utama.
 * - Method PUT: Bersifat terproteksi, memerlukan sesi panitia aktif (getSession(req, 'panitia'))
 *   untuk membuka atau menutup pendaftaran sistem secara persisten.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';
import { getSession } from '../lib/api/auth.js';
import { logSystem } from '../lib/logger.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ─── METHOD GET: Rekapitulasi Publik & Status Pendaftaran ─────────────────
  if (req.method === 'GET') {
    try {
      const [totalIkut, totalTidakIkut, totalBerangkat, totalPulang, pengaturan] = await Promise.all([
        prisma.peserta.count({ where: { partisipasi: 'Ikut', deletedAt: null } }),
        prisma.peserta.count({ where: { partisipasi: 'Tidak Ikut', deletedAt: null } }),
        prisma.peserta.count({ where: { waktuBerangkat: { not: null }, deletedAt: null } }),
        prisma.peserta.count({ where: { waktuPulang: { not: null }, deletedAt: null } }),
        prisma.pengaturan.findUnique({ where: { id: 'singleton' } }),
      ]);

      // Lazy default: Jika belum pernah di-upsert, pendaftaran dianggap terbuka (true)
      const pendaftaranDibuka = pengaturan?.pendaftaranDibuka ?? true;

      // Response shape konsisten — data dibungkus dalam key 'data'
      // sesuai yang diharapkan apiService.ts: json.data as StatsRihlah
      return res.status(200).json({
        success: true,
        data: {
          total: totalIkut,
          tidakIkut: totalTidakIkut,
          berangkat: totalBerangkat,
          pulang: totalPulang,
          ikut: totalIkut,
          sudahBerangkat: totalBerangkat,
          sudahPulang: totalPulang,
          pendaftaranDibuka,
        },
      });
    } catch (err) {
      console.error('Error saat getStatistik:', err);
      return res.status(500).json({ success: false, message: 'Gagal memuat statistik.' });
    }
  }

  // ─── METHOD PUT: Toggle Buka/Tutup Pendaftaran (Panitia Only) ──────────────
  if (req.method === 'PUT') {
    try {
      // 1. Verifikasi sesi panitia
      const session = await getSession(req, 'panitia');
      if (!session || (session as any).role !== 'panitia') {
        return res.status(401).json({
          success: false,
          error: 'Hanya panitia yang berwenang mengubah pengaturan.',
          message: 'Hanya panitia yang berwenang mengubah pengaturan.',
        });
      }

      // 2. Validasi body
      const { pendaftaranDibuka } = req.body || {};
      if (typeof pendaftaranDibuka !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Field pendaftaranDibuka wajib berupa boolean (true/false).',
          message: 'Field pendaftaranDibuka wajib berupa boolean (true/false).',
        });
      }

      // 3. Upsert baris singleton pengaturan
      const updated = await prisma.pengaturan.upsert({
        where: { id: 'singleton' },
        update: {
          pendaftaranDibuka,
          updatedOleh: (session as any).username || (session as any).role || 'panitia',
        },
        create: {
          id: 'singleton',
          pendaftaranDibuka,
          updatedOleh: (session as any).username || (session as any).role || 'panitia',
        },
      });

      // 4. Catat audit trail ke log sistem (fire-and-forget)
      logSystem({
        level: 'INFO',
        action: pendaftaranDibuka ? 'PENDAFTARAN_DIBUKA' : 'PENDAFTARAN_DITUTUP',
        actorId: (session as any).username || (session as any).role || 'panitia',
      });

      return res.status(200).json({
        success: true,
        data: {
          pendaftaranDibuka: updated.pendaftaranDibuka,
        },
        message: `Pendaftaran berhasil ${pendaftaranDibuka ? 'dibuka' : 'ditutup'}.`,
      });
    } catch (err) {
      console.error('Error saat updatePengaturan:', err);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan sistem.' });
    }
  }

  // Method selain GET dan PUT ditolak
  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

