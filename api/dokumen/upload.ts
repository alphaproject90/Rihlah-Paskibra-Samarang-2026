import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { prisma } from '../../lib/prisma.js';
import { getSession } from '../../lib/api/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = req.body as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req as any,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Cek sesi panitia atau peserta
        const panitiaSession = await getSession(req, 'panitia');
        const pesertaSession = await getSession(req, 'peserta');

        let uploaderRole: 'panitia' | 'peserta' | '' = '';
        let uploaderName = '';
        let uploaderPesertaId = '';

        if (panitiaSession && (panitiaSession as any).role === 'panitia') {
          uploaderRole = 'panitia';
          uploaderName = (panitiaSession as any).username || 'panitia';
        } else if (pesertaSession && (pesertaSession as any).role === 'peserta') {
          uploaderRole = 'peserta';
          uploaderPesertaId = (pesertaSession as any).idPeserta || '';
          uploaderName = (pesertaSession as any).nama || uploaderPesertaId || 'peserta';
        } else {
          throw new Error('Autentikasi sesi panitia atau peserta diperlukan untuk mengunggah dokumen.');
        }

        let parsedClient: Record<string, unknown> = {};
        try {
          parsedClient = JSON.parse(clientPayload || '{}');
        } catch {
          parsedClient = {};
        }

        // Konfigurasi hak akses berdasarkan role
        if (uploaderRole === 'peserta') {
          // Peserta hanya boleh mengunggah Surat Pernyataan Orang Tua (PDF/JPG/PNG maks 5MB)
          const tokenPayload = JSON.stringify({
            judul: 'Surat Pernyataan Orang Tua',
            scope: 'PERSONAL',
            idPeserta: uploaderPesertaId,
            uploaderRole: 'peserta',
            diunggahOleh: uploaderName,
            ukuranByte: parsedClient.ukuranByte,
          });

          return {
            allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
            maximumSizeInBytes: 5 * 1024 * 1024, // 5MB limit sesuai Tahap 4A
            tokenPayload,
          };
        }

        // Panitia boleh mengunggah dokumen PDF hingga 8MB
        parsedClient.uploaderRole = 'panitia';
        parsedClient.diunggahOleh = uploaderName;
        const tokenPayload = JSON.stringify(parsedClient);

        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 8 * 1024 * 1024, // 8MB limit
          tokenPayload,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || '{}');

        // Validasi keamanan dokumen personal
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

          // Pencegahan Storage Leak (Tahap 4A):
          // Jika upload Surat Pernyataan Orang Tua, hapus file fisik lama di Vercel Blob
          if (payload.uploaderRole === 'peserta' || payload.judul === 'Surat Pernyataan Orang Tua') {
            const existingDocs = await prisma.dokumen.findMany({
              where: {
                idPeserta: payload.idPeserta,
                scope: 'PERSONAL',
                judul: 'Surat Pernyataan Orang Tua',
              },
            });

            for (const doc of existingDocs) {
              if (doc.blobPathname) {
                try {
                  await del(doc.blobPathname);
                } catch (delError) {
                  console.warn('Gagal menghapus blob lama saat replace:', delError);
                }
              }
            }

            if (existingDocs.length > 0) {
              await prisma.dokumen.deleteMany({
                where: {
                  idPeserta: payload.idPeserta,
                  scope: 'PERSONAL',
                  judul: 'Surat Pernyataan Orang Tua',
                },
              });
            }
          }
        }

        await prisma.dokumen.create({
          data: {
            judul: payload.judul || 'Dokumen PDF',
            scope: payload.scope === 'PERSONAL' ? 'PERSONAL' : 'GLOBAL',
            idPeserta: payload.scope === 'PERSONAL' ? payload.idPeserta : null,
            blobUrl: blob.url,
            blobDownloadUrl: blob.downloadUrl || blob.url,
            blobPathname: blob.pathname,
            ukuranByte: typeof payload.ukuranByte === 'number' ? payload.ukuranByte : null,
            diunggahOleh: payload.diunggahOleh || 'sistem',
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
