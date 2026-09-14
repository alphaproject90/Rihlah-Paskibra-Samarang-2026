'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  if (!message) return null;

  const bgStyles = {
    success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
    error: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
    info: 'bg-blue-950/90 border-blue-500/40 text-blue-200',
  }[type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[type];

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 max-w-md p-4 rounded-xl border shadow-xl backdrop-blur-md flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-5 ${bgStyles}`}
      role="alert"
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="text-sm font-medium leading-snug flex-1">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition p-0.5 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
