/**
 * ARCHITECTURE NOTE / KNOWN LIMITATION:
 * Endpoint ini mengembalikan seluruh data peserta (termasuk waPribadi, waDarurat, riwayatMedis)
 * secara unpaginated khusus untuk sesi panitia yang valid. Cocok untuk skala kegiatan sekolah saat ini (<500 peserta).
 * Jika volume peserta bertambah signifikan di event mendatang, terapkan limit/offset pagination atau search filter.
 *
 * ROUTING (Tahap 1):
 * - GET  /api/peserta                   → list data peserta (semua panitia)
 * - GET  /api/peserta?resource=panitia  → list akun panitia (Super Admin only)
 * - POST /api/peserta?resource=panitia  → buat akun panitia baru (Super Admin only)
 *
 * Penggabungan CRUD akun panitia ke sini untuk menjaga jumlah serverless function
 * tetap di batas Vercel Hobby plan (12 function).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { getSession } from '../../lib/api/auth.js';
import { isSuperAdmin, isAdminMobil, getMobilFromSession } from '../../lib/auth/roles.js';
import { logSystem } from '../../lib/logger.js';
import {
  BuatAkunPanitiaSchema,
  BuatKegiatanSchema,
  AbsenKegiatanSchema,
} from '../../lib/validation/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const resource = req.query.resource;

  // ─────────────────────────────────────────────────────────────────────────
  // ROUTE: /api/peserta?resource=publik (Rewrite dari /api/peserta/publik)
  // Endpoint Publik (Tanpa Autentikasi) — Aman Non-PII (Tahap 5A)
  // ─────────────────────────────────────────────────────────────────────────
  if (resource === 'publik') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
      const sekolah = typeof req.query.sekolah === 'string' ? req.query.sekolah.trim() : '';
      const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

      const whereClause: Record<string, any> = {
        deletedAt: null,
      };

      if (sekolah && sekolah !== 'semua') {
        whereClause.asalSekolah = sekolah;
      }

      if (status === 'ikut') {
        whereClause.partisipasi = 'Ikut';
      } else if (status === 'tidak_ikut') {
        whereClause.partisipasi = 'Tidak Ikut';
      } else if (status === 'berangkat') {
        whereClause.partisipasi = 'Ikut';
        whereClause.waktuBerangkat = { not: null };
      } else if (status === 'pulang') {
        whereClause.partisipasi = 'Ikut';
        whereClause.waktuPulang = { not: null };
      }

      const pesertaPublik = await prisma.peserta.findMany({
        where: whereClause,
        select: {
          id: true,
          namaLengkap: true,
          asalSekolah: true,
          partisipasi: true,
          waktuBerangkat: true,
          waktuPulang: true,
        },
        orderBy: { namaLengkap: 'asc' },
        take: 500,
      });

      const sanitized = pesertaPublik.map((p, idx) => ({
        no: idx + 1,
        nama: p.namaLengkap,
        unit: p.asalSekolah,
        partisipasi: p.partisipasi,
        sudahBerangkat: Boolean(p.waktuBerangkat),
        sudahPulang: Boolean(p.waktuPulang),
      }));

      return res.status(200).json({ success: true, data: sanitized });
    } catch (error) {
      console.error('Error in publik peserta endpoint:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ROUTE: /api/peserta?resource=bukti_pendaftaran (Rewrite dari /api/peserta/bukti-pendaftaran)
  // Endpoint Bukti Pendaftaran Resmi (Autentikasi Sesi Peserta) (Tahap 5B)
  // ─────────────────────────────────────────────────────────────────────────
  if (resource === 'bukti_pendaftaran') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const pesertaSession = await getSession(req, 'peserta');
    if (!pesertaSession || (pesertaSession as any).role !== 'peserta') {
      return res.status(401).json({ error: 'Unauthorized: Sesi peserta diperlukan untuk mengakses bukti pendaftaran.' });
    }

    const idPeserta = (pesertaSession as any).idPeserta;
    if (!idPeserta) {
      return res.status(400).json({ error: 'ID Peserta tidak valid dalam sesi.' });
    }

    try {
      const peserta = await prisma.peserta.findFirst({
        where: { idPeserta, deletedAt: null },
        select: {
          id: true,
          idPeserta: true,
          namaLengkap: true,
          jenisKelamin: true,
          asalSekolah: true,
          partisipasi: true,
          mobil: true,
          waPribadi: true,
          createdAt: true,
        },
      });

      if (!peserta) {
        return res.status(404).json({ error: 'Data peserta tidak ditemukan atau telah dinonaktifkan.' });
      }

      const generatedAt = new Date().toISOString();
      const verificationCode = `VERIF-${Buffer.from(`${peserta.idPeserta}:${generatedAt}`).toString('base64').substring(0, 12).toUpperCase()}`;

      return res.status(200).json({
        success: true,
        data: {
          id: peserta.id,
          idPeserta: peserta.idPeserta,
          nama: peserta.namaLengkap,
          jk: peserta.jenisKelamin,
          unit: peserta.asalSekolah,
          partisipasi: peserta.partisipasi,
          mobil: peserta.mobil,
          tanggalDaftar: peserta.createdAt,
          generatedAt,
          officialIssuedAt: generatedAt,
          verificationCode,
          qrPayload: `${peserta.idPeserta}|${peserta.namaLengkap}|${verificationCode}`,
          panitiaContact: '0813-1383-1490',
        },
      });
    } catch (error) {
      console.error('Error in bukti pendaftaran endpoint:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Verifikasi sesi panitia sebelum memberikan akses data
  const session = await getSession(req, 'panitia');
  if (!session || (session as { role?: string }).role !== 'panitia') {
    return res.status(401).json({ error: 'Unauthorized: Sesi panitia tidak valid' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ROUTE: /api/peserta?resource=panitia — manajemen akun panitia (Tahap 1)
  // Hanya SUPER_ADMIN yang boleh mengakses route ini.
  // ─────────────────────────────────────────────────────────────────────────
  if (resource === 'panitia') {
    if (!isSuperAdmin(session)) {
      return res.status(403).json({ error: 'Forbidden: Hanya Super Admin yang dapat mengelola akun panitia.' });
    }

    // GET ?resource=panitia — ambil semua akun panitia
    if (req.method === 'GET') {
      try {
        const daftarAkun = await prisma.panitia.findMany({
          select: {
            id: true,
            username: true,
            namaLengkap: true,
            role: true,
            mobil: true,
            aktif: true,
            createdBy: true,
            createdAt: true,
            updatedAt: true,
            // passwordHash TIDAK di-expose — sengaja dihilangkan dari select
          },
          orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        });
        return res.status(200).json({ success: true, data: daftarAkun });
      } catch (error) {
        console.error('Error fetching panitia accounts:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    // POST ?resource=panitia — buat akun panitia baru
    if (req.method === 'POST') {
      const parseResult = BuatAkunPanitiaSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors[0]?.message || 'Data akun tidak valid';
        return res.status(400).json({ error: errorMsg });
      }

      const { namaLengkap, username, password, role, mobil } = parseResult.data;

      try {
        // Cek duplikat username
        const existing = await prisma.panitia.findUnique({ where: { username } });
        if (existing) {
          return res.status(409).json({ error: `Username "${username}" sudah digunakan oleh akun lain.` });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // Baca username pembuat dari session payload
        const creatorUsername = (session as any).username ?? null;

        const akun = await prisma.panitia.create({
          data: {
            username,
            passwordHash,
            namaLengkap,
            role,
            mobil: mobil ?? null,
            aktif: true,
            createdBy: creatorUsername,
          },
          select: {
            id: true,
            username: true,
            namaLengkap: true,
            role: true,
            mobil: true,
            aktif: true,
            createdBy: true,
            createdAt: true,
          },
        });

        return res.status(201).json({ success: true, data: akun });
      } catch (error) {
        console.error('Error creating panitia account:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ROUTE: /api/peserta?resource=kegiatan — manajemen sesi kegiatan (Tahap 3)
  // GET: Semua panitia boleh melihat daftar kegiatan
  // POST/PATCH/DELETE: Hanya SUPER_ADMIN
  // ─────────────────────────────────────────────────────────────────────────
  if (resource === 'kegiatan') {
    // GET ?resource=kegiatan — ambil daftar semua kegiatan
    if (req.method === 'GET') {
      try {
        const daftarKegiatan = await prisma.kegiatan.findMany({
          include: {
            _count: {
              select: { absen: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: daftarKegiatan });
      } catch (error) {
        console.error('Error fetching kegiatan list:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    // Hanya Super Admin yang boleh menambah, mengubah, atau menghapus kegiatan
    if (!isSuperAdmin(session)) {
      return res.status(403).json({ error: 'Forbidden: Hanya Super Admin yang dapat mengelola sesi kegiatan.' });
    }

    // POST ?resource=kegiatan — buat sesi kegiatan baru
    if (req.method === 'POST') {
      const parseResult = BuatKegiatanSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors[0]?.message || 'Data kegiatan tidak valid';
        return res.status(400).json({ error: errorMsg });
      }

      const { nama, deskripsi } = parseResult.data;

      try {
        const kegiatanBaru = await prisma.kegiatan.create({
          data: {
            nama,
            deskripsi: deskripsi || null,
            aktif: true,
          },
        });
        return res.status(201).json({ success: true, data: kegiatanBaru });
      } catch (error) {
        console.error('Error creating kegiatan:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    // PATCH ?resource=kegiatan — update status aktif atau detail kegiatan
    if (req.method === 'PATCH') {
      const { id, aktif, nama, deskripsi } = req.body || {};
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID kegiatan wajib disertakan' });
      }

      try {
        const updateData: { aktif?: boolean; nama?: string; deskripsi?: string | null } = {};
        if (typeof aktif === 'boolean') updateData.aktif = aktif;
        if (typeof nama === 'string' && nama.trim()) updateData.nama = nama.trim();
        if (typeof deskripsi !== 'undefined') updateData.deskripsi = deskripsi ? String(deskripsi).trim() : null;

        const updated = await prisma.kegiatan.update({
          where: { id },
          data: updateData,
        });
        return res.status(200).json({ success: true, data: updated });
      } catch (error) {
        console.error('Error updating kegiatan:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    // DELETE ?resource=kegiatan — hapus sesi kegiatan
    if (req.method === 'DELETE') {
      const id = (req.query.id as string) || req.body?.id;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID kegiatan wajib disertakan' });
      }

      try {
        await prisma.kegiatan.delete({
          where: { id },
        });
        return res.status(200).json({ success: true, message: 'Kegiatan berhasil dihapus' });
      } catch (error) {
        console.error('Error deleting kegiatan:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ROUTE: /api/peserta?resource=absen_kegiatan — presensi kegiatan (Tahap 3)
  // Bisa diakses oleh semua panitia (SUPER_ADMIN dan ADMIN_MOBIL) secara global
  // ─────────────────────────────────────────────────────────────────────────
  if (resource === 'absen_kegiatan') {
    // GET ?resource=absen_kegiatan&kegiatanId=xxx — ambil rekap absen kegiatan
    if (req.method === 'GET') {
      const kegiatanId = (req.query.kegiatanId as string) || '';
      if (!kegiatanId) {
        return res.status(400).json({ error: 'kegiatanId wajib disertakan' });
      }

      try {
        const daftarAbsen = await prisma.absenKegiatan.findMany({
          where: { kegiatanId },
          select: {
            id: true,
            kegiatanId: true,
            idPeserta: true,
            waktuAbsen: true,
            dicatatOleh: true,
            peserta: {
              select: {
                idPeserta: true,
                namaLengkap: true,
                jenisKelamin: true,
                asalSekolah: true,
                mobil: true,
              },
            },
          },
          orderBy: { waktuAbsen: 'desc' },
        });
        return res.status(200).json({ success: true, data: daftarAbsen });
      } catch (error) {
        console.error('Error fetching absen kegiatan:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    // POST ?resource=absen_kegiatan — tandai peserta hadir di sesi kegiatan
    if (req.method === 'POST') {
      const parseResult = AbsenKegiatanSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors[0]?.message || 'Data absen tidak valid';
        return res.status(400).json({ error: errorMsg });
      }

      const { kegiatanId, idPeserta } = parseResult.data;

      try {
        // Cek apakah sesi kegiatan aktif
        const kegiatan = await prisma.kegiatan.findUnique({
          where: { id: kegiatanId },
        });
        if (!kegiatan) {
          return res.status(404).json({ error: 'Sesi kegiatan tidak ditemukan.' });
        }
        if (!kegiatan.aktif) {
          return res.status(400).json({ error: 'Sesi kegiatan ini sedang ditutup/tidak aktif.' });
        }

        // Cek apakah peserta terdaftar dan berpartisipasi
        const peserta = await prisma.peserta.findUnique({
          where: { idPeserta },
        });
        if (!peserta) {
          return res.status(404).json({ error: 'Peserta tidak ditemukan.' });
        }
        if (peserta.partisipasi !== 'Ikut') {
          return res.status(400).json({ error: 'Peserta tercatat tidak mengikuti kegiatan rihlah.' });
        }

        const panitiaUsername = (session as any).username || 'panitia';

        const record = await prisma.absenKegiatan.upsert({
          where: {
            kegiatanId_idPeserta: { kegiatanId, idPeserta },
          },
          create: {
            kegiatanId,
            idPeserta,
            dicatatOleh: panitiaUsername,
            waktuAbsen: new Date(),
          },
          update: {
            dicatatOleh: panitiaUsername,
          },
        });

        return res.status(200).json({ success: true, data: record });
      } catch (error) {
        console.error('Error recording absen kegiatan:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    // DELETE ?resource=absen_kegiatan — batalkan tanda hadir peserta (jika salah klik)
    if (req.method === 'DELETE') {
      const kegiatanId = (req.query.kegiatanId as string) || req.body?.kegiatanId;
      const idPeserta = (req.query.idPeserta as string) || req.body?.idPeserta;

      if (!kegiatanId || !idPeserta) {
        return res.status(400).json({ error: 'kegiatanId dan idPeserta wajib disertakan.' });
      }

      try {
        await prisma.absenKegiatan.deleteMany({
          where: {
            kegiatanId: String(kegiatanId),
            idPeserta: String(idPeserta),
          },
        });
        return res.status(200).json({ success: true, message: 'Presensi kegiatan berhasil dibatalkan.' });
      } catch (error) {
        console.error('Error deleting absen kegiatan:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ROUTE DEFAULT: /api/peserta — list data peserta, edit, dan soft delete
  // ─────────────────────────────────────────────────────────────────────────

  // GET /api/peserta — ambil daftar peserta (difilter mobil untuk Admin Mobil, filter soft delete)
  if (req.method === 'GET') {
    try {
      const mobilSession = isAdminMobil(session) ? getMobilFromSession(session) : null;

      const whereClause: Record<string, any> = {
        deletedAt: null,
      };

      if (mobilSession) {
        whereClause.mobil = mobilSession;
      }

      const peserta = await prisma.peserta.findMany({
        where: whereClause,
        select: {
          id: true,
          idPeserta: true,
          namaLengkap: true,
          jenisKelamin: true,
          asalSekolah: true,
          partisipasi: true,
          alasanTidakIkut: true,
          waPribadi: true,
          waDarurat: true,
          riwayatMedis: true,
          mobil: true,
          waktuBerangkat: true,
          waktuPulang: true,
          username: true,
          statusPassword: true,
          createdAt: true,
          dokumen: {
            where: { scope: 'PERSONAL' },
            select: {
              id: true,
              judul: true,
              blobUrl: true,
              blobDownloadUrl: true,
              createdAt: true,
            },
          },
        },
        orderBy: { namaLengkap: 'asc' },
      });

      const formatted = peserta.map((p) => {
        const suratOrtu = p.dokumen?.find((d) => d.judul === 'Surat Pernyataan Orang Tua' || d.judul.toLowerCase().includes('pernyataan')) || p.dokumen?.[0];
        return {
          ...p,
          waktuBerangkat: p.waktuBerangkat ? p.waktuBerangkat.toLocaleString('id-ID') : null,
          waktuPulang: p.waktuPulang ? p.waktuPulang.toLocaleString('id-ID') : null,
          hasSuratOrtu: Boolean(suratOrtu),
          suratOrtuUrl: suratOrtu ? (suratOrtu.blobDownloadUrl || suratOrtu.blobUrl) : null,
        };
      });

      return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
      console.error('Error fetching peserta list:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PATCH /api/peserta — edit data peserta (Khusus SUPER_ADMIN)
  if (req.method === 'PATCH') {
    if (!isSuperAdmin(session)) {
      return res.status(403).json({ error: 'Forbidden: Hanya Super Admin yang berwenang mengubah data peserta.' });
    }

    const {
      id,
      idPeserta,
      namaLengkap,
      jenisKelamin,
      asalSekolah,
      partisipasi,
      alasanTidakIkut,
      waPribadi,
      waDarurat,
      riwayatMedis,
      mobil,
    } = req.body || {};

    const targetId = id || idPeserta;
    if (!targetId || typeof targetId !== 'string') {
      return res.status(400).json({ error: 'ID Peserta wajib disertakan.' });
    }

    try {
      const existing = await prisma.peserta.findFirst({
        where: {
          OR: [{ id: targetId }, { idPeserta: targetId }],
          deletedAt: null,
        },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Peserta tidak ditemukan atau sudah dinonaktifkan.' });
      }

      const updated = await prisma.peserta.update({
        where: { id: existing.id },
        data: {
          ...(namaLengkap !== undefined ? { namaLengkap: String(namaLengkap).trim() } : {}),
          ...(jenisKelamin !== undefined ? { jenisKelamin: String(jenisKelamin) } : {}),
          ...(asalSekolah !== undefined ? { asalSekolah: String(asalSekolah).trim() } : {}),
          ...(partisipasi !== undefined ? { partisipasi: String(partisipasi) } : {}),
          ...(alasanTidakIkut !== undefined ? { alasanTidakIkut: alasanTidakIkut ? String(alasanTidakIkut).trim() : null } : {}),
          ...(waPribadi !== undefined ? { waPribadi: waPribadi ? String(waPribadi).trim() : null } : {}),
          ...(waDarurat !== undefined ? { waDarurat: waDarurat ? String(waDarurat).trim() : null } : {}),
          ...(riwayatMedis !== undefined ? { riwayatMedis: riwayatMedis ? String(riwayatMedis).trim() : null } : {}),
          ...(mobil !== undefined ? { mobil: mobil ? String(mobil).trim() : null } : {}),
        },
      });

      logSystem({
        level: 'INFO',
        action: 'PESERTA_EDIT',
        actorId: (session as any).username || 'super-admin',
        details: { id: updated.id, idPeserta: updated.idPeserta, nama: updated.namaLengkap },
      });

      return res.status(200).json({ success: true, message: 'Data peserta berhasil diperbarui.', data: updated });
    } catch (error) {
      console.error('Error updating peserta:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // DELETE /api/peserta — soft delete peserta (Khusus SUPER_ADMIN)
  if (req.method === 'DELETE') {
    if (!isSuperAdmin(session)) {
      return res.status(403).json({ error: 'Forbidden: Hanya Super Admin yang berwenang menghapus data peserta.' });
    }

    const targetId = (req.query.id as string) || (req.query.idPeserta as string) || req.body?.id || req.body?.idPeserta;
    if (!targetId || typeof targetId !== 'string') {
      return res.status(400).json({ error: 'ID Peserta wajib disertakan.' });
    }

    try {
      const existing = await prisma.peserta.findFirst({
        where: {
          OR: [{ id: targetId }, { idPeserta: targetId }],
          deletedAt: null,
        },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Peserta tidak ditemukan atau sudah dihapus sebelumnya.' });
      }

      const deleted = await prisma.peserta.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });

      logSystem({
        level: 'WARN',
        action: 'PESERTA_SOFT_DELETE',
        actorId: (session as any).username || 'super-admin',
        details: { id: deleted.id, idPeserta: deleted.idPeserta, nama: deleted.namaLengkap },
      });

      return res.status(200).json({ success: true, message: `Peserta "${deleted.namaLengkap}" berhasil dihapus (soft delete).` });
    } catch (error) {
      console.error('Error deleting peserta:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
