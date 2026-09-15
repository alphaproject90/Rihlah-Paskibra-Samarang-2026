import { FormPendaftaran, PesertaRihlah, StatsRihlah } from '../types';

/**
 * Bentuk hasil seragam untuk semua pemanggilan API.
 * ok=false berarti request BENAR-BENAR gagal — tidak pernah diganti data contoh.
 * unauthorized=true khusus untuk 401, supaya App bisa mengakhiri sesi panitia.
 */
export interface HasilApi<T> {
  ok: boolean;
  data: T;
  message?: string;
  unauthorized?: boolean;
}

const PESAN_KONEKSI = 'Gagal terhubung ke server. Periksa koneksi Anda.';

/** Baca body JSON dengan aman — response 404/500 bisa berisi HTML, bukan JSON. */
async function bacaJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const apiService = {
  getStatistik: async (): Promise<HasilApi<StatsRihlah | null>> => {
    try {
      const res = await fetch('/api/statistik');
      const json = await bacaJson(res);

      if (!res.ok) {
        return {
          ok: false,
          data: null,
          message: json?.message || `Gagal memuat statistik (${res.status}).`,
        };
      }
      return { ok: true, data: json as StatsRihlah };
    } catch {
      return { ok: false, data: null, message: PESAN_KONEKSI };
    }
  },

  getAllPeserta: async (): Promise<HasilApi<PesertaRihlah[]>> => {
    try {
      const res = await fetch('/api/peserta');
      const json = await bacaJson(res);

      // 401 = sesi panitia habis/tidak valid. Harus terlihat, bukan diganti data contoh.
      if (res.status === 401) {
        return {
          ok: false,
          data: [],
          unauthorized: true,
          message: json?.message || 'Sesi panitia tidak valid. Silakan login ulang.',
        };
      }
      if (!res.ok || json?.status !== 'success') {
        return {
          ok: false,
          data: [],
          message: json?.message || `Gagal memuat data peserta (${res.status}).`,
        };
      }
      return { ok: true, data: (json.data || []) as PesertaRihlah[] };
    } catch {
      return { ok: false, data: [], message: PESAN_KONEKSI };
    }
  },

  registerPeserta: async (
    payload: FormPendaftaran
  ): Promise<{ status: string; id?: string; message?: string }> => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await bacaJson(res);
      if (!json) {
        return { status: 'error', message: `Server mengembalikan respons tidak valid (${res.status}).` };
      }
      return json;
    } catch {
      return { status: 'error', message: PESAN_KONEKSI };
    }
  },

  /**
   * Login panitia dengan username + password.
   * TIDAK ADA fallback "anggap benar" di sini. Kalau koneksi gagal atau endpoint
   * hilang, login dianggap GAGAL — bukan diam-diam diloloskan.
   */
  loginPanitia: async (
    username: string,
    password: string
  ): Promise<{ valid: boolean; message: string }> => {
    try {
      const res = await fetch('/api/login-panitia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await bacaJson(res);

      if (!json) {
        return { valid: false, message: `Server mengembalikan respons tidak valid (${res.status}).` };
      }
      return { valid: res.ok && json.valid === true, message: json.message || '' };
    } catch {
      return { valid: false, message: PESAN_KONEKSI };
    }
  },

  /** Hapus cookie sesi di server. Tanpa ini, token panitia tetap valid 24 jam. */
  logout: async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },

  loginPeserta: async (username: string, password: string): Promise<any> => {
    try {
      const res = await fetch('/api/login-peserta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await bacaJson(res);
      if (!json) {
        return { status: 'error', message: `Server mengembalikan respons tidak valid (${res.status}).` };
      }
      return json;
    } catch {
      return { status: 'error', message: PESAN_KONEKSI };
    }
  },

  prosesGantiPasswordAwal: async (
    username: string,
    oldPass: string,
    newPass: string
  ): Promise<any> => {
    try {
      const res = await fetch('/api/ganti-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, oldPassword: oldPass, newPassword: newPass }),
      });
      const json = await bacaJson(res);
      if (!json) {
        return { status: 'error', message: `Server mengembalikan respons tidak valid (${res.status}).` };
      }
      return json;
    } catch {
      return { status: 'error', message: PESAN_KONEKSI };
    }
  },

  resetPasswordLupa: async (identifier: string, noWa: string, newPass: string): Promise<any> => {
    try {
      const res = await fetch('/api/ganti-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, noWa, newPassword: newPass }),
      });
      const json = await bacaJson(res);
      if (!json) {
        return { status: 'error', message: `Server mengembalikan respons tidak valid (${res.status}).` };
      }
      return json;
    } catch {
      return { status: 'error', message: PESAN_KONEKSI };
    }
  },

  prosesScan: async (idPeserta: string, mode: 'berangkat' | 'pulang'): Promise<any> => {
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idPeserta, mode }),
      });
      const json = await bacaJson(res);

      if (res.status === 401) {
        return {
          status: 'error',
          unauthorized: true,
          message: json?.message || 'Sesi panitia tidak valid. Silakan login ulang.',
        };
      }
      if (!json) {
        return { status: 'error', message: `Server mengembalikan respons tidak valid (${res.status}).` };
      }
      return json;
    } catch {
      return { status: 'error', message: PESAN_KONEKSI };
    }
  },
};
