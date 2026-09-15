import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

// Definisi level log (mengikuti standar industri)
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

interface LogPayload {
    level: LogLevel;
    action: string;
    actorId?: string;
    details?: Record<string, unknown> | string;
    ipAddress?: string;
}

/**
 * Serialisasi `details` secara aman ke JSON-compatible value.
 * JSON.parse(JSON.stringify(...)) gagal pada: BigInt, circular references, undefined values.
 * structuredClone() lebih aman tapi masih bisa gagal pada beberapa tipe — kita wrap dengan fallback.
 */
function serializeDetails(details: Record<string, unknown> | string | undefined): Prisma.InputJsonValue | null {
    if (details === undefined || details === null) return null;
    if (typeof details === 'string') return details;
    try {
        // JSON roundtrip: (1) menghilangkan undefined/function/symbol, (2) menghasilkan
        // tipe yang diverifikasi sebagai Prisma.InputJsonValue by construction.
        // Lebih aman dari structuredClone karena Prisma hanya bisa menyimpan JSON-safe values.
        return JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue;
    } catch {
        // Fallback terakhir jika objek memiliki circular reference — simpan sebagai string deskriptif
        return `[Unserializable: ${String(details)}]`;
    }
}

/**
 * Mencatat log ke Terminal (Vercel) DAN Database (audit trail) secara non-blocking.
 *
 * DB write dijalankan sebagai fire-and-forget — caller tidak perlu await fungsi ini.
 * Gagalnya penulisan log TIDAK boleh menggagalkan operasi bisnis utama.
 */
export function logSystem({
    level,
    action,
    actorId,
    details,
    ipAddress,
}: LogPayload): void {
    // 1. Tulis ke terminal / Vercel logs (sinkron, instan)
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] ${action}`;
    const suffix = actorId ? ` | Actor: ${actorId}` : '';
    const logLine = prefix + suffix;

    if (level === 'ERROR' || level === 'CRITICAL') {
        console.error(logLine, details ?? '');
    } else if (level === 'WARN') {
        console.warn(logLine);
    } else {
        console.log(logLine);
    }

    // 2. Simpan ke database secara fire-and-forget (non-blocking)
    // Tidak di-await — caller tidak perlu menunggu operasi I/O ini.
    prisma.systemLog.create({
        data: {
            level,
            action,
            actorId,
            details: serializeDetails(details),
            ipAddress,
        },
    }).catch((error: unknown) => {
        // Jangan sampai aplikasi crash hanya karena gagal menulis log
        console.error(`[${new Date().toISOString()}] [CRITICAL] GAGAL MENULIS SYSTEM LOG KE DATABASE:`, error);
    });
}