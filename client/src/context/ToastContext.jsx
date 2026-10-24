import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

const ToastContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, ring: 'border-mint-500/30', text: 'text-mint-400' },
  error: { icon: TriangleAlert, ring: 'border-chili-500/30', text: 'text-chili-400' },
  info: { icon: Info, ring: 'border-saffron-500/30', text: 'text-saffron-400' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback((message, tone = 'info', opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, message, tone, title: opts.title }]);
    setTimeout(() => dismiss(id), opts.duration ?? 3800);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        {toasts.map((t) => {
          const meta = TONES[t.tone] ?? TONES.info;
          const Icon = meta.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border ${meta.ring} bg-ink-800/95 px-4 py-3 shadow-2xl backdrop-blur-xl`}
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${meta.text}`} />
              <div className="min-w-0 flex-1">
                {t.title && <p className="text-sm font-semibold text-cream">{t.title}</p>}
                <p className="text-[13px] leading-snug text-cream-dim">{t.message}</p>
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded-lg p-1 text-muted transition hover:bg-white/5 hover:text-cream" aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
