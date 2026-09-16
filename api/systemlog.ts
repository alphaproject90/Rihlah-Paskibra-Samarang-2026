/**
 * ARCHITECTURE NOTE:
 * Endpoint audit trail log sistem (Panitia Only):
 * Menyajikan riwayat aktivitas sistem (SystemLog) dengan pagination berbasis cursor
 * dan filter level insiden (INFO, WARN, ERROR, CRITICAL).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';
import { getSession } from '../lib/api/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 1. Verifikasi hak akses: Hanya panitia yang berwenang melihat log audit trail
    const session = await getSession(req, 'panitia');
    if (!session || (session as any).role !== 'panitia') {
      return res.status(401).json({
        success: false,
        error: 'Hanya panitia yang berwenang mengakses log sistem.',
        message: 'Hanya panitia yang berwenang mengakses log sistem.',
      });
    }

    // 2. Parse query parameter
    const { level, cursor } = req.query;
    const rawLimit = parseInt(req.query.limit as string, 10);
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 50 : rawLimit, 1), 100);

    const validLevels = ['INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const filterLevel = typeof level === 'string' && validLevels.includes(level) ? level : undefined;

    // 3. Query Prisma dengan take: limit + 1 untuk deteksi hasMore secara efisien
    const logs = await prisma.systemLog.findMany({
      where: filterLevel ? { level: filterLevel } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && typeof cursor === 'string'
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    let nextCursor: string | null = null;
    let data = logs;

    if (logs.length > limit) {
      const itemsToReturn = logs.slice(0, limit);
      nextCursor = itemsToReturn[itemsToReturn.length - 1].id;
      data = itemsToReturn;
    }

    return res.status(200).json({
      success: true,
      data,
      nextCursor,
    });
  } catch (error) {
    console.error('Error saat memuat log sistem:', error);
    return res.status(500).json({
      success: false,
      error: 'Gagal memuat log sistem.',
      message: 'Gagal memuat log sistem.',
    });
  }
}
