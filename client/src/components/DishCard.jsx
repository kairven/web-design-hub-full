import { Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { cx, inr } from '../lib/format.js';
import { Badge, DishImage, SpiceLevel, Stars, VegMark } from './ui.jsx';

export function QtyStepper({ qty, onAdd, onSub, size = 'sm' }) {
  const h = size === 'sm' ? 'h-9' : 'h-11';
  return (
    <div className={cx('flex items-center overflow-hidden rounded-xl border border-saffron-500/40 bg-saffron-500/10 text-saffron-300', h)}>
      <button
        onClick={onSub}
        aria-label="Remove one"
        className="flex h-full w-9 items-center justify-center transition hover:bg-saffron-500/20 active:scale-95"
      >
        <Minus size={14} />
      </button>
      <span className="min-w-6 text-center text-sm font-bold tabular-nums text-cream">{qty}</span>
      <button
        onClick={onAdd}
        aria-label="Add one"
        className="flex h-full w-9 items-center justify-center transition hover:bg-saffron-500/20 active:scale-95"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export function AddButton({ item, size = 'sm' }) {
  const { lines, add, setQty } = useCart();
  const line = lines.find((l) => l.id === item.id);
  const disabled = !item.isAvailable;

  if (disabled) {
    return (
      <span className="inline-flex h-9 items-center rounded-xl border border-white/10 px-3 text-[12px] font-semibold text-muted">
        Sold out
      </span>
    );
  }
  if (line) return <QtyStepper qty={line.qty} onAdd={() => add(item)} onSub={() => setQty(item.id, line.qty - 1)} size={size} />;

  return (
    <button
      onClick={() => add(item)}
      className="group inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-b from-saffron-400 to-saffron-600 px-3.5 text-[13px] font-bold text-ink-950 shadow-[0_8px_24px_-12px_rgba(245,165,36,0.8)] transition active:scale-95"
    >
      <Plus size={14} strokeWidth={3} /> Add
    </button>
  );
}

export function DishCard({ item, compact = false }) {
  const { lines, add, setQty } = useCart();
  const line = lines.find((l) => l.id === item.id);
  const discount = item.compareAtPrice ? Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100) : 0;

  return (
    <article
      className={cx(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-850/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-saffron-500/25 hover:shadow-[0_24px_50px_-30px_rgba(245,165,36,0.5)]',
        !item.isAvailable && 'opacity-65'
      )}
    >
      <div className="relative aspect-[5/4] overflow-hidden">
        <DishImage
          src={item.image}
          name={item.name}
          alt={item.name}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
          rounded="rounded-none"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/80 via-transparent to-transparent" />

        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {item.isBestseller && (
            <Badge tone="saffron" className="bg-ink-950/70 backdrop-blur-md">🔥 Bestseller</Badge>
          )}
          {discount > 0 && !item.isBestseller && (
            <Badge tone="green" className="bg-ink-950/70 backdrop-blur-md">{discount}% off</Badge>
          )}
        </div>

        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-md bg-ink-950/75 px-1.5 py-1 backdrop-blur-md">
          <VegMark isVeg={item.isVeg} />
          <SpiceLevel level={item.spiceLevel} />
        </div>

        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/55 backdrop-blur-[1px]">
            <span className="rounded-full border border-white/15 bg-ink-900/90 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cream-dim">
              Sold out today
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold leading-snug text-cream">{item.name}</h3>
          <Stars value={item.rating} size={11} className="mt-0.5 shrink-0" />
        </div>
        {!compact && (
          <p className="mt-1 line-clamp-2 min-h-[34px] text-[12px] leading-relaxed text-muted">{item.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
          <span>⏱ {item.prepTime} min</span>
          {item.calories ? <span>· {item.calories} kcal</span> : null}
          <span>· {item.ratingCount}+ ordered</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-lg font-semibold text-cream">{inr(item.price)}</span>
              {item.compareAtPrice ? (
                <span className="text-[12px] text-muted line-through">{inr(item.compareAtPrice)}</span>
              ) : null}
            </div>
          </div>
          {line ? (
            <div className="flex items-center overflow-hidden rounded-xl border border-saffron-500/40 bg-saffron-500/10">
              <button onClick={() => setQty(item.id, line.qty - 1)} aria-label="Remove one" className="flex h-9 w-9 items-center justify-center text-saffron-300 transition hover:bg-saffron-500/20">
                <Minus size={14} />
              </button>
              <span className="min-w-5 text-center text-sm font-bold tabular-nums text-cream">{line.qty}</span>
              <button onClick={() => add(item, 1)} aria-label="Add one" className="flex h-9 w-9 items-center justify-center text-saffron-300 transition hover:bg-saffron-500/20">
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              disabled={!item.isAvailable}
              onClick={() => add(item)}
              className="inline-flex h-9 items-center gap-1 rounded-xl bg-gradient-to-b from-saffron-400 to-saffron-600 px-3.5 text-[13px] font-bold text-ink-950 shadow-[0_8px_24px_-12px_rgba(245,165,36,0.8)] transition active:scale-95 disabled:from-ink-600 disabled:to-ink-700 disabled:text-muted disabled:shadow-none"
            >
              <Plus size={14} strokeWidth={3} /> {item.isAvailable ? 'Add' : 'Sold out'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
