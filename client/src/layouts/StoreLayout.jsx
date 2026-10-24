import { Link, Outlet, useLocation } from 'react-router-dom';
import { Clock3, Instagram, MapPin, Phone, ShieldCheck } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function StoreLayout() {
  const { restaurant, kitchenOpen, loading } = useStore();
  const { count } = useCart();
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader restaurant={restaurant} kitchenOpen={kitchenOpen} />
      {!loading && !kitchenOpen && location.pathname !== '/' && (
        <div className="border-b border-chili-500/20 bg-chili-500/[0.07] px-4 py-2 text-center text-[12px] text-chili-400">
          The kitchen is closed right now — you can browse, but ordering reopens at {restaurant?.openTime || '11:00'}.
        </div>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer restaurant={restaurant} bump={count > 0} />
      <CartDrawer />
    </div>
  );
}

function Footer({ restaurant, bump }) {
  return (
    <footer className="mt-16 border-t border-white/[0.06] bg-ink-950/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/brand/mark.svg" alt="" className="h-10 w-10" />
            <div>
              <p className="font-display text-[15px] font-semibold text-cream">Zayka E Raebareli</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">Only in Raebareli</p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-[12.5px] leading-relaxed text-muted">
            {restaurant?.tagline || 'Mughlai, biryani aur Indo-Chinese — sirf Raebareli ke liye.'} Cooked to order, delivered hot by our own riders.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mint-500/25 bg-mint-500/10 px-2.5 py-1 text-[10.5px] font-semibold text-mint-400">
              <ShieldCheck size={11} /> FSSAI registered
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10.5px] font-semibold text-cream-dim">
              <Clock3 size={11} /> 11:00 AM – 11:30 PM
            </span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Explore</p>
          <ul className="mt-3 space-y-2 text-[13px] text-cream-dim">
            <li><Link to="/menu" className="transition hover:text-saffron-400">Full menu</Link></li>
            <li><Link to="/orders" className="transition hover:text-saffron-400">Track an order</Link></li>
            <li><Link to="/account" className="transition hover:text-saffron-400">Saved addresses</Link></li>
            <li><Link to="/admin" className="transition hover:text-saffron-400">Restaurant dashboard</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Visit us</p>
          <ul className="mt-3 space-y-2.5 text-[13px] text-cream-dim">
            <li className="flex gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-saffron-500" /> {restaurant?.address || 'Ghantaghar Road, Civil Lines, Raebareli'}</li>
            <li className="flex gap-2"><Phone size={14} className="mt-0.5 shrink-0 text-saffron-500" /> <a href="tel:+919194210086" className="hover:text-saffron-400">{restaurant?.phone || '+91 91942 10086'}</a></li>
            <li className="flex gap-2"><Instagram size={14} className="mt-0.5 shrink-0 text-saffron-500" /> @zayka.e.raebareli</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.06]">
        <div className={`mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-[11px] text-muted sm:flex-row sm:px-6 ${bump ? 'pb-24 md:pb-4' : ''}`}>
          <p>© {new Date().getFullYear()} Zayka E Raebareli. All rights reserved.</p>
          <p>Prices inclusive of taxes · Delivery only within Raebareli district</p>
        </div>
      </div>
    </footer>
  );
}
