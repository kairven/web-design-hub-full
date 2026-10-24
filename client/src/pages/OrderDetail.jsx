import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Bike, Check, ChefHat, CircleAlert, Clock3, MapPin, Phone, Receipt, RefreshCw, Star, XCircle,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { clock, cx, inr, timeAgo } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Avatar, Badge, Button, Card, ConfirmDialog, DishImage, Modal, Skeleton, Textarea, VegMark } from '../components/ui.jsx';
import OrderTimeline, { FLOW, STATUS_STYLES } from '../components/OrderTimeline.jsx';

export default function OrderDetail() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { add, setDrawerOpen } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const wasNew = useRef(params.get('new') === '1');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await api(`/orders/${code}`);
        if (alive) { setOrder(data.order); setError(''); }
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const interval = setInterval(() => {
      if (['delivered', 'cancelled'].includes(order?.status)) return;
      load();
    }, 20000);
    return () => { alive = false; clearInterval(interval); };
  }, [code, refreshKey, order?.status]);

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      const data = await api(`/orders/${order.id}/cancel`, { method: 'POST' });
      setOrder(data.order);
      setConfirmCancel(false);
      toast('Order cancelled. No charge applied.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const reorder = () => {
    order.items.forEach((it) => {
      if (it.menu_item_id) add({ id: it.menu_item_id, name: it.name, price: it.price, image: it.image, isVeg: true }, it.qty);
    });
    toast('Items added to your cart', 'success');
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <CircleAlert size={30} className="mx-auto text-chili-400" />
        <h1 className="mt-3 font-display text-xl font-semibold text-cream">We couldn't find that order</h1>
        <p className="mt-1 text-[13px] text-muted">{error || 'Check the order code and try again.'}</p>
        <Button className="mt-5" as={Link} to="/orders">Back to my orders</Button>
      </div>
    );
  }

  const meta = STATUS_STYLES[order.status] ?? STATUS_STYLES.placed;
  const isActive = ['placed', 'confirmed', 'preparing', 'picked_up', 'delivering'].includes(order.status);
  const canCancel = ['placed', 'confirmed'].includes(order.status);
  const stepIndex = FLOW.findIndex((f) => f.key === order.status);
  const placed = new Date(order.placedAt.replace(' ', 'T') + 'Z');
  const eta = new Date(placed.getTime() + order.etaMinutes * 60000);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted transition hover:text-cream">
        <ArrowLeft size={14} /> All orders
      </Link>

      {wasNew.current && order.status !== 'cancelled' && (
        <div className="animate-fade-up mt-4 flex items-start gap-3 rounded-2xl border border-mint-500/30 bg-mint-500/[0.08] px-4 py-3.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint-500 text-ink-950"><Check size={16} strokeWidth={3} /></span>
          <div>
            <p className="text-[13.5px] font-semibold text-cream">Order placed — thank you! 🙏</p>
            <p className="mt-0.5 text-[12px] text-cream-dim">
              Our kitchen has your order ({order.code}). We'll start cooking once confirmed. Estimated delivery by <b>{eta.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</b>.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-cream">{order.code}</h1>
            <Badge tone={meta.tone} dot>{meta.label}</Badge>
          </div>
          <p className="mt-1 text-[12.5px] text-muted">
            Placed {timeAgo(order.placedAt)} at {clock(order.placedAt)} · {order.items.reduce((s, i) => s + i.qty, 0)} items · {inr(order.total)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setRefreshKey((k) => k + 1)}><RefreshCw size={13} /> Refresh</Button>
          {isActive && (
            <Button size="sm" variant="soft" as="a" href="tel:+919194210086"><Phone size={13} /> Call kitchen</Button>
          )}
          {canCancel && <Button size="sm" variant="ghost" className="text-chili-400 hover:text-chili-400" onClick={() => setConfirmCancel(true)}>Cancel</Button>}
        </div>
      </div>

      {isActive && (
        <Card className="mt-5 overflow-hidden">
          <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] bg-gradient-to-r from-saffron-500/[0.12] to-transparent px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-saffron-500/15 text-saffron-300">
                <Bike size={20} />
                <span className="absolute inset-0 animate-ping rounded-xl bg-saffron-500/10" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-cream">
                  {order.status === 'delivering' ? 'Your food is on the way' : order.status === 'preparing' ? 'Freshly cooking in our kitchen' : 'We are getting your order ready'}
                </p>
                <p className="text-[11.5px] text-muted">Arriving in about {Math.max(5, Math.round((eta.getTime() - Date.now()) / 60000))} minutes</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Estimated arrival</p>
              <p className="font-display text-lg font-semibold text-saffron-300">
                {eta.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>
          <div className="px-5 py-4">
            <OrderTimeline order={order} />
          </div>
        </Card>
      )}

      {order.status === 'delivered' && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-ink-850/60 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500/15 text-mint-400"><Check size={16} /></span>
            <div>
              <p className="text-[12.5px] font-semibold text-cream">Delivered {timeAgo(order.updatedAt)}</p>
              <p className="text-[11.5px] text-muted">{order.paymentMethod === 'cod' ? 'Paid in cash' : 'Paid via UPI'} · {inr(order.total)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setReviewOpen(true)}><Star size={13} /> Rate order</Button>
            <Button size="sm" onClick={reorder}>Reorder</Button>
          </div>
        </div>
      )}

      {order.status === 'cancelled' && (
        <div className="mt-5">
          <OrderTimeline order={order} />
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <h2 className="flex items-center gap-2 font-display text-[14px] font-semibold text-cream"><Receipt size={15} className="text-saffron-400" /> Your dishes</h2>
              <span className="text-[11.5px] text-muted">{order.items.length} line items</span>
            </div>
            <ul className="divide-y divide-white/[0.05]">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 px-5 py-3">
                  <DishImage src={it.image} name={it.name} className="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <VegMark isVeg />
                      <p className="truncate text-[13px] font-medium text-cream">{it.name}</p>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-muted">{it.qty} × {inr(it.price)}</p>
                  </div>
                  <span className="text-[13px] font-semibold tabular-nums text-cream">{inr(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-white/[0.06] bg-white/[0.012] px-5 py-4 text-[12.5px]">
              <BillRow label="Item total" value={inr(order.subtotal)} />
              {order.discount > 0 && <BillRow label={`Coupon ${order.couponCode}`} value={`− ${inr(order.discount)}`} accent="text-mint-400" />}
              <BillRow label="Delivery" value={order.deliveryFee === 0 ? 'FREE' : inr(order.deliveryFee)} accent={order.deliveryFee === 0 ? 'text-mint-400' : undefined} />
              <BillRow label="Packaging" value={inr(order.packagingFee)} />
              <BillRow label="GST" value={inr(order.tax)} />
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-2 text-cream">
                <span className="font-semibold">Total ({order.paymentMethod === 'cod' ? 'cash' : 'UPI'})</span>
                <span className="font-display text-base font-semibold">{inr(order.total)}</span>
              </div>
            </div>
          </Card>

          {order.notes && (
            <Card className="p-4">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-muted">Your note</p>
              <p className="mt-1 text-[12.5px] text-cream-dim">“{order.notes}”</p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-[14px] font-semibold text-cream"><MapPin size={15} className="text-saffron-400" /> Delivering to</h2>
            <p className="mt-3 text-[13px] font-semibold text-cream">{order.address.name}</p>
            <p className="mt-0.5 text-[12px] text-muted">{order.address.phone}</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-cream-dim">
              {order.address.line1}, {order.address.area}, {order.address.city} — {order.address.pincode}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-[14px] font-semibold text-cream"><Bike size={15} className="text-saffron-400" /> Delivery partner</h2>
            {order.rider ? (
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={order.rider.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-cream">{order.rider.name}</p>
                  <p className="text-[11.5px] text-muted">{order.rider.vehicle} · ★ {order.rider.rating}</p>
                </div>
                <Button size="xs" variant="secondary" as="a" href={`tel:+91${order.rider.phone}`}><Phone size={12} /> Call</Button>
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-muted">
                A rider will be assigned as soon as your order is ready — average pickup in 12 minutes.
              </p>
            )}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-muted">
              <ChefHat size={13} className="text-saffron-500" /> Cooked by Zayka E Raebareli kitchen
            </div>
          </Card>

          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-ink-850/50 px-4 py-3 text-[11.5px] text-muted">
            <span className="flex items-center gap-1.5"><Clock3 size={12} /> Need help?</span>
            <a href="tel:+919194210086" className="font-semibold text-saffron-400 hover:text-saffron-300">+91 91942 10086</a>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancelOrder}
        loading={cancelling}
        title="Cancel this order?"
        message="If the kitchen has not started cooking, we'll cancel it free of charge. This cannot be undone."
        confirmLabel="Yes, cancel order"
      />

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        order={order}
        onDone={() => { setReviewOpen(false); toast('Thanks for the feedback! 🙏', 'success'); }}
      />
    </div>
  );
}

function BillRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={cx('tabular-nums text-cream-dim', accent)}>{value}</span>
    </div>
  );
}

function ReviewModal({ open, onClose, order, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await api(`/orders/${order.id}/review`, {
        method: 'POST',
        body: { rating, comment, dish: order.items[0]?.name },
      });
      onDone();
      setComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="How was your meal?" description="Your feedback helps our kitchen improve." size="sm"
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Not now</Button><Button onClick={submit} loading={saving}>Submit review</Button></div>}
    >
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} star`} className="transition hover:scale-110">
            <Star size={30} className={cx('transition', n <= rating ? 'fill-saffron-400 text-saffron-400' : 'text-ink-500')} />
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-[12px] text-muted">
        {['Very poor', 'Poor', 'Decent', 'Good', 'Excellent'][rating - 1]}
      </p>
      <div className="mt-4">
        <Textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 400))} placeholder="Tell us about the taste, packaging, delivery…" />
      </div>
      {error && <p className="mt-2 text-[12px] text-chili-400">{error}</p>}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
        <XCircle size={11} className="opacity-0" /> Your review appears publicly with your first name.
      </div>
    </Modal>
  );
}
