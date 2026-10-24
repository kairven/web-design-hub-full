import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown, LayoutDashboard, LogOut, MapPin, Menu as MenuIcon, Phone, Receipt, Search, ShoppingBag, User, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { cx } from '../lib/format.js';
import { Avatar, Badge } from './ui.jsx';

const ZONES = ['Civil Lines', 'Indira Nagar', 'Railway Road', 'Ahiyapur', 'Bachhrawan', 'Jais'];
const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'Menu' },
  { to: '/orders', label: 'My orders' },
];

export default function SiteHeader({ restaurant, kitchenOpen = true }) {
  const { user, isAdmin, logout } = useAuth();
  const { count, setDrawerOpen, zone, setZone } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const zoneRef = useRef(null);
  const accountRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (zoneRef.current && !zoneRef.current.contains(e.target)) setZoneOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/menu${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`);
    setMenuOpen(false);
  };

  return (
    <>
      <div className="relative z-50 border-b border-white/[0.05] bg-ink-950/80 text-[11.5px] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 sm:px-6">
          <p className="flex items-center gap-1.5 text-cream-dim">
            <span className={cx('h-1.5 w-1.5 rounded-full', kitchenOpen ? 'bg-mint-500 shadow-[0_0_8px_2px_rgba(46,203,150,0.5)]' : 'bg-chili-500')} />
            {kitchenOpen ? 'Kitchen open · Delivering across Raebareli' : 'Kitchen closed · Opens at 11:00 AM'}
          </p>
          <a href="tel:+919194210086" className="hidden items-center gap-1.5 text-muted transition hover:text-saffron-400 sm:flex">
            <Phone size={11} /> {restaurant?.phone || '+91 91942 10086'}
          </a>
        </div>
      </div>

      <header
        className={cx(
          'sticky top-0 z-40 transition-all duration-300',
          scrolled ? 'border-b border-white/[0.07] bg-ink-900/85 backdrop-blur-xl' : 'bg-transparent'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Zayka E Raebareli home">
            <img src="/brand/mark.svg" alt="" className="h-9 w-9" />
            <span className="hidden leading-none sm:block">
              <span className="block font-display text-[17px] font-semibold tracking-tight text-cream">Zayka <span className="text-saffron-400">E</span> Raebareli</span>
              <span className="mt-1 block text-[9.5px] font-semibold uppercase tracking-[0.28em] text-muted">Only in Raebareli</span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cx(
                    'rounded-lg px-3 py-2 text-[13px] font-semibold transition',
                    isActive ? 'bg-white/[0.06] text-cream' : 'text-muted hover:text-cream'
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <form onSubmit={submitSearch} className="group relative hidden md:block">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search biryani, rolls…"
                aria-label="Search the menu"
                className="h-10 w-44 rounded-xl border border-white/[0.08] bg-ink-800/70 pl-9 pr-3 text-[13px] text-cream placeholder:text-muted/70 transition-all focus:w-56 focus:border-saffron-500/50 focus:outline-none focus:ring-4 focus:ring-saffron-500/10 xl:w-56 xl:focus:w-64"
              />
            </form>

            <div className="relative" ref={zoneRef}>
              <button
                onClick={() => setZoneOpen((v) => !v)}
                className="flex h-10 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-ink-800/70 px-3 text-[12.5px] font-semibold text-cream-dim transition hover:border-saffron-500/40 hover:text-cream"
              >
                <MapPin size={14} className="text-saffron-400" />
                <span className="max-w-24 truncate">{zone}</span>
                <ChevronDown size={13} className={cx('transition', zoneOpen && 'rotate-180')} />
              </button>
              {zoneOpen && (
                <div className="animate-scale-in absolute right-0 top-12 w-60 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-ink-850 p-1.5 shadow-2xl">
                  <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted">Deliver to</p>
                  {ZONES.map((z) => (
                    <button
                      key={z}
                      onClick={() => { setZone(z); setZoneOpen(false); }}
                      className={cx(
                        'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition',
                        zone === z ? 'bg-saffron-500/12 text-saffron-300' : 'text-cream-dim hover:bg-white/5'
                      )}
                    >
                      {z}
                      {zone === z && <span className="text-[10px] font-bold">SELECTED</span>}
                    </button>
                  ))}
                  <p className="mt-1 border-t border-white/[0.06] px-2.5 py-2 text-[11px] leading-snug text-muted">
                    We only deliver inside Raebareli district.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setDrawerOpen(true)}
              className="relative flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-saffron-400 to-saffron-600 px-3.5 text-[13px] font-bold text-ink-950 transition active:scale-95"
            >
              <ShoppingBag size={15} strokeWidth={2.5} />
              Cart
              {count > 0 && (
                <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-950 px-1 text-[10px] font-bold text-saffron-400">
                  {count}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-ink-800/70 pl-1.5 pr-2.5 transition hover:border-white/20"
                >
                  <Avatar name={user.name} size={28} />
                  <ChevronDown size={13} className="text-muted" />
                </button>
                {accountOpen && (
                  <div className="animate-scale-in absolute right-0 top-12 w-56 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-ink-850 p-1.5 shadow-2xl">
                    <div className="border-b border-white/[0.06] px-2.5 py-2">
                      <p className="truncate text-[13px] font-semibold text-cream">{user.name}</p>
                      <p className="truncate text-[11px] text-muted">+91 {user.phone}</p>
                    </div>
                    {[
                      { to: '/account', icon: User, label: 'My profile' },
                      { to: '/orders', icon: Receipt, label: 'My orders' },
                    ].map((i) => (
                      <Link key={i.to} to={i.to} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-cream-dim transition hover:bg-white/5 hover:text-cream">
                        <i.icon size={14} className="text-muted" /> {i.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-saffron-300 transition hover:bg-saffron-500/10">
                        <LayoutDashboard size={14} /> Admin dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setAccountOpen(false); navigate('/'); }}
                      className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-white/[0.06] px-2.5 py-2 text-[13px] text-cream-dim transition hover:bg-white/5 hover:text-chili-400"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-800/70 px-3.5 text-[13px] font-semibold text-cream transition hover:border-saffron-500/40"
              >
                <User size={14} /> Sign in
              </Link>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-ink-800/70 text-cream"
            >
              <ShoppingBag size={17} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron-500 px-1 text-[10px] font-bold text-ink-950">
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-ink-800/70 text-cream"
            >
              {menuOpen ? <X size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="animate-fade-up border-t border-white/[0.06] bg-ink-900/95 px-4 pb-4 pt-3 backdrop-blur-xl md:hidden">
            <form onSubmit={submitSearch} className="relative mb-3">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search biryani, rolls…"
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-ink-800 pl-9 pr-3 text-sm text-cream placeholder:text-muted focus:border-saffron-500/50 focus:outline-none"
              />
            </form>
            <div className="space-y-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-cream-dim hover:bg-white/5"
                >
                  {n.label}
                </NavLink>
              ))}
              {user ? (
                <>
                  <Link to="/account" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-cream-dim hover:bg-white/5">My profile</Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-saffron-300 hover:bg-white/5">Admin dashboard</Link>
                  )}
                  <button onClick={() => { logout(); setMenuOpen(false); navigate('/'); }} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-chili-400 hover:bg-white/5">Sign out</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-1 block rounded-xl bg-saffron-500 px-3 py-2.5 text-center text-sm font-bold text-ink-950">Sign in</Link>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3">
              {ZONES.map((z) => (
                <button
                  key={z}
                  onClick={() => setZone(z)}
                  className={cx(
                    'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                    zone === z ? 'border-saffron-500/50 bg-saffron-500/15 text-saffron-300' : 'border-white/10 text-muted'
                  )}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {count > 0 && location.pathname !== '/checkout' && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-saffron-500/20 bg-ink-850/95 px-4 py-2.5 backdrop-blur-xl md:hidden safe-bottom">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-4 py-3 text-ink-950"
          >
            <span className="text-[13px] font-bold">{count} item{count > 1 ? 's' : ''} · {zone}</span>
            <span className="flex items-center gap-1.5 text-[13px] font-extrabold">View cart <ShoppingBag size={15} /></span>
          </button>
        </div>
      )}
    </>
  );
}
