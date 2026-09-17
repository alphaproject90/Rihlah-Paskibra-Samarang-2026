import React from 'react';

export type PanitiaTabType = 
  | 'ringkasan' 
  | 'peserta' 
  | 'scanner' 
  | 'kegiatan'
  | 'dokumen' 
  | 'log' 
  | 'pengaturan'
  | 'admin'; // Tab manajemen akun panitia — hanya Super Admin

export interface PanitiaMenuItem {
  id: PanitiaTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  description?: string;
}

export interface KegiatanRihlah {
  id: string;
  nama: string;
  deskripsi: string | null;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    absen: number;
  };
}

export interface AbsenKegiatanItem {
  id: string;
  kegiatanId: string;
  idPeserta: string;
  waktuAbsen: string;
  dicatatOleh: string | null;
  peserta?: {
    namaLengkap: string;
    mobil: string | null;
  };
}

