import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, ChefHat, ExternalLink, LayoutDashboard, LogOut, Menu, Percent, Settings as SettingsIcon,
  ShoppingBag, Store, Users, Bike as BikeIcon, X, Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { api } from '../lib/api.js';
import { cx } from '../lib/format.js';
import { Avatar, Badge } from '../components/ui.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Live orders', icon: ShoppingBag },
  { to: '/admin/menu', label: 'Menu manager', icon: ChefHat },
  { to: '/admin/coupons', label: 'Offers', icon: Percent },
  { to: '/admin/riders', label: 'Riders', icon: BikeIcon },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

const TITLES = {
  '/admin': { title: 'Dashboard', sub: 'Today at Zayka E Raebareli' },
  '/admin/orders': { title: 'Live orders', sub: 'Move orders through the kitchen' },
  '/admin/menu': { title: 'Menu manager', sub: 'Dishes, prices and availability' },
  '/admin/coupons': { title: 'Offers & coupons', sub: 'Discounts running in Raebareli' },
  '/admin/riders': { title: 'Delivery riders', sub: 'Your Raebareli delivery fleet' },
  '/admin/customers': { title: 'Customers', sub: 'Everyone ordering from Zayka' },
  '/admin/settings': { title: 'Settings', sub: 'Restaurant, fees and delivery zones' },
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { kitchenOpen, setKitchenOpen } = useStore();
  const [open, setOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const meta = TITLES[location.pathname] || TITLES['/admin'];

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const data = await api('/admin/orders?status=active');
        if (alive) setActiveCount(data.orders.length);
      } catch { /* ignore polling errors */ }
    };
    tick();
    const i = setInterval(tick, 30000);
    return () => { alive = false; clearInterval(i); };
  }, []);

  const toggleKitchen = async () => {
    const next = !kitchenOpen;
    setKitchenOpen(next);
    try {
      await api('/admin/settings', { method: 'PATCH', body: { kitchenOpen: next } });
    } catch {
      setKitchenOpen(!next);
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <img src="/brand/mark.svg" alt="" className="h-9 w-9" />
        <div className="min-w-0">
          <p className="truncate font-display text-[14px] font-semibold text-cream">Zayka E Raebareli</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">Restaurant OS</p>
        </div>
        <button onClick={() => setOpen(false)} className="ml-auto rounded-lg p-1.5 text-muted lg:hidden" aria-label="Close menu"><X size={17} /></button>
      </div>

      <div className="mx-3 mb-3 flex items-center justify-between rounded-xl border border-white/[0.07] bg-ink-800/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cx('h-2 w-2 rounded-full', kitchenOpen ? 'bg-mint-500 shadow-[0_0_8px_2px_rgba(46,203,150,0.45)]' : 'bg-chili-500')} />
          <span className="text-[11.5px] font-semibold text-cream-dim">{kitchenOpen ? 'Accepting orders' : 'Kitchen paused'}</span>
        </div>
        <button
          onClick={toggleKitchen}
          className={cx('relative h-5 w-9 rounded-full transition', kitchenOpen ? 'bg-mint-500' : 'bg-ink-600')}
          aria-label="Toggle kitchen open"
        >
          <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', kitchenOpen ? 'left-[18px]' : 'left-0.5')} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-2.5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx(
                'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition',
                isActive ? 'bg-saffron-500/12 text-saffron-300 ring-1 ring-inset ring-saffron-500/20' : 'text-cream-dim hover:bg-white/[0.04] hover:text-cream'
              )
            }
          >
            <item.icon size={16} className="shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.to === '/admin/orders' && activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron-500 px-1 text-[10px] font-bold text-ink-950">{activeCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-white/[0.06] p-2.5">
        <Link to="/" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-medium text-cream-dim transition hover:bg-white/[0.04] hover:text-cream">
          <Store size={15} /> View storefront <ExternalLink size={11} className="ml-auto text-muted" />
        </Link>
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <Avatar name={user?.name} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-cream">{user?.name}</p>
            <p className="text-[10px] capitalize text-muted">{user?.role}</p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-chili-400" aria-label="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-white/[0.06] bg-ink-950/60 backdrop-blur-xl lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="animate-slide-left absolute inset-y-0 left-0 w-[270px] border-r border-white/10 bg-ink-900">{sidebar}</aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-900/85 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button onClick={() => setOpen(true)} className="rounded-lg border border-white/10 p-2 text-cream lg:hidden" aria-label="Open menu">
              <Menu size={17} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[17px] font-semibold tracking-tight text-cream">{meta.title}</h1>
              <p className="hidden truncate text-[11.5px] text-muted sm:block">{meta.sub}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge tone={kitchenOpen ? 'green' : 'red'} dot className="hidden sm:inline-flex">
                {kitchenOpen ? 'Kitchen live' : 'Paused'}
              </Badge>
              <button
                onClick={() => navigate('/admin/orders')}
                className="relative rounded-xl border border-white/[0.08] bg-ink-800/70 p-2.5 text-cream-dim transition hover:text-cream"
                aria-label="Active orders"
              >
                <Bell size={16} />
                {activeCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron-500 px-1 text-[9px] font-bold text-ink-950">{activeCount}</span>}
              </button>
              <Link to="/" className="hidden items-center gap-1.5 rounded-xl border border-white/[0.08] bg-ink-800/70 px-3 py-2.5 text-[12px] font-semibold text-cream-dim transition hover:text-cream sm:flex">
                <Store size={14} /> Store
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 pb-16 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
