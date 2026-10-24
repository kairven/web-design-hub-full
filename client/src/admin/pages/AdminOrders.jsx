import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bike, Check, CheckCircle2, ChefHat, Clock3, Filter, MapPin, Phone, RefreshCw, Search, ShoppingBag, Stamp, X, XCircle,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { clock, cx, inr, timeAgo } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Avatar, Badge, Button, Card, DishImage, Drawer, EmptyState, RowSkeleton, Select, Spinner, Textarea,
} from '../../components/ui.jsx';
import OrderTimeline, { STATUS_STYLES } from '../../components/OrderTimeline.jsx';

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'placed', label: 'New' },
  { value: 'preparing', label: 'Cooking' },
  { value: 'delivering', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];

const NEXT = {
  placed: 'confirmed',
  confirmed: 'preparing',
  preparing: 'picked_up',
  picked_up: 'delivering',
  delivering: 'delivered',
};

const NEXT_COPY = {
  placed: 'Accept order',
  confirmed: 'Start cooking',
  preparing: 'Mark picked up',
  picked_up: 'Out for delivery',
  delivering: 'Mark delivered',
};

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(params.get('id') ? Number(params.get('id')) : null);
  const [busyId, setBusyId] = useState(null);
  const { toast } = useToast();
  const firstLoad = useRef(true);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const [o, r] = await Promise.all([
        api(`/admin/orders?status=${tab}`),
        api('/admin/riders'),
      ]);
      setOrders(o.orders);
      setRiders(r.riders);
      setLoading(false);
      firstLoad.current = false;
    } catch (err) {
      toast(err.message, 'error');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, [tab, toast]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => {
    const i = setInterval(() => load(true), 30000);
    return () => clearInterval(i);
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) => o.code.toLowerCase().includes(q) || o.customer?.name.toLowerCase().includes(q) || o.customer?.phone.includes(q)
    );
  }, [orders, search]);

  const selected = orders.find((o) => o.id === selectedId) || null;

  const openOrder = (id) => {
    setSelectedId(id);
    const next = new URLSearchParams(params);
    next.set('id', String(id));
    setParams(next, { replace: true });
  };
  const closeOrder = () => {
    setSelectedId(null);
    const next = new URLSearchParams(params);
    next.delete('id');
    setParams(next, { replace: true });
  };

  const patchStatus = async (order, status) => {
    setBusyId(order.id);
    const prev = orders;
    // optimistic
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
    try {
      const data = await api(`/admin/orders/${order.id}/status`, { method: 'PATCH', body: { status } });
      setOrders((list) => list.map((o) => (o.id === order.id ? data.order : o)));
      toast(`${order.code} → ${STATUS_STYLES[status]?.label ?? status}`, 'success');
      if (status === 'delivered') load(true);
    } catch (err) {
      setOrders(prev);
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const assignRider = async (order, riderId) => {
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, rider_id: riderId } : o)));
    try {
      const data = await api(`/admin/orders/${order.id}/rider`, { method: 'PATCH', body: { riderId: riderId || null } });
      setOrders((list) => list.map((o) => (o.id === order.id ? data.order : o)));
      const rider = riders.find((r) => r.id === Number(riderId));
      toast(rider ? `${rider.name} assigned to ${order.code}` : 'Rider removed', rider ? 'success' : 'info');
    } catch (err) {
      toast(err.message, 'error');
      load(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.07] bg-ink-800/60 p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setLoading(true); }}
              className={cx(
                'rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition',
                tab === t.value ? 'bg-saffron-500 text-ink-950' : 'text-muted hover:text-cream'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[180px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order code, name, phone…"
            className="h-10 w-full rounded-xl border border-white/10 bg-ink-800/70 pl-9 pr-3 text-[12.5px] text-cream placeholder:text-muted/70 focus:border-saffron-500/50 focus:outline-none"
          />
        </div>
        <Button size="sm" variant="secondary" onClick={() => load()} loading={refreshing}>
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1.1fr_1fr_.7fr_.7fr_.6fr_auto] gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted lg:grid">
          <span>Order</span><span>Items</span><span>Customer</span><span>Total</span><span>Status</span><span className="text-right">Action</span>
        </div>

        {loading ? (
          <div className="p-4"><RowSkeleton rows={6} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={ShoppingBag}
              title={tab === 'active' ? 'No live orders' : 'Nothing here'}
              description={tab === 'active' ? 'New orders will land here the moment a customer checks out.' : 'Try another filter or search term.'}
            />
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {filtered.map((o) => {
              const meta = STATUS_STYLES[o.status] ?? STATUS_STYLES.placed;
              const next = NEXT[o.status];
              return (
                <div
                  key={o.id}
                  className={cx('group grid cursor-pointer gap-3 px-4 py-3 transition hover:bg-white/[0.025] lg:grid-cols-[1.1fr_1fr_.7fr_.7fr_.6fr_auto] lg:items-center',
                    selectedId === o.id && 'bg-saffron-500/[0.06]')}
                  onClick={() => openOrder(o.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      o.status === 'placed' ? 'bg-saffron-500/15 text-saffron-300' : 'bg-white/[0.04] text-cream-dim')}>
                      {o.status === 'delivering' ? <Bike size={14} /> : o.status === 'preparing' ? <ChefHat size={14} /> : <ShoppingBag size={13} />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-cream">{o.code}</p>
                      <p className="flex items-center gap-1 text-[10.5px] text-muted"><Clock3 size={9} /> {timeAgo(o.placedAt)} · {clock(o.placedAt)}</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] text-cream-dim">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</p>
                    <p className="text-[10.5px] text-muted">{o.items.reduce((s, i) => s + i.qty, 0)} items · {o.address.area}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] text-cream-dim">{o.customer?.name}</p>
                    <p className="text-[10.5px] text-muted">+91 {o.customer?.phone}</p>
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold text-cream">{inr(o.total)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted">{o.paymentMethod === 'cod' ? 'Cash' : 'UPI'}</p>
                  </div>

                  <div><Badge tone={meta.tone} dot>{meta.label}</Badge></div>

                  <div className="flex items-center justify-end gap-1.5">
                    {next && (
                      <Button
                        size="xs"
                        variant={o.status === 'placed' ? 'primary' : 'secondary'}
                        loading={busyId === o.id}
                        onClick={(e) => { e.stopPropagation(); patchStatus(o, next); }}
                      >
                        {o.status === 'placed' ? <Check size={12} /> : null}
                        {NEXT_COPY[o.status]}
                      </Button>
                    )}
                    <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); openOrder(o.id); }}>Open</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        <Spinner size={11} className="text-muted" /> Auto-refreshes every 30 seconds · click any row for the full order
      </p>

      <OrderPanel
        order={selected}
        riders={riders}
        busy={busyId === selected?.id}
        onClose={closeOrder}
        onAdvance={(order) => patchStatus(order, NEXT[order.status])}
        onStatus={(order, status) => patchStatus(order, status)}
        onAssign={assignRider}
      />
    </div>
  );
}

function OrderPanel({ order, riders, busy, onClose, onAdvance, onStatus, onAssign }) {
  const [note, setNote] = useState('');
  const { toast } = useToast();
  if (!order) return null;
  const meta = STATUS_STYLES[order.status] ?? STATUS_STYLES.placed;
  const next = NEXT[order.status];

  return (
    <Drawer
      open={!!order}
      onClose={onClose}
      width="md"
      title={
        <span className="flex flex-wrap items-center gap-2">
          {order.code}
          <Badge tone={meta.tone} dot>{meta.label}</Badge>
        </span>
      }
      footer={
        <div className="space-y-2">
          {next ? (
            <Button className="w-full" onClick={() => onAdvance(order)} loading={busy}>
              {NEXT_COPY[order.status]} <Check size={15} />
            </Button>
          ) : (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-center text-[12px] text-muted">
              This order is {meta.label.toLowerCase()}. No further action needed.
            </div>
          )}
          {!['delivered', 'cancelled'].includes(order.status) && (
            <Button variant="ghost" size="sm" className="w-full text-chili-400 hover:text-chili-400" onClick={() => onStatus(order, 'cancelled')}>
              <XCircle size={13} /> Cancel order
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total', value: inr(order.total) },
            { label: 'Payment', value: order.paymentMethod === 'cod' ? 'Cash' : 'UPI' },
            { label: 'ETA', value: `${order.etaMinutes} min` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-ink-800/50 px-3 py-2">
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-muted">{s.label}</p>
              <p className="mt-0.5 text-[13px] font-semibold text-cream">{s.value}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-widest text-muted">Progress</p>
          <OrderTimeline order={order} />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-ink-800/40 p-3.5">
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-widest text-muted">Items</p>
          <ul className="space-y-2">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-2.5">
                <DishImage src={it.image} name={it.name} className="h-9 w-9 rounded-lg" />
                <p className="min-w-0 flex-1 truncate text-[12px] text-cream-dim">{it.qty} × {it.name}</p>
                <span className="text-[12px] font-semibold text-cream">{inr(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-2 text-[11.5px]">
            <PanelRow label="Subtotal" value={inr(order.subtotal)} />
            {order.discount > 0 && <PanelRow label={`Discount ${order.couponCode ?? ''}`} value={`− ${inr(order.discount)}`} accent="text-mint-400" />}
            <PanelRow label="Delivery" value={order.deliveryFee === 0 ? 'FREE' : inr(order.deliveryFee)} />
            <PanelRow label="Packaging + GST" value={inr(order.packagingFee + order.tax)} />
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-1.5 font-semibold text-cream">
              <span>Total</span><span>{inr(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-ink-800/40 p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted"><MapPin size={11} /> Deliver to</p>
          <p className="text-[12.5px] font-semibold text-cream">{order.address.name} <span className="font-normal text-muted">· {order.address.phone}</span></p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{order.address.line1}, {order.address.area}, {order.address.city} {order.address.pincode}</p>
          <div className="mt-2.5 flex gap-2">
            <Button size="xs" variant="secondary" as="a" href={`tel:+91${order.address.phone}`}><Phone size={11} /> Call customer</Button>
            <Button size="xs" variant="ghost" as="a" href={`https://www.google.com/maps/search/${encodeURIComponent(`${order.address.line1}, ${order.address.area}, Raebareli`)}`} target="_blank" rel="noreferrer">
              <MapPin size={11} /> Map
            </Button>
          </div>
          {order.notes && <p className="mt-2.5 rounded-lg bg-saffron-500/[0.07] px-2.5 py-2 text-[11.5px] text-saffron-200">“{order.notes}”</p>}
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-ink-800/40 p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted"><Bike size={11} /> Rider</p>
          {order.rider && (
            <div className="mb-2.5 flex items-center gap-2.5">
              <Avatar name={order.rider.name} size={30} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-cream">{order.rider.name}</p>
                <p className="text-[10.5px] text-muted">{order.rider.vehicle}</p>
              </div>
              <Button size="xs" variant="secondary" as="a" href={`tel:+91${order.rider.phone}`}><Phone size={11} /></Button>
            </div>
          )}
          <Select value={order.rider?.id ?? ''} onChange={(e) => onAssign(order, e.target.value ? Number(e.target.value) : null)}>
            <option value="">Unassigned</option>
            {riders.map((r) => (
              <option key={r.id} value={r.id}>{r.name} · {r.zone} ({r.status})</option>
            ))}
          </Select>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-ink-800/40 p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted"><Stamp size={11} /> Payment</p>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-cream-dim capitalize">{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'UPI on delivery'}</span>
            <Badge tone={order.paymentStatus === 'paid' ? 'green' : 'amber'}>{order.paymentStatus === 'paid' ? 'Collected' : 'Due on delivery'}</Badge>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function PanelRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={cx('tabular-nums text-cream-dim', accent)}>{value}</span>
    </div>
  );
}
