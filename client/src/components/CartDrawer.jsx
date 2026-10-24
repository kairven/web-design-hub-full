import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Bike, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { previewCart, useStore } from '../context/StoreContext.jsx';
import { api } from '../lib/api.js';
import { cx, inr } from '../lib/format.js';
import { Button, DishImage, Drawer, EmptyState, Spinner, VegMark } from './ui.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function CartDrawer() {
  const { lines, setQty, remove, drawerOpen, setDrawerOpen, coupon, setCoupon, zone, subtotal } = useCart();
  const { restaurant } = useStore();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [couponError, setCouponError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (drawerOpen) setCode(coupon?.code ?? '');
  }, [drawerOpen, coupon]);

  const quote = previewCart({ lines, zone, restaurant, coupon });
  const freeGap = Math.max(0, quote.freeAbove - subtotal);
  const progress = Math.min(100, (subtotal / quote.freeAbove) * 100);
  const belowMinimum = subtotal > 0 && subtotal < (restaurant?.minOrder ?? 0);

  const applyCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setApplying(true);
    setCouponError('');
    try {
      const data = await api('/coupons/validate', { method: 'POST', body: { code: code.trim(), subtotal } });
      setCoupon(data);
      toast(`${data.code} applied — ${inr(data.discount)} off`, 'success');
    } catch (err) {
      setCouponError(err.message);
      setCoupon(null);
    } finally {
      setApplying(false);
    }
  };

  const goCheckout = () => {
    setDrawerOpen(false);
    navigate('/checkout');
  };

  return (
    <Drawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      title={
        <span className="flex items-center gap-2">
          Your order <span className="text-sm font-normal text-muted">({lines.length} dish{lines.length === 1 ? '' : 'es'})</span>
        </span>
      }
      footer={
        lines.length > 0 ? (
          <div className="space-y-3">
            <div className="space-y-1.5 text-[13px]">
              <Row label="Item total" value={inr(quote.subtotal)} />
              {quote.discount > 0 && <Row label={`Discount (${coupon?.code})`} value={`− ${inr(quote.discount)}`} accent="text-mint-400" />}
              <Row
                label={`Delivery · ${zone}`}
                value={quote.deliveryFee === 0 ? 'FREE' : inr(quote.deliveryFee)}
                accent={quote.deliveryFee === 0 ? 'text-mint-400' : undefined}
              />
              <Row label="Packaging" value={inr(quote.packagingFee)} />
              <Row label={`GST (${quote.taxPercent}%)`} value={inr(quote.tax)} />
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-2 font-semibold text-cream">
                <span>To pay</span><span className="font-display text-base">{inr(quote.total)}</span>
              </div>
            </div>
            {belowMinimum && (
              <p className="rounded-lg bg-chili-500/10 px-3 py-2 text-[12px] text-chili-400">
                Minimum order is {inr(restaurant?.minOrder)}. Add {inr((restaurant?.minOrder ?? 0) - subtotal)} more.
              </p>
            )}
            <Button size="lg" className="w-full" onClick={goCheckout} disabled={belowMinimum}>
              Checkout · {inr(quote.total)}
            </Button>
            <p className="text-center text-[11px] text-muted">COD or UPI on delivery · no hidden charges</p>
          </div>
        ) : null
      }
    >
      {lines.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={ShoppingBag}
            title="Your thali is empty"
            description="Biryani, rolls, lollypops — your favourites are a tap away."
            action={<Button onClick={() => { setDrawerOpen(false); navigate('/menu'); }}>Browse the menu</Button>}
          />
        </div>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {freeGap > 0 ? (
            <div className="bg-saffron-500/[0.06] px-5 py-3">
              <p className="text-[12px] text-saffron-300">
                Add <b>{inr(freeGap)}</b> more for free delivery 🛵
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-saffron-500 to-saffron-300 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-mint-500/[0.07] px-5 py-2.5 text-[12px] font-semibold text-mint-400">
              <Bike size={14} /> You've unlocked free delivery in {zone}
            </div>
          )}

          <ul className="divide-y divide-white/[0.05]">
            {lines.map((line) => (
              <li key={line.id} className="flex gap-3 px-5 py-3.5">
                <DishImage src={line.image} name={line.name} className="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-1.5">
                    <VegMark isVeg={line.isVeg} />
                    <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-cream">{line.name}</p>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted">{inr(line.price)} each</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex h-8 items-center overflow-hidden rounded-lg border border-white/10 bg-ink-800">
                      <button onClick={() => setQty(line.id, line.qty - 1)} className="h-full w-8 text-saffron-300 transition hover:bg-white/5" aria-label="Decrease">−</button>
                      <span className="min-w-6 text-center text-[13px] font-bold tabular-nums">{line.qty}</span>
                      <button onClick={() => setQty(line.id, line.qty + 1)} className="h-full w-8 text-saffron-300 transition hover:bg-white/5" aria-label="Increase">+</button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold text-cream">{inr(line.price * line.qty)}</span>
                      <button onClick={() => remove(line.id)} className="text-muted transition hover:text-chili-400" aria-label={`Remove ${line.name}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="px-5 py-4">
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl border border-mint-500/25 bg-mint-500/[0.08] px-3 py-2.5">
                <div className="flex items-center gap-2 text-[12.5px]">
                  <BadgeCheck size={15} className="text-mint-400" />
                  <span className="font-bold text-mint-400">{coupon.code}</span>
                  <span className="text-muted">applied</span>
                </div>
                <button
                  onClick={() => { setCoupon(null); setCode(''); }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-muted transition hover:text-cream"
                >
                  <X size={12} /> Remove
                </button>
              </div>
            ) : (
              <form onSubmit={applyCoupon}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      value={code}
                      onChange={(e) => { setCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      placeholder="Coupon code"
                      className="h-10 w-full rounded-xl border border-white/10 bg-ink-800 pl-9 pr-3 text-[12.5px] font-semibold uppercase tracking-wide text-cream placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/70 focus:border-saffron-500/50 focus:outline-none"
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="sm" className="h-10 px-4" loading={applying}>
                    Apply
                  </Button>
                </div>
                {couponError ? (
                  <p className="mt-1.5 text-[11.5px] text-chili-400">{couponError}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCode('ZAYKA50')}
                    className="mt-1.5 flex items-center gap-1 text-[11px] text-muted transition hover:text-saffron-400"
                  >
                    {applying ? <Spinner size={11} /> : null} Try <b className="text-saffron-400">ZAYKA50</b> — ₹50 off above ₹199
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between text-cream-dim">
      <span className="text-muted">{label}</span>
      <span className={cx('tabular-nums', accent)}>{value}</span>
    </div>
  );
}
