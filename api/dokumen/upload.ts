import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { prisma } from '../../lib/prisma.js';
import { getSession } from '../../lib/api/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Validasi hak akses: Hanya panitia yang diizinkan mengunggah dokumen
  const session = await getSession(req, 'panitia');
  if (!session || (session as any).role !== 'panitia') {
    return res.status(401).json({ error: 'Hanya panitia yang berwenang mengunggah dokumen.' });
  }

  const body = req.body as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req as any,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 8 * 1024 * 1024, // 8MB limit
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || '{}');

        // Validasi keamanan: Pastikan idPeserta benar-benar terdaftar di database untuk dokumen personal
        if (payload.scope === 'PERSONAL') {
          if (!payload.idPeserta) {
            throw new Error('ID Peserta wajib diisi untuk dokumen personal.');
          }

          const peserta = await prisma.peserta.findUnique({
            where: { idPeserta: payload.idPeserta },
          });

          if (!peserta) {
            throw new Error(`ID Peserta "${payload.idPeserta}" tidak ditemukan dalam database.`);
          }
        }

        // Catatan: PutBlobResult di @vercel/blob 2.8.0 tidak memiliki properti blob.size
        // ukuranByte diambil secara aman dari payload.ukuranByte yang dikirim klien
        await prisma.dokumen.create({
          data: {
            judul: payload.judul || 'Dokumen PDF',
            scope: payload.scope === 'PERSONAL' ? 'PERSONAL' : 'GLOBAL',
            idPeserta: payload.scope === 'PERSONAL' ? payload.idPeserta : null,
            blobUrl: blob.url,
            blobDownloadUrl: blob.downloadUrl || blob.url,
            blobPathname: blob.pathname,
            ukuranByte: typeof payload.ukuranByte === 'number' ? payload.ukuranByte : null,
            diunggahOleh: payload.username || (session as any).role || 'panitia',
          },
        });
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('Upload dokumen error:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
}
