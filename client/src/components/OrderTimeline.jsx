import { Check, ChefHat, ClipboardCheck, Home, Navigation, ReceiptText, XCircle } from 'lucide-react';
import { cx, clock } from '../lib/format.js';

export const FLOW = [
  { key: 'placed', label: 'Order placed', desc: 'We received your order', icon: ReceiptText },
  { key: 'confirmed', label: 'Confirmed', desc: 'Kitchen accepted it', icon: ClipboardCheck },
  { key: 'preparing', label: 'Cooking', desc: 'Fresh, made to order', icon: ChefHat },
  { key: 'picked_up', label: 'Picked up', desc: 'Rider has your food', icon: Navigation },
  { key: 'delivering', label: 'On the way', desc: 'Arriving shortly', icon: Navigation },
  { key: 'delivered', label: 'Delivered', desc: 'Enjoy your meal!', icon: Home },
];

export const STATUS_STYLES = {
  placed: { tone: 'amber', label: 'Placed' },
  confirmed: { tone: 'blue', label: 'Confirmed' },
  preparing: { tone: 'saffron', label: 'Cooking' },
  picked_up: { tone: 'violet', label: 'Picked up' },
  delivering: { tone: 'blue', label: 'On the way' },
  delivered: { tone: 'green', label: 'Delivered' },
  cancelled: { tone: 'red', label: 'Cancelled' },
};

export default function OrderTimeline({ order, compact = false }) {
  const cancelled = order.status === 'cancelled';
  const currentIndex = cancelled ? -1 : FLOW.findIndex((s) => s.key === order.status);
  const eventByStatus = Object.fromEntries((order.events || []).map((e) => [e.status, e]));

  if (cancelled) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-chili-500/25 bg-chili-500/[0.07] px-4 py-3">
        <XCircle size={18} className="mt-0.5 shrink-0 text-chili-400" />
        <div>
          <p className="text-[13px] font-semibold text-chili-400">Order cancelled</p>
          <p className="mt-0.5 text-[12px] text-muted">
            {order.events?.find((e) => e.status === 'cancelled')?.note || 'This order was cancelled.'}
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {FLOW.map((step, i) => {
          const done = i <= currentIndex;
          return (
            <div key={step.key} className="flex flex-1 items-center gap-1.5">
              <span className={cx('h-1.5 flex-1 rounded-full', done ? 'bg-saffron-500' : 'bg-white/10')} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {FLOW.map((step, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        const event = eventByStatus[step.key];
        const Icon = step.icon;
        return (
          <li key={step.key} className="relative flex gap-3.5 pb-5 last:pb-0">
            {i < FLOW.length - 1 && (
              <span
                className={cx('absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 rounded', done && i < currentIndex ? 'bg-saffron-500/60' : 'bg-white/[0.07]')}
              />
            )}
            <span
              className={cx(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition',
                done
                  ? 'border-saffron-500/50 bg-saffron-500/15 text-saffron-300'
                  : 'border-white/10 bg-ink-800 text-muted',
                active && 'ring-4 ring-saffron-500/15'
              )}
            >
              {done && !active ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
            </span>
            <div className="pt-0.5">
              <p className={cx('text-[13px] font-semibold', done ? 'text-cream' : 'text-muted')}>
                {step.label}
                {active && <span className="ml-2 rounded-full bg-saffron-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-saffron-300">Now</span>}
              </p>
              <p className="mt-0.5 text-[11.5px] text-muted">{event?.note || step.desc}</p>
              {event?.created_at && <p className="mt-0.5 text-[10.5px] tabular-nums text-muted/70">{clock(event.created_at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
