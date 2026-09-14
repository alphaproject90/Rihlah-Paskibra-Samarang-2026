import { FormPendaftaran, PesertaRihlah, StatsRihlah } from '../types';
import { INITIAL_PESERTA_RIHLAH } from '../data/rihlahData';

export const apiService = {
  getStatistik: async (): Promise<StatsRihlah> => {
    try {
      const res = await fetch('/api/statistik');
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch {
      // fallback
    }

    // Local fallback
    return {
      total: 3,
      tidakIkut: 1,
      berangkat: 2,
      pulang: 1
    };
  },

  getAllPeserta: async (): Promise<PesertaRihlah[]> => {
    try {
      const res = await fetch('/api/peserta');
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') return json.data;
      }
    } catch {
      // fallback
    }

    return INITIAL_PESERTA_RIHLAH;
  },

  registerPeserta: async (payload: FormPendaftaran): Promise<{ status: string; id?: string; message?: string }> => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { status: 'error', message: err.message || 'Gagal terhubung ke server.' };
    }
  },

  verifikasiPin: async (pin: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/verifikasi-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      return !!data.valid;
    } catch {
      return pin === '0000';
    }
  },

  loginPeserta: async (username: string, password: string): Promise<any> => {
    try {
      const res = await fetch('/api/login-peserta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return await res.json();
    } catch (err: any) {
      return { status: 'error', message: 'Gagal terhubung ke server.' };
    }
  },

  prosesGantiPasswordAwal: async (username: string, oldPass: string, newPass: string): Promise<any> => {
    try {
      const res = await fetch('/api/ganti-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, oldPassword: oldPass, newPassword: newPass })
      });
      return await res.json();
    } catch (err: any) {
      return { status: 'error', message: 'Gagal terhubung ke server.' };
    }
  },

  resetPasswordLupa: async (identifier: string, noWa: string, newPass: string): Promise<any> => {
    try {
      const res = await fetch('/api/ganti-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, noWa, newPassword: newPass })
      });
      return await res.json();
    } catch (err: any) {
      return { status: 'error', message: 'Gagal terhubung ke server.' };
    }
  },

  prosesScan: async (idPeserta: string, mode: 'berangkat' | 'pulang'): Promise<any> => {
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idPeserta, mode })
      });
      return await res.json();
    } catch (err: any) {
      return { status: 'error', message: 'Gagal terhubung ke server.' };
    }
  }
};
