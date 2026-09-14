import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash password menggunakan bcrypt dengan cost factor >= 10
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifikasi kecocokan password plaintext terhadap hash bcrypt
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return await bcrypt.compare(password, hash);
}
