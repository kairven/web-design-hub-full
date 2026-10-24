import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Clock3, PackageOpen, Receipt, RotateCcw, ShoppingBag, Truck } from 'lucide-react';
import { api } from '../lib/api.js';
import { clock, cx, inr, timeAgo } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Badge, Button, Card, DishImage, EmptyState, RowSkeleton, SegmentedControl, Spinner } from '../components/ui.jsx';
import { STATUS_STYLES, FLOW } from '../components/OrderTimeline.jsx';

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'past', label: 'Past orders' },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('active');
  const navigate = useNavigate();
  const { add, setDrawerOpen } = useCart();
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await api('/orders');
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const active = useMemo(() => orders.filter((o) => ['placed', 'confirmed', 'preparing', 'picked_up', 'delivering'].includes(o.status)), [orders]);
  const list = tab === 'active' ? active : orders;

  const reorder = (order) => {
    order.items.forEach((it) => {
      if (it.menu_item_id) add({ id: it.menu_item_id, name: it.name, price: it.price, image: it.image, isVeg: true, slug: 'reorder' }, it.qty);
    });
    toast('Added to cart — same order, one tap checkout', 'success');
    setDrawerOpen(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron-500">Your account</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-cream sm:text-3xl">My orders</h1>
          <p className="mt-1 text-[13px] text-muted">Track live orders and reorder your favourites in one tap.</p>
        </div>
        <Button variant="secondary" as={Link} to="/menu"><ShoppingBag size={15} /> Order something new</Button>
      </div>

      {active.length > 0 && (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-saffron-500/25 bg-saffron-500/[0.07] px-4 py-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-saffron-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-saffron-500" />
          </span>
          <p className="text-[12.5px] text-saffron-200">
            <b>{active.length}</b> order{active.length > 1 ? 's' : ''} on the way —{' '}
            <Link to={`/orders/${active[0].code}`} className="underline decoration-saffron-500/40 underline-offset-2 hover:text-cream">
              track {active[0].code.split('-')[0]}
            </Link>
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
        <p className="text-[11.5px] text-muted">{list.length} order{list.length === 1 ? '' : 's'}</p>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <RowSkeleton rows={4} />
        ) : error ? (
          <Card className="p-5 text-[13px] text-chili-400">{error}</Card>
        ) : list.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title={tab === 'active' ? 'No live orders right now' : 'No orders yet'}
            description={tab === 'active' ? 'When you place an order, you can follow it here from kitchen to doorstep.' : 'Your order history will show up here — start with a dum biryani.'}
            action={<Button onClick={() => navigate('/menu')}>Explore the menu</Button>}
          />
        ) : (
          list.map((order) => {
            const meta = STATUS_STYLES[order.status] ?? STATUS_STYLES.placed;
            const stepIndex = FLOW.findIndex((f) => f.key === order.status);
            const isActive = ['placed', 'confirmed', 'preparing', 'picked_up', 'delivering'].includes(order.status);
            return (
              <Card key={order.id} className="group overflow-hidden transition hover:border-white/15">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] bg-white/[0.015] px-4 py-2.5">
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className="font-semibold text-cream">{order.code}</span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">{timeAgo(order.placedAt)}</span>
                  </div>
                  <Badge tone={meta.tone} dot>{meta.label}</Badge>
                </div>

                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex -space-x-2.5">
                    {order.items.slice(0, 3).map((it) => (
                      <DishImage key={it.id} src={it.image} name={it.name} className="h-12 w-12 ring-2 ring-ink-850" />
                    ))}
                    {order.items.length > 3 && (
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-700 text-[11px] font-bold text-cream-dim ring-2 ring-ink-850">
                        +{order.items.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-cream">
                      {order.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted">
                      <span className="font-semibold text-cream-dim">{inr(order.total)}</span>
                      <span>· {order.items.reduce((s, i) => s + i.qty, 0)} items</span>
                      <span>· {order.address.area}</span>
                      <span>· {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'UPI on delivery'}</span>
                    </p>
                    {isActive && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex h-1 w-28 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-saffron-500 to-saffron-300 transition-all" style={{ width: `${((stepIndex + 1) / FLOW.length) * 100}%` }} />
                        </div>
                        <span className="flex items-center gap-1 text-[10.5px] text-saffron-300">
                          <Truck size={11} /> {FLOW[Math.max(stepIndex, 0)]?.label} · {order.etaMinutes} min ETA
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                    <Button size="sm" variant={isActive ? 'primary' : 'secondary'} as={Link} to={`/orders/${order.code}`}>
                      {isActive ? 'Track order' : 'View details'} <ChevronRight size={13} />
                    </Button>
                    {order.status === 'delivered' ? (
                      <Button size="sm" variant="ghost" onClick={() => reorder(order)}><RotateCcw size={13} /> Reorder</Button>
                    ) : (
                      <span className="flex items-center justify-center gap-1 px-2 text-[10.5px] text-muted">
                        <Clock3 size={11} /> {clock(order.placedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
