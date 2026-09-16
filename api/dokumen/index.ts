import type { VercelRequest, VercelResponse } from '@vercel/node';
import { del } from '@vercel/blob';
import { prisma } from '../../lib/prisma.js';
import { getSession } from '../../lib/api/auth.js';
import { logSystem } from '../../lib/logger.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ─── METHOD GET: List Dokumen (Role-aware) ──────────────────────────────────
  if (req.method === 'GET') {
    try {
      // 1. Coba verifikasi sesi panitia
      const panitiaSession = await getSession(req, 'panitia');
      if (panitiaSession && (panitiaSession as any).role === 'panitia') {
        const semuaDokumen = await prisma.dokumen.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            peserta: {
              select: {
                namaLengkap: true,
                asalSekolah: true,
              },
            },
          },
        });
        return res.status(200).json({ success: true, data: semuaDokumen });
      }

      // 2. Coba verifikasi sesi peserta
      const pesertaSession = await getSession(req, 'peserta');
      if (pesertaSession && (pesertaSession as any).role === 'peserta') {
        const idPesertaAktif = (pesertaSession as any).idPeserta;
        if (!idPesertaAktif) {
          return res.status(401).json({ error: 'Sesi peserta tidak valid.' });
        }

        // Hanya ambil dokumen GLOBAL atau dokumen PERSONAL milik peserta aktif ini
        const dokumenPeserta = await prisma.dokumen.findMany({
          where: {
            OR: [
              { scope: 'GLOBAL' },
              {
                scope: 'PERSONAL',
                idPeserta: idPesertaAktif,
              },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json({ success: true, data: dokumenPeserta });
      }

      // 3. Tidak ada sesi yang valid
      return res.status(401).json({ error: 'Autentikasi diperlukan untuk mengakses dokumen.' });
    } catch (error) {
      console.error('Error saat memuat daftar dokumen:', error);
      return res.status(500).json({ error: 'Gagal memuat daftar dokumen.' });
    }
  }

  // ─── METHOD DELETE: Hapus Dokumen (Panitia Only) ───────────────────────────
  if (req.method === 'DELETE') {
    const panitiaSession = await getSession(req, 'panitia');
    if (!panitiaSession || (panitiaSession as any).role !== 'panitia') {
      return res.status(401).json({ error: 'Hanya panitia yang berwenang menghapus dokumen.' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID dokumen wajib disertakan.' });
    }

    try {
      // 1. Ambil record dari database untuk mendapatkan blobPathname
      const dokumen = await prisma.dokumen.findUnique({
        where: { id },
      });

      if (!dokumen) {
        return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
      }

      // 2. Hapus file fisik dari Vercel Blob store
      if (dokumen.blobPathname) {
        try {
          await del(dokumen.blobPathname);
        } catch (blobError) {
          // Jika del() gagal, tetap lanjutkan hapus baris database tapi catat ke SystemLog
          console.warn('Gagal menghapus blob fisik Vercel Blob, melanjutkan hapus data DB:', blobError);
          logSystem({
            level: 'WARN',
            action: 'BLOB_DELETE_FAILED',
            actorId: (panitiaSession as any).role || 'panitia',
            details: {
              dokumenId: id,
              blobPathname: dokumen.blobPathname,
              error: (blobError as Error).message,
            },
          });
        }
      }

      // 3. Hapus baris dokumen dari database
      await prisma.dokumen.delete({
        where: { id },
      });

      logSystem({
        level: 'INFO',
        action: 'DOKUMEN_DELETED',
        actorId: (panitiaSession as any).role || 'panitia',
        details: {
          id,
          judul: dokumen.judul,
          scope: dokumen.scope,
          idPeserta: dokumen.idPeserta,
        },
      });

      return res.status(200).json({ success: true, message: 'Dokumen berhasil dihapus.' });
    } catch (error) {
      console.error('Error saat menghapus dokumen:', error);
      return res.status(500).json({ error: 'Gagal menghapus dokumen dari sistem.' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
