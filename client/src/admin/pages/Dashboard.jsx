import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Bike, ChefHat, CircleDollarSign, Clock3, Flame, IndianRupee, PackageCheck, ShoppingBag,
  Star, TrendingUp, Users, Utensils,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { clock, cx, inr, shortInr, timeAgo } from '../../lib/format.js';
import { Badge, Button, Card, EmptyState, RowSkeleton, SectionTitle, Skeleton, StatCard } from '../../components/ui.jsx';
import { STATUS_STYLES } from '../../components/OrderTimeline.jsx';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api('/admin/stats'), api('/admin/orders?status=active')])
      .then(([s, o]) => { setData(s); setOrders(o.orders); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Card className="p-5 text-[13px] text-chili-400">{error}</Card>;

  const rawDays = data?.byDay ?? [];
  // Pad the last 7 calendar days so the chart reads as a proper week.
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const found = rawDays.find((x) => x.day === key);
    return { day: key, orders: found?.orders ?? 0, revenue: found?.revenue ?? 0 };
  });
  const maxRevenue = Math.max(1, ...days.map((d) => d.revenue));
  const weekRevenue = days.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Today's revenue" value={shortInr(data.today.revenue)} sub={`${data.today.orders} orders today`} icon={IndianRupee} tone="green"
              trend={<span className="flex items-center gap-1 text-[10.5px] text-mint-400"><TrendingUp size={11} /> Live from the kitchen</span>} />
            <StatCard label="Orders in progress" value={data.activeOrders} sub="Across the kitchen" icon={Flame} tone="saffron"
              trend={<Link to="/admin/orders" className="flex items-center gap-1 text-[10.5px] font-semibold text-saffron-400">Open board <ArrowUpRight size={11} /></Link>} />
            <StatCard label="Avg. order value" value={inr(data.allTime.aov)} sub={`${data.allTime.orders} lifetime orders`} icon={CircleDollarSign} tone="blue" />
            <StatCard label="Guest rating" value={`${data.rating.average} ★`} sub={`${data.rating.count} reviews`} icon={Star} tone="violet" />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr] xl:items-start">
        {/* Revenue chart */}
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-muted">Last 7 days</p>
              <p className="mt-1 font-display text-xl font-semibold text-cream">{shortInr(weekRevenue)} <span className="text-[12px] font-normal text-muted">revenue</span></p>
            </div>
            <Badge tone="green" dot>Raebareli only</Badge>
          </div>

          {loading ? (
            <Skeleton className="mt-6 h-40 w-full" />
          ) : (
            <div className="mt-6 flex h-44 items-end gap-2.5">
              {days.map((d) => {
                const h = Math.max(6, (d.revenue / maxRevenue) * 100);
                const isToday = d.day === new Date().toISOString().slice(0, 10);
                return (
                  <div key={d.day} className="group flex flex-1 flex-col items-center gap-2">
                    <div className="relative flex w-full flex-1 items-end">
                      <div
                        className={cx(
                          'w-full rounded-t-lg transition-all duration-500',
                          isToday ? 'bg-gradient-to-t from-saffron-600 to-saffron-300' : 'bg-white/[0.09] group-hover:bg-white/20'
                        )}
                        style={{ height: `${h}%` }}
                      />
                      <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-700 px-2 py-1 text-[10px] font-semibold text-cream group-hover:block">
                        {inr(d.revenue)} · {d.orders}
                      </div>
                    </div>
                    <span className={cx('text-[10px]', isToday ? 'font-bold text-saffron-400' : 'text-muted')}>
                      {new Date(d.day).toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
              {days.length === 0 && <p className="text-[12px] text-muted">No orders yet this week.</p>}
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)
            ) : (
              [
                { label: 'Lifetime revenue', value: shortInr(data.allTime.revenue), icon: TrendingUp },
                { label: 'Customers', value: data.customers, icon: Users },
                { label: 'Menu live', value: `${data.menu.available}/${data.menu.total}`, icon: Utensils },
              ].map((s) => (
                <div key={s.label}>
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted"><s.icon size={10} /> {s.label}</p>
                  <p className="mt-1 text-[15px] font-semibold text-cream">{s.value}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Top items */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[14px] font-semibold text-cream">Bestsellers</h2>
            <Link to="/admin/menu" className="text-[11px] font-semibold text-saffron-400">Manage</Link>
          </div>
          <div className="mt-3 space-y-1">
            {loading ? <RowSkeleton rows={4} /> : data.topItems.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3 rounded-lg px-1 py-2">
                <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                  i === 0 ? 'bg-saffron-500 text-ink-950' : 'bg-white/[0.05] text-muted')}>{i + 1}</span>
                <p className="min-w-0 flex-1 truncate text-[12px] text-cream-dim">{item.name}</p>
                <span className="text-[11px] font-semibold text-cream">{item.qty} sold</span>
              </div>
            ))}
            {!loading && data.topItems.length === 0 && <p className="py-4 text-[12px] text-muted">No sales data yet.</p>}
          </div>
          <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted"><ChefHat size={11} className="text-saffron-500" /> Kitchen tip</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-cream-dim/80">
              Tawa roti and Mughlai paratha sell out fastest after 8 PM. Keep a prep batch ready.
            </p>
          </div>
        </Card>
      </div>

      {/* Active orders */}
      <Card>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[14px] font-semibold text-cream">Needs your attention</h2>
            {orders.length > 0 && <Badge tone="saffron">{orders.length} live</Badge>}
          </div>
          <Link to="/admin/orders" className="flex items-center gap-1 text-[11.5px] font-semibold text-saffron-400">Full board <ArrowUpRight size={12} /></Link>
        </div>

        {loading ? (
          <div className="p-4"><RowSkeleton rows={3} /></div>
        ) : orders.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={PackageCheck} title="All caught up" description="No live orders right now. New orders will appear here instantly." />
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {orders.slice(0, 5).map((o) => {
              const meta = STATUS_STYLES[o.status] ?? STATUS_STYLES.placed;
              return (
                <button
                  key={o.id}
                  onClick={() => navigate(`/admin/orders?id=${o.id}`)}
                  className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-left transition hover:bg-white/[0.025]"
                >
                  <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    o.status === 'placed' ? 'bg-saffron-500/15 text-saffron-300' : 'bg-white/[0.04] text-cream-dim')}>
                    {o.status === 'delivering' ? <Bike size={16} /> : o.status === 'preparing' ? <Flame size={16} /> : <ShoppingBag size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-cream">{o.code} <span className="font-normal text-muted">· {o.customer?.name}</span></p>
                    <p className="truncate text-[11px] text-muted">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</p>
                  </div>
                  <span className="hidden text-[11px] text-muted sm:block">{o.address.area}</span>
                  <span className="text-[12.5px] font-semibold text-cream">{inr(o.total)}</span>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <span className="hidden items-center gap-1 text-[10.5px] text-muted sm:flex"><Clock3 size={10} /> {timeAgo(o.placedAt)}</span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { to: '/admin/menu', icon: ChefHat, title: 'Update the menu', copy: 'Mark dishes sold out or change prices in seconds.' },
          { to: '/admin/coupons', icon: TrendingUp, title: 'Launch an offer', copy: 'Create a coupon for a slow evening.' },
          { to: '/admin/riders', icon: Bike, title: 'Manage riders', copy: 'Assign the nearest rider to live orders.' },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="group rounded-2xl border border-white/[0.06] bg-ink-850/60 p-4 transition hover:border-saffron-500/25 hover:bg-ink-800/60">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-500/12 text-saffron-400"><c.icon size={16} /></span>
            <p className="mt-3 text-[13px] font-semibold text-cream">{c.title}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{c.copy}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
