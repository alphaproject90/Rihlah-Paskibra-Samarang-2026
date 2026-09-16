import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.error('Gagal inisialisasi Upstash Redis client:', err);
  }
} else if (process.env.NODE_ENV === 'production') {
  console.warn(
    '[SECURITY WARNING] UPSTASH_REDIS_REST_URL atau UPSTASH_REDIS_REST_TOKEN belum dikonfigurasi. Distributed rate limiting tidak aktif.'
  );
}

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_SECONDS = 900; // 15 menit

export interface RateLimitResult {
  allowed: boolean;
  message?: string;
}

/**
 * Memeriksa apakah suatu identifier (mis. IP atau username) sedang dalam status terkunci di Upstash Redis.
 * Menghindari ketergantungan pada in-memory state yang efemeral di serverless environment.
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  if (!redisClient) {
    return { allowed: true };
  }

  const lockKey = `lock_${key}`;
  try {
    const isLocked = await redisClient.get(lockKey);
    if (isLocked) {
      return {
        allowed: false,
        message: 'Terlalu banyak percobaan gagal. Akses dikunci sementara. Silakan tunggu 15 menit.',
      };
    }
    return { allowed: true };
  } catch (error) {
    console.error(`[RATE_LIMIT] Error saat memeriksa status lock di Redis (${key}):`, error);
    // Fail-open secara aman agar outage redis tidak melumpuhkan login pengguna sah
    return { allowed: true };
  }
}

/**
 * Mencatat percobaan gagal di Upstash Redis. Jika sudah mencapai batas maxAttempts, kunci selama durationSeconds.
 */
export async function recordFailedAttempt(
  key: string,
  maxAttempts: number = MAX_ATTEMPTS,
  durationSeconds: number = LOCK_DURATION_SECONDS
): Promise<{ locked: boolean; attempts: number }> {
  if (!redisClient) {
    return { locked: false, attempts: 0 };
  }

  const lockKey = `lock_${key}`;
  const attemptsKey = `attempts_${key}`;

  try {
    const current = (await redisClient.incr(attemptsKey)) as number;
    if (current === 1) {
      await redisClient.expire(attemptsKey, durationSeconds);
    }
    if (current >= maxAttempts) {
      await redisClient.set(lockKey, 'true', { ex: durationSeconds });
      await redisClient.del(attemptsKey);
      return { locked: true, attempts: current };
    }
    return { locked: false, attempts: current };
  } catch (error) {
    console.error(`[RATE_LIMIT] Error saat mencatat percobaan gagal di Redis (${key}):`, error);
    return { locked: false, attempts: 0 };
  }
}

/**
 * Reset counter percobaan gagal di Upstash Redis ketika autentikasi berhasil.
 */
export async function resetRateLimit(key: string): Promise<void> {
  if (!redisClient) return;

  const lockKey = `lock_${key}`;
  const attemptsKey = `attempts_${key}`;

  try {
    await redisClient.del(lockKey);
    await redisClient.del(attemptsKey);
  } catch (error) {
    console.error(`[RATE_LIMIT] Error saat mereset rate limit di Redis (${key}):`, error);
  }
}
