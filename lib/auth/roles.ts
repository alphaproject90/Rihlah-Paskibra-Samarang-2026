/**
 * lib/auth/roles.ts — Helper pemeriksaan role panitia (Tahap 1)
 *
 * Dipakai oleh semua endpoint yang butuh guard akses berbasis role mulai Tahap 2.
 * Tidak ada side-effect: semua fungsi di sini murni, hanya membaca payload JWT.
 *
 * CATATAN (revisi keamanan): Fallback backward-compat untuk token lama tanpa
 * `panitiaRole` (yang otomatis dianggap SUPER_ADMIN) telah DIHAPUS. Token lama
 * tanpa `panitiaRole` tidak lagi punya akses SUPER_ADMIN; pengguna terdampak
 * cukup login ulang (token baru selalu memuat `panitiaRole`). Sekarang
 * SUPER_ADMIN HANYA valid jika `panitiaRole === 'SUPER_ADMIN'` secara eksplisit.
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
 * Hanya menerima `panitiaRole === 'SUPER_ADMIN'` secara eksplisit — TIDAK ADA
 * fallback lagi untuk token tanpa `panitiaRole` (lihat catatan revisi di atas).
 */
export function isSuperAdmin(session: unknown): boolean {
  const s = session as SessionPayload;
  if (!s || s.role !== 'panitia') return false;
  return s.panitiaRole === 'SUPER_ADMIN';
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
