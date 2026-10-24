import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Bike, ChefHat, Clock3, Flame, Leaf, MapPin, Phone, Quote, ShieldCheck, Sparkles, Star, Timer, UtensilsCrossed,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.jsx';
import { api } from '../lib/api.js';
import { cx, inr, timeAgo } from '../lib/format.js';
import { DishCard } from '../components/DishCard.jsx';
import { Badge, Button, Card, DishImage, DishSkeleton, SectionTitle, Skeleton, Stars } from '../components/ui.jsx';
import { STATUS_STYLES } from '../components/OrderTimeline.jsx';

export default function Home() {
  const { menu, categories, restaurant, loading } = useStore();
  const [reviews, setReviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api('/reviews').then((d) => setReviews(d.reviews)).catch(() => {});
  }, []);

  const featured = menu.filter((m) => m.isFeatured).slice(0, 3);
  const bestsellers = menu.filter((m) => m.isBestseller).slice(0, 4);
  const avgRating =
    reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '4.8';

  return (
    <div>
      {/* ---------------------------------- Hero --------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
        <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-chili-500/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-16 lg:pt-14">
          <div className="animate-fade-up">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="saffron" className="px-3 py-1.5" dot>
                Raebareli's own cloud kitchen
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-cream-dim">
                <MapPin size={12} className="text-saffron-400" /> Civil Lines · 229001
              </span>
            </div>

            <h1 className="mt-5 font-display text-[38px] font-semibold leading-[1.03] tracking-tight text-cream sm:text-[54px] lg:text-[60px]">
              Ghar ka <span className="text-gradient">zayka</span>,
              <br />
              seedha aapke darwaze par.
            </h1>
            <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-cream-dim/90">
              Slow-dum biryani, Mughlai musallam aur Indo-Chinese classics — cooked fresh in our own kitchen
              and delivered across Raebareli in under 35 minutes. No third-party apps, no inflated menu prices.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => navigate('/menu')} className="group">
                Order now
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button size="lg" variant="outline" as="a" href="tel:+919194210086">
                <Phone size={16} /> Call the kitchen
              </Button>
            </div>

            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-white/[0.07] pt-5">
              {[
                { k: avgRating, label: 'Customer rating', icon: Star },
                { k: '28 min', label: 'Average delivery', icon: Timer },
                { k: '12,400+', label: 'Orders served', icon: UtensilsCrossed },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted">
                    <s.icon size={11} className="text-saffron-500" /> {s.label}
                  </dt>
                  <dd className="mt-1 font-display text-xl font-semibold text-cream">{s.k}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 shadow-[0_40px_120px_-40px_rgba(245,165,36,0.35)]">
              <img src="/dishes/hero.jpg" alt="Zayka E Raebareli signature spread" className="aspect-[4/3.4] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-saffron-400">House special</p>
                  <p className="mt-0.5 font-display text-lg font-semibold text-cream">Chicken Dum Biryani</p>
                  <p className="text-[11.5px] text-cream-dim">Handi-sealed · serves 1–2</p>
                </div>
                <div className="rounded-xl bg-ink-950/70 px-3 py-2 text-right backdrop-blur-md">
                  <p className="font-display text-lg font-semibold text-cream">{inr(80)}</p>
                  <p className="text-[10px] text-muted line-through">{inr(110)}</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-3 top-6 hidden animate-fade-up rounded-2xl border border-white/10 bg-ink-850/90 p-3 shadow-2xl backdrop-blur-xl [animation-delay:320ms] sm:block">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500/15 text-mint-400">
                  <Bike size={15} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold text-cream">Order #ZY1042 delivered</p>
                  <p className="text-[10px] text-muted">Civil Lines · 24 min</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-2 bottom-24 hidden animate-fade-up items-center gap-2 rounded-full border border-white/10 bg-ink-850/90 px-3 py-2 shadow-2xl backdrop-blur-xl [animation-delay:440ms] sm:flex">
              <Stars value={Number(avgRating)} />
              <span className="text-[10.5px] text-muted">from {reviews.length || 6} reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- Value strip ------------------------------- */}
      <section className="border-y border-white/[0.06] bg-ink-950/50">
        <div className="mx-auto grid max-w-7xl gap-px px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            { icon: ChefHat, title: 'Cooked to order', copy: 'Nothing pre-made, nothing reheated.' },
            { icon: Bike, title: 'Our own riders', copy: 'Raebareli-only delivery fleet.' },
            { icon: Leaf, title: 'Fresh masalas', copy: 'Ground in-house every morning.' },
            { icon: ShieldCheck, title: 'Direct pricing', copy: 'No aggregator mark-up, ever.' },
          ].map((v) => (
            <div key={v.title} className="flex items-center gap-3 px-1 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-saffron-500/20 bg-saffron-500/[0.08] text-saffron-400">
                <v.icon size={16} />
              </span>
              <div>
                <p className="text-[12.5px] font-semibold text-cream">{v.title}</p>
                <p className="text-[11.5px] text-muted">{v.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------- Categories ------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <SectionTitle
          eyebrow="Browse the kitchen"
          title="Kya khaana hai aaj?"
          description="Six sections, 23 dishes — the exact menu our kitchen cooks from."
          action={
            <Link to="/menu" className="group flex items-center gap-1 text-[12.5px] font-semibold text-saffron-400">
              See full menu <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </Link>
          }
        />
        <div className="no-scrollbar -mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 min-w-[150px] rounded-2xl" />)
            : categories.map((c) => {
                const items = menu.filter((m) => m.categoryId === c.id);
                const cheapest = items.length ? Math.min(...items.map((i) => i.price)) : 0;
                return (
                  <Link
                    key={c.id}
                    to={`/menu?cat=${c.slug}`}
                    className="group relative min-w-[150px] snap-start overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-850/70 p-4 transition hover:border-saffron-500/30 hover:bg-ink-800"
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <p className="mt-2.5 text-[13px] font-semibold leading-tight text-cream">{c.name}</p>
                    <p className="mt-1 text-[11px] text-muted">{items.length} dishes · from {inr(cheapest)}</p>
                    <span className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-saffron-500/10 blur-xl transition group-hover:bg-saffron-500/20" />
                  </Link>
                );
              })}
        </div>
      </section>

      {/* -------------------------------- Specials -------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron-500">
              <Sparkles size={12} /> Chef's picks
            </p>
            <h2 className="font-display text-xl font-semibold tracking-tight text-cream sm:text-2xl">Aaj ki khaas dishes</h2>
            <p className="mt-1 text-[13px] text-muted">What our chef is proudest of this week.</p>
          </div>
          <Badge tone="green" className="mb-1">Free delivery above {inr(restaurant?.freeDeliveryAbove ?? 299)}</Badge>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <DishSkeleton key={i} />)
            : featured.map((item) => <DishCard key={item.id} item={item} />)}
        </div>
      </section>

      {/* --------------------------------- Bestsellers ---------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <SectionTitle
          eyebrow="Most ordered"
          title="Raebareli ke favourites"
          description="These disappear fastest — especially after 8 PM."
          action={
            <Link to="/menu" className="group flex items-center gap-1 text-[12.5px] font-semibold text-saffron-400">
              View all <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </Link>
          }
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <DishSkeleton key={i} />)
            : bestsellers.map((item) => <DishCard key={item.id} item={item} compact />)}
        </div>
      </section>

      {/* ------------------------------ How it works ------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-ink-850/60 p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-saffron-500/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge tone="saffron">Direct from our kitchen</Badge>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-cream sm:text-3xl">
                No middlemen. Just <span className="text-gradient">zayka</span>.
              </h2>
              <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-muted">
                You order from Zayka, our kitchen cooks it, our rider brings it. That's why the biryani
                reaches you hot — and why the prices stay honest.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => navigate('/menu')}>Start an order <ArrowRight size={15} /></Button>
                <Button variant="ghost" as={Link} to="/orders">Track existing order</Button>
              </div>
            </div>
            <ol className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: UtensilsCrossed, title: 'Pick your dishes', copy: 'Browse the live menu with real photos and prices.', n: '01' },
                { icon: Flame, title: 'We cook fresh', copy: 'Your order hits the tandoor the moment it is confirmed.', n: '02' },
                { icon: Bike, title: 'Rider on the way', copy: 'Live status from kitchen to your door, in ~28 minutes.', n: '03' },
              ].map((s) => (
                <li key={s.n} className="rounded-2xl border border-white/[0.06] bg-ink-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-500/12 text-saffron-400"><s.icon size={16} /></span>
                    <span className="font-display text-lg font-semibold text-white/10">{s.n}</span>
                  </div>
                  <p className="mt-3 text-[13px] font-semibold text-cream">{s.title}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{s.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* --------------------------------- Reviews -------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <SectionTitle
          eyebrow="Straight from Raebareli"
          title="Log kya kehte hain"
          description={reviews.length ? `${reviews.length} recent reviews from verified orders.` : 'Reviews from verified orders.'}
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(loading ? Array.from({ length: 3 }) : reviews.slice(0, 6)).map((r, i) =>
            !r ? (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ) : (
              <Card key={r.id} className="flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-saffron-500/30 to-chili-500/20 text-[12px] font-bold text-saffron-300 ring-1 ring-inset ring-white/10">
                      {r.user_name?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </span>
                    <div>
                      <p className="text-[12.5px] font-semibold text-cream">{r.user_name}</p>
                      <p className="text-[10.5px] text-muted">{timeAgo(r.created_at)}{r.dish ? ` · ${r.dish}` : ''}</p>
                    </div>
                  </div>
                  <Stars value={r.rating} size={11} />
                </div>
                <Quote size={16} className="mt-3 text-saffron-500/40" />
                <p className="mt-1 flex-1 text-[12.5px] leading-relaxed text-cream-dim/90">{r.comment}</p>
              </Card>
            )
          )}
        </div>
      </section>

      {/* ---------------------------------- CTA ---------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-saffron-500/20 bg-gradient-to-br from-saffron-500/[0.12] via-ink-850 to-ink-900 p-7 text-center sm:p-12">
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
          <div className="relative mx-auto max-w-xl">
            <span className="text-3xl">🍛</span>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-cream sm:text-3xl">Bhookh lagi? Aaj Zayka se mangao.</h2>
            <p className="mt-2 text-[13.5px] text-cream-dim/85">
              Order before 11:30 PM. Free delivery on bills above {inr(restaurant?.freeDeliveryAbove ?? 299)} across Civil Lines, Indira Nagar & Railway Road.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={() => navigate('/menu')}>Browse the menu <ArrowRight size={16} /></Button>
              <Button size="lg" variant="outline" as="a" href="tel:+919194210086"><Phone size={15} /> {restaurant?.phone || '+91 91942 10086'}</Button>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <Clock3 size={11} /> Open daily {restaurant?.openTime || '11:00'} – {restaurant?.closeTime || '23:30'} · Raebareli only
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
