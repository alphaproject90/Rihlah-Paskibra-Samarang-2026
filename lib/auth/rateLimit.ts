import { Redis } from '@upstash/redis';

// Fallback in-memory cache jika Redis belum dikonfigurasi
interface AttemptRecord {
  attempts: number;
  lockedUntil?: number;
}

const memoryStore = new Map<string, AttemptRecord>();

let redisClient: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.warn('Gagal inisialisasi Upstash Redis, beralih ke in-memory store:', err);
  }
}

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_SECONDS = 900; // 15 menit

export interface RateLimitResult {
  allowed: boolean;
  message?: string;
}

/**
 * Memeriksa apakah suatu identifier (mis. IP atau username) sedang dalam status terkunci.
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const lockKey = `lock_${key}`;

  if (redisClient) {
    try {
      const isLocked = await redisClient.get(lockKey);
      if (isLocked) {
        return {
          allowed: false,
          message: 'Terlalu banyak percobaan gagal. Akses dikunci sementara. Silakan tunggu 15 menit.',
        };
      }
      return { allowed: true };
    } catch {
      // fallback jika redis error
    }
  }

  // Memory fallback
  const rec = memoryStore.get(key);
  if (rec && rec.lockedUntil) {
    if (Date.now() < rec.lockedUntil) {
      return {
        allowed: false,
        message: 'Terlalu banyak percobaan gagal. Akses dikunci sementara. Silakan tunggu 15 menit.',
      };
    } else {
      memoryStore.delete(key);
    }
  }

  return { allowed: true };
}

/**
 * Mencatat percobaan gagal. Jika sudah mencapai 5x, kunci selama 15 menit.
 */
export async function recordFailedAttempt(key: string): Promise<{ locked: boolean; attempts: number }> {
  const lockKey = `lock_${key}`;
  const attemptsKey = `attempts_${key}`;

  if (redisClient) {
    try {
      const current = (await redisClient.incr(attemptsKey)) as number;
      if (current === 1) {
        await redisClient.expire(attemptsKey, LOCK_DURATION_SECONDS);
      }
      if (current >= MAX_ATTEMPTS) {
        await redisClient.set(lockKey, 'true', { ex: LOCK_DURATION_SECONDS });
        await redisClient.del(attemptsKey);
        return { locked: true, attempts: current };
      }
      return { locked: false, attempts: current };
    } catch {
      // fallback ke memory
    }
  }

  // In-memory fallback
  const now = Date.now();
  let rec = memoryStore.get(key);
  if (!rec || (rec.lockedUntil && now >= rec.lockedUntil)) {
    rec = { attempts: 0 };
  }

  rec.attempts += 1;
  if (rec.attempts >= MAX_ATTEMPTS) {
    rec.lockedUntil = now + LOCK_DURATION_SECONDS * 1000;
    memoryStore.set(key, rec);
    return { locked: true, attempts: rec.attempts };
  }

  memoryStore.set(key, rec);
  return { locked: false, attempts: rec.attempts };
}

/**
 * Reset percobaan gagal ketika login berhasil.
 */
export async function resetRateLimit(key: string): Promise<void> {
  const lockKey = `lock_${key}`;
  const attemptsKey = `attempts_${key}`;

  if (redisClient) {
    try {
      await redisClient.del(lockKey);
      await redisClient.del(attemptsKey);
    } catch {
      // ignore
    }
  }

  memoryStore.delete(key);
}
