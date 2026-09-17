/**
 * lib/auth/roles.ts — Helper pemeriksaan role panitia (Tahap 1)
 *
 * Dipakai oleh semua endpoint yang butuh guard akses berbasis role mulai Tahap 2.
 * Tidak ada side-effect: semua fungsi di sini murni, hanya membaca payload JWT.
 *
 * Catatan kompatibilitas:
 * - Session dengan payload lama (hanya `role: 'panitia'`, tanpa `panitiaRole`)
 *   diperlakukan sebagai SUPER_ADMIN untuk backward-compatibility (fallback path
 *   login env-var masih menghasilkan `panitiaRole: 'SUPER_ADMIN'` di Tahap 1,
 *   tapi akun lama yang login sebelum Tahap 1 di-deploy belum punya field ini).
 */

export type SessionPayload = {
  role?: string;
  panitiaRole?: string;
  panitiaId?: string;
  username?: string;
  mobil?: string | null;
  [key: string]: unknown;
};

/**
 * Kembalikan true jika session adalah panitia dengan role SUPER_ADMIN.
 * Fallback: jika `panitiaRole` tidak ada tapi `role === 'panitia'`, dianggap SUPER_ADMIN
 * (untuk kompatibilitas token lama yang di-issue sebelum Tahap 1 di-deploy).
 */
export function isSuperAdmin(session: unknown): boolean {
  const s = session as SessionPayload;
  if (!s || s.role !== 'panitia') return false;
  // Token baru: cek panitiaRole secara eksplisit
  if (s.panitiaRole === 'SUPER_ADMIN') return true;
  // Token lama (fallback): tidak punya panitiaRole → diperlakukan sebagai super admin
  if (!s.panitiaRole) return true;
  return false;
}

/**
 * Kembalikan true jika session adalah ADMIN_MOBIL (bukan Super Admin).
 */
export function isAdminMobil(session: unknown): boolean {
  const s = session as SessionPayload;
  if (!s || s.role !== 'panitia') return false;
  return s.panitiaRole === 'ADMIN_MOBIL';
}

/**
 * Kembalikan nama mobil dari session, atau null jika tidak ada / SUPER_ADMIN.
 */
export function getMobilFromSession(session: unknown): string | null {
  const s = session as SessionPayload;
  if (!s) return null;
  return typeof s.mobil === 'string' ? s.mobil : null;
}

/**
 * Kembalikan username dari session payload.
 */
export function getUsernameFromSession(session: unknown): string | null {
  const s = session as SessionPayload;
  if (!s) return null;
  return typeof s.username === 'string' ? s.username : null;
}
