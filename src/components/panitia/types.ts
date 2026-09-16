import React from 'react';

export type PanitiaTabType = 
  | 'ringkasan' 
  | 'peserta' 
  | 'scanner' 
  | 'dokumen' 
  | 'log' 
  | 'pengaturan';

export interface PanitiaMenuItem {
  id: PanitiaTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  description?: string;
}
