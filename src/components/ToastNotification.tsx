import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  notification: { id: string; message: string; type: 'success' | 'info' | 'warning' } | null;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const { type, message } = notification;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md ${
          type === 'success'
            ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
            : type === 'warning'
            ? 'bg-rose-950/95 border-rose-500/40 text-rose-200'
            : 'bg-slate-900/95 border-slate-700 text-slate-200'
        }`}
      >
        {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
        {type === 'warning' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
        {type === 'info' && <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />}

        <div className="text-xs font-semibold leading-snug flex-1">{message}</div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
