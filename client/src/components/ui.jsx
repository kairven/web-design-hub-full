import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Loader2, Star, X } from 'lucide-react';
import { cx } from '../lib/format.js';

/* ---------------------------------- Button --------------------------------- */

const BUTTON_VARIANTS = {
  primary:
    'bg-gradient-to-b from-saffron-400 to-saffron-600 text-ink-950 shadow-[0_10px_30px_-12px_rgba(245,165,36,0.75)] hover:from-saffron-300 hover:to-saffron-500 active:translate-y-px',
  secondary: 'bg-ink-700 text-cream hover:bg-ink-600 border border-white/10',
  outline: 'border border-white/15 text-cream hover:border-saffron-500/60 hover:bg-white/5',
  ghost: 'text-cream-dim hover:text-cream hover:bg-white/5',
  danger: 'bg-chili-600 text-white hover:bg-chili-500',
  soft: 'bg-saffron-500/12 text-saffron-300 hover:bg-saffron-500/20 border border-saffron-500/25',
  success: 'bg-mint-500 text-ink-950 hover:bg-mint-400',
};

const BUTTON_SIZES = {
  xs: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-2xl',
  icon: 'h-10 w-10 rounded-xl',
};

export function Button({
  variant = 'primary', size = 'md', className, loading, children, disabled, as: Tag = 'button', ...props
}) {
  return (
    <Tag
      className={cx(
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </Tag>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

const BADGE_TONES = {
  saffron: 'bg-saffron-500/12 text-saffron-300 border-saffron-500/25',
  green: 'bg-mint-500/12 text-mint-400 border-mint-500/25',
  red: 'bg-chili-500/12 text-chili-400 border-chili-500/25',
  blue: 'bg-sky-500/12 text-sky-300 border-sky-500/25',
  violet: 'bg-violet-500/12 text-violet-300 border-violet-500/25',
  neutral: 'bg-white/[0.06] text-cream-dim border-white/10',
  amber: 'bg-amber-400/12 text-amber-300 border-amber-400/25',
};

export function Badge({ tone = 'neutral', className, children, dot }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        BADGE_TONES[tone] ?? BADGE_TONES.neutral,
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ---------------------------------- Card ----------------------------------- */

export function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag
      className={cx('rounded-2xl border border-white/[0.06] bg-ink-850/70 backdrop-blur-xl', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

/* --------------------------------- Inputs ---------------------------------- */

const inputBase =
  'w-full rounded-xl border border-white/10 bg-ink-800/80 px-3.5 text-sm text-cream placeholder:text-muted/70 transition focus:border-saffron-500/60 focus:bg-ink-800 focus:outline-none focus:ring-4 focus:ring-saffron-500/10 disabled:opacity-60';

export function Field({ label, hint, error, children, className, required }) {
  const id = useId();
  const child = typeof children === 'function' ? children(id) : children;
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-muted">
          {label} {required && <span className="text-chili-400">*</span>}
        </label>
      )}
      {child}
      {error ? (
        <p className="flex items-center gap-1 text-[12px] text-chili-400"><AlertCircle size={12} /> {error}</p>
      ) : hint ? (
        <p className="text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, invalid, ...props }) {
  return <input className={cx(inputBase, 'h-11', invalid && 'border-chili-500/60', className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cx(inputBase, 'min-h-[88px] py-3 leading-relaxed', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cx(inputBase, 'h-11 appearance-none bg-[length:16px] pr-9', className)} {...props}>
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label, disabled, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 disabled:opacity-50',
        checked ? 'border-saffron-500/50 bg-saffron-500' : 'border-white/10 bg-ink-600',
        className
      )}
    >
      <span
        className={cx(
          'inline-block h-4.5 w-4.5 translate-x-1 rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-[22px]'
        )}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}

/* --------------------------------- Overlays -------------------------------- */

function useLockScroll(open) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useLockScroll(open);
  useEscape(open, onClose);
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cx(
          'animate-slide-up relative w-full overflow-hidden rounded-t-3xl border border-white/10 bg-ink-850 shadow-2xl sm:animate-scale-in sm:rounded-3xl',
          widths[size]
        )}
      >
        <div className="max-h-[85vh] overflow-y-auto">
          {(title || onClose) && (
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div>
                {title && <h3 className="text-lg font-semibold text-cream">{title}</h3>}
                {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-cream" aria-label="Close dialog">
                <X size={18} />
              </button>
            </div>
          )}
          <div className="px-5 py-5 sm:px-6">{children}</div>
          {footer && <div className="border-t border-white/[0.06] bg-ink-900/50 px-5 py-4 sm:px-6">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function Drawer({ open, onClose, title, children, footer, side = 'right', width = 'sm' }) {
  useLockScroll(open);
  useEscape(open, onClose);
  if (!open) return null;
  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-2xl' };
  return createPortal(
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'animate-slide-up absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl border border-white/10 bg-ink-850 shadow-2xl sm:inset-y-0 sm:max-h-none sm:animate-slide-left sm:rounded-none sm:rounded-l-3xl',
          widths[width],
          side === 'right' ? 'sm:right-0' : 'sm:left-0'
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
          <h3 className="text-base font-semibold text-cream">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-cream" aria-label="Close panel">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-white/[0.06] bg-ink-900/60 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', tone = 'danger', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-cream-dim">{message}</p>
    </Modal>
  );
}

/* -------------------------------- Feedback -------------------------------- */

export function Spinner({ size = 18, className }) {
  return <Loader2 size={size} className={cx('animate-spin text-saffron-400', className)} />;
}

export function Skeleton({ className }) {
  return <div className={cx('skeleton', className)} />;
}

export function DishSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-ink-850/60 p-3">
      <Skeleton className="aspect-[4/3] w-full" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-full" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function RowSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.04] bg-ink-850/40 p-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-ink-850/40 px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-ink-800 text-saffron-400">
          <Icon size={24} />
        </div>
      )}
      <h3 className="text-base font-semibold text-cream">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ----------------------------- Food-specific ------------------------------ */

const DISH_EMOJI = [
  [/roll/i, '🌯'], [/biryani|rice/i, '🍚'], [/chicken|lollypop|fry|keema|curry/i, '🍗'],
  [/egg/i, '🥚'], [/paratha|roti/i, '🫓'], [/salad/i, '🥗'], [/chilly|chilli/i, '🌶️'], [/combo/i, '🍱'],
];

export function DishImage({ src, name = '', alt, className, rounded = 'rounded-xl' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const emoji = (DISH_EMOJI.find(([re]) => re.test(name)) || [null, '🍽️'])[1];

  if (!src || failed) {
    return (
      <div
        className={cx('flex items-center justify-center bg-gradient-to-br from-saffron-600/25 via-ink-700 to-ink-800', rounded, className)}
        aria-label={alt || name}
        role="img"
      >
        <span className="text-2xl opacity-80">{emoji}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cx('object-cover', rounded, className)}
    />
  );
}

export function VegMark({ isVeg, size = 13 }) {
  return (
    <span
      title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-[3px] border',
        isVeg ? 'border-mint-500/70' : 'border-chili-500/70'
      )}
      style={{ height: size, width: size }}
    >
      <span className={cx('rounded-full', isVeg ? 'bg-mint-500' : 'bg-chili-500')} style={{ height: size / 2.2, width: size / 2.2 }} />
    </span>
  );
}

export function Stars({ value = 0, count, size = 12, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1', className)}>
      <Star size={size} className="fill-saffron-400 text-saffron-400" />
      <span className="text-[12px] font-semibold text-cream-dim">{Number(value).toFixed(1)}</span>
      {count != null && <span className="text-[11px] text-muted">({count})</span>}
    </span>
  );
}

export function SpiceLevel({ level = 1 }) {
  if (!level) return null;
  return (
    <span className="inline-flex items-center gap-0.5" title={`Spice level ${level}/3`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className={cx('text-[10px]', i < level ? 'opacity-100' : 'opacity-20')}>🌶️</span>
      ))}
    </span>
  );
}

export function StatCard({ label, value, sub, icon: Icon, tone = 'saffron', trend }) {
  const tones = {
    saffron: 'from-saffron-500/15 text-saffron-300 border-saffron-500/20',
    green: 'from-mint-500/15 text-mint-400 border-mint-500/20',
    blue: 'from-sky-500/15 text-sky-300 border-sky-500/20',
    red: 'from-chili-500/15 text-chili-400 border-chili-500/20',
    violet: 'from-violet-500/15 text-violet-300 border-violet-500/20',
  };
  return (
    <Card className="relative overflow-hidden p-4 sm:p-5">
      <div className={cx('absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br to-transparent blur-2xl', tones[tone])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-cream sm:text-[28px]">{value}</p>
          {sub && <p className="mt-1 text-[12px] text-muted">{sub}</p>}
        </div>
        {Icon && (
          <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl border bg-white/[0.03]', tones[tone])}>
            <Icon size={16} />
          </span>
        )}
      </div>
      {trend && <div className="relative mt-3">{trend}</div>}
    </Card>
  );
}

export function SectionTitle({ eyebrow, title, description, action, className }) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        {eyebrow && <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron-500">{eyebrow}</p>}
        <h2 className="font-display text-xl font-semibold tracking-tight text-cream sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 max-w-xl text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SegmentedControl({ options, value, onChange, className }) {
  return (
    <div className={cx('inline-flex items-center gap-1 rounded-xl border border-white/[0.07] bg-ink-800/70 p-1', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cx(
            'rounded-lg px-3 py-1.5 text-[12px] font-semibold transition',
            value === opt.value ? 'bg-saffron-500 text-ink-950 shadow' : 'text-muted hover:text-cream'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name = '', src, size = 36, className }) {
  const letters = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  return src ? (
    <img src={src} alt={name} className={cx('rounded-full object-cover', className)} style={{ height: size, width: size }} />
  ) : (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron-500/30 to-chili-500/20 text-[12px] font-bold text-saffron-300 ring-1 ring-inset ring-white/10', className)}
      style={{ height: size, width: size }}
    >
      {letters || 'Z'}
    </span>
  );
}

export function useClickOutside(ref, handler) {
  useEffect(() => {
    const fn = (e) => ref.current && !ref.current.contains(e.target) && handler(e);
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, handler]);
}

export function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export { useRef };
