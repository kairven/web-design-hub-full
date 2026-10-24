import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Leaf, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useStore } from '../context/StoreContext.jsx';
import { cx, inr } from '../lib/format.js';
import { DishCard } from '../components/DishCard.jsx';
import { Badge, Button, DishSkeleton, EmptyState, Select, SegmentedControl, Switch } from '../components/ui.jsx';

const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

export default function MenuPage() {
  const { menu, categories, loading } = useStore();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [vegOnly, setVegOnly] = useState(false);
  const [sort, setSort] = useState('recommended');
  const [activeCat, setActiveCat] = useState(params.get('cat') || 'all');

  useEffect(() => {
    setActiveCat(params.get('cat') || 'all');
    setSearch(params.get('q') || '');
  }, [params]);

  const setCategory = (slug) => {
    setActiveCat(slug);
    const next = new URLSearchParams(params);
    if (slug === 'all') next.delete('cat');
    else next.set('cat', slug);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    let list = [...menu];
    if (activeCat !== 'all') list = list.filter((m) => m.categorySlug === activeCat);
    if (vegOnly) list = list.filter((m) => m.isVeg);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q)
      );
    }
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [menu, activeCat, vegOnly, search, sort]);

  const availableCount = filtered.filter((m) => m.isAvailable).length;
  const grouped = useMemo(() => {
    if (activeCat !== 'all' || search) return null;
    return categories
      .map((c) => ({ ...c, items: filtered.filter((m) => m.categoryId === c.id) }))
      .filter((g) => g.items.length);
  }, [categories, filtered, activeCat, search]);

  return (
    <div>
      <div className="border-b border-white/[0.06] bg-ink-950/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <nav className="flex items-center gap-1.5 text-[11.5px] text-muted">
            <Link to="/" className="hover:text-saffron-400">Home</Link>
            <ChevronRight size={11} />
            <span className="text-cream-dim">Menu</span>
          </nav>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
                The <span className="text-gradient">Zayka</span> menu
              </h1>
              <p className="mt-1.5 max-w-xl text-[13px] text-muted">
                {menu.length} dishes cooked fresh to order. Prices include GST — delivery {inr(25)} (free above {inr(299)}).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={availableCount ? 'green' : 'red'} dot>{availableCount} available now</Badge>
              <Badge tone="neutral">Raebareli only</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-[64px] z-30 border-b border-white/[0.06] bg-ink-900/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
            <button
              onClick={() => setCategory('all')}
              className={cx(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition',
                activeCat === 'all' ? 'border-saffron-500/50 bg-saffron-500 text-ink-950' : 'border-white/10 text-muted hover:text-cream'
              )}
            >
              All dishes
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.slug)}
                className={cx(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition',
                  activeCat === c.slug ? 'border-saffron-500/50 bg-saffron-500 text-ink-950' : 'border-white/10 text-muted hover:text-cream'
                )}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[210px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes, e.g. biryani, roll, keema…"
              className="h-11 w-full rounded-xl border border-white/10 bg-ink-800/70 pl-9 pr-9 text-[13px] text-cream placeholder:text-muted/70 focus:border-saffron-500/50 focus:outline-none focus:ring-4 focus:ring-saffron-500/10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-cream" aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <label className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-ink-800/70 px-3.5">
            <Switch checked={vegOnly} onChange={setVegOnly} label="Vegetarian only" />
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-cream-dim">
              <Leaf size={13} className="text-mint-500" /> Veg only
            </span>
          </label>

          <div className="relative">
            <SlidersHorizontal size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Select value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 w-[190px] pl-8 text-[12.5px]">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <DishSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No dishes match that"
            description={search ? `We couldn't find anything for “${search}”. Try biryani, roll or keema.` : 'Try clearing the filters.'}
            action={
              <Button variant="secondary" onClick={() => { setSearch(''); setVegOnly(false); setCategory('all'); }}>
                Clear filters
              </Button>
            }
          />
        ) : grouped ? (
          <div className="space-y-10">
            {grouped.map((group) => (
              <section key={group.id} id={group.slug} className="scroll-mt-32">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-cream">
                      <span>{group.emoji}</span> {group.name}
                    </h2>
                    <p className="mt-0.5 text-[12px] text-muted">{group.tagline}</p>
                  </div>
                  <span className="text-[11.5px] text-muted">{group.items.length} dishes</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.items.map((item) => <DishCard key={item.id} item={item} />)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] text-muted">
                Showing <b className="text-cream-dim">{filtered.length}</b> dish{filtered.length === 1 ? '' : 'es'}
                {avatarLabel(activeCat, categories) ? ` in ${avatarLabel(activeCat, categories)}` : ''}
              </p>
              <p className="hidden text-[11.5px] text-muted sm:block">Tap “Add” — your cart is saved automatically</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => <DishCard key={item.id} item={item} />)}
            </div>
          </>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-ink-850/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-500/12 text-saffron-400"><Sparkles size={16} /></span>
            <div>
              <p className="text-[12.5px] font-semibold text-cream">Craving something not on the menu?</p>
              <p className="text-[11.5px] text-muted">Call the kitchen — we take special requests for functions.</p>
            </div>
          </div>
          <Button variant="outline" as="a" href="tel:+919194210086">Call +91 91942 10086</Button>
        </div>
      </div>
    </div>
  );
}

function avatarLabel(slug, categories) {
  return categories.find((c) => c.slug === slug)?.name;
}
