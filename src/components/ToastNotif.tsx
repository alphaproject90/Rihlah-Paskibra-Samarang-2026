import React from 'react';
import { NotifState } from '../types';

interface ToastNotifProps {
  notif: NotifState;
}

export const ToastNotif: React.FC<ToastNotifProps> = ({ notif }) => {
  if (!notif.show) return null;

  const bgClass =
    notif.type === 'error'
      ? 'bg-red-600 text-white'
      : notif.type === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-slate-800 text-white';

  return (
    <div 
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl font-semibold text-sm transition-all text-center max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-200 ${bgClass}`}
    >
      {notif.message}
    </div>
  );
};
