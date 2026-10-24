import { useEffect, useMemo, useState } from 'react';
import {
  ChefHat, Filter, Image as ImageIcon, IndianRupee, Pencil, Plus, Search, Sparkles, Star, Trash2, Utensils,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { cx, inr } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Badge, Button, Card, ConfirmDialog, DishImage, EmptyState, Field, Input, Modal, RowSkeleton,
  Select, Switch, Textarea,
} from '../../components/ui.jsx';

const IMAGE_OPTIONS = [
  ['/dishes/hero.jpg', 'Biryani spread'], ['/dishes/murg-musallam.jpg', 'Murg musallam'],
  ['/dishes/egg-biryani.jpg', 'Egg biryani'], ['/dishes/plain-rice.jpg', 'Plain rice'],
  ['/dishes/jeera-rice.jpg', 'Jeera rice'], ['/dishes/chicken-fried-rice.jpg', 'Chicken fried rice'],
  ['/dishes/veg-fried-rice.jpg', 'Veg fried rice'], ['/dishes/chilly-chicken.jpg', 'Chilly chicken dry'],
  ['/dishes/chilly-chicken-gravy.jpg', 'Chilly chicken gravy'], ['/dishes/green-salad.jpg', 'Green salad'],
  ['/dishes/chicken-keema.jpg', 'Chicken keema'], ['/dishes/chicken-fry.jpg', 'Chicken fry'],
  ['/dishes/chicken-lollypop.jpg', 'Chicken lollypop'], ['/dishes/chicken-curry.jpg', 'Chicken curry'],
  ['/dishes/egg-curry.jpg', 'Egg curry'], ['/dishes/chicken-roll.jpg', 'Chicken roll'],
  ['/dishes/chicken-egg-roll.jpg', 'Chicken egg roll'], ['/dishes/egg-roll.jpg', 'Egg roll'],
  ['/dishes/mughlai-paratha.jpg', 'Mughlai paratha'], ['/dishes/tawa-roti.jpg', 'Tawa roti'],
  ['/dishes/combo.jpg', 'Rice combo'],
];

const BLANK = {
  name: '', description: '', price: '', compareAtPrice: '', image: '/dishes/hero.jpg', categoryId: '',
  isVeg: false, isAvailable: true, isFeatured: false, isBestseller: false, spiceLevel: 1,
  prepTime: 20, calories: '', rating: 4.6,
};

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [catDraft, setCatDraft] = useState({ name: '', tagline: '', emoji: '🍽️' });
  const [catSaving, setCatSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await api('/admin/menu');
      setItems(data.items);
      setCategories(data.categories);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (cat !== 'all' && String(i.categoryId) !== cat) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return i.name.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q);
      }),
    [items, cat, search]
  );

  const openNew = () => {
    setEditing(null);
    setDraft({ ...BLANK, categoryId: String(categories[0]?.id ?? '') });
    setFormError('');
    setModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setDraft({
      name: item.name, description: item.description ?? '', price: item.price,
      compareAtPrice: item.compareAtPrice ?? '', image: item.image, categoryId: String(item.categoryId ?? ''),
      isVeg: item.isVeg, isAvailable: item.isAvailable, isFeatured: item.isFeatured,
      isBestseller: item.isBestseller, spiceLevel: item.spiceLevel, prepTime: item.prepTime,
      calories: item.calories ?? '', rating: item.rating,
    });
    setFormError('');
    setModal(true);
  };

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = {
      ...draft,
      price: Number(draft.price),
      compareAtPrice: draft.compareAtPrice ? Number(draft.compareAtPrice) : null,
      calories: draft.calories ? Number(draft.calories) : null,
      categoryId: Number(draft.categoryId),
      spiceLevel: Number(draft.spiceLevel),
      prepTime: Number(draft.prepTime),
    };
    try {
      if (editing) {
        const data = await api(`/admin/menu/${editing.id}`, { method: 'PATCH', body: payload });
        setItems((list) => list.map((i) => (i.id === editing.id ? { ...i, ...data.item } : i)));
        toast('Dish updated', 'success');
      } else {
        const data = await api('/admin/menu', { method: 'POST', body: payload });
        setItems((list) => [{ ...data.item, sortOrder: 999 }, ...list]);
        toast(`${data.item.name} added to the menu`, 'success');
      }
      setModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (item) => {
    setTogglingId(item.id);
    const next = !item.isAvailable;
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, isAvailable: next } : i)));
    try {
      await api(`/admin/menu/${item.id}`, { method: 'PATCH', body: { isAvailable: next } });
      toast(next ? `${item.name} is back on the menu` : `${item.name} marked sold out`, next ? 'success' : 'info');
    } catch (err) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, isAvailable: item.isAvailable } : i)));
      toast(err.message, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    setDeletingBusy(true);
    try {
      await api(`/admin/menu/${deleting.id}`, { method: 'DELETE' });
      setItems((list) => list.filter((i) => i.id !== deleting.id));
      toast(`${deleting.name} removed`, 'info');
      setDeleting(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeletingBusy(false);
    }
  };

  const addCategory = async () => {
    setCatSaving(true);
    try {
      const data = await api('/admin/categories', { method: 'POST', body: catDraft });
      setCategories((list) => [...list, data.category]);
      setCatModal(false);
      setCatDraft({ name: '', tagline: '', emoji: '🍽️' });
      toast('Category created', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCatSaving(false);
    }
  };

  const soldOut = items.filter((i) => !i.isAvailable).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Total dishes', value: items.length, icon: Utensils },
          { label: 'Live on menu', value: items.length - soldOut, icon: ChefHat },
          { label: 'Sold out', value: soldOut, icon: Filter },
          { label: 'Categories', value: categories.length, icon: Sparkles },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-500/10 text-saffron-400"><s.icon size={15} /></span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted">{s.label}</p>
              <p className="font-display text-lg font-semibold text-cream">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="h-10 w-full rounded-xl border border-white/10 bg-ink-800/70 pl-9 pr-3 text-[12.5px] text-cream placeholder:text-muted/70 focus:border-saffron-500/50 focus:outline-none"
          />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="h-10 w-auto text-[12px]">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.emoji} {c.name}</option>)}
        </Select>
        <Button size="sm" variant="secondary" onClick={() => setCatModal(true)}><Plus size={13} /> Category</Button>
        <Button size="sm" onClick={openNew}><Plus size={14} /> Add dish</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[2.1fr_.9fr_.6fr_.6fr_auto] gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted lg:grid">
          <span>Dish</span><span>Category</span><span>Price</span><span>Available</span><span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="p-4"><RowSkeleton rows={6} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={ChefHat} title="No dishes found" description={search ? `Nothing matches “${search}”.` : 'Add your first dish to this category.'}
              action={<Button size="sm" onClick={openNew}><Plus size={13} /> Add dish</Button>} />
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {filtered.map((item) => (
              <div key={item.id} className="grid gap-3 px-4 py-3 transition hover:bg-white/[0.02] lg:grid-cols-[2.1fr_.9fr_.6fr_.6fr_auto] lg:items-center">
                <div className="flex items-center gap-3">
                  <DishImage src={item.image} name={item.name} className={cx('h-11 w-11', !item.isAvailable && 'opacity-50')} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-[12.5px] font-semibold text-cream">{item.name}</p>
                      {item.isBestseller && <Badge tone="saffron" className="py-0 text-[9px]">Bestseller</Badge>}
                      {!item.isVeg && <span className="h-2 w-2 rounded-full bg-chili-500" title="Non-veg" />}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{item.description}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-[10px] text-muted">
                      <span className="flex items-center gap-0.5"><Star size={9} className="fill-saffron-400 text-saffron-400" /> {item.rating}</span>
                      <span>· {item.prepTime} min</span>
                      <span>· {item.ratingCount} orders</span>
                    </p>
                  </div>
                </div>

                <span className="text-[11.5px] text-cream-dim">{item.category}</span>

                <div>
                  <p className="text-[12.5px] font-semibold text-cream">{inr(item.price)}</p>
                  {item.compareAtPrice ? <p className="text-[10px] text-muted line-through">{inr(item.compareAtPrice)}</p> : null}
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={item.isAvailable} onChange={() => toggleAvailable(item)} disabled={togglingId === item.id} label={`Toggle ${item.name}`} />
                  <span className={cx('text-[10.5px] font-semibold', item.isAvailable ? 'text-mint-400' : 'text-muted')}>
                    {item.isAvailable ? 'Live' : 'Sold out'}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-muted transition hover:bg-white/5 hover:text-cream" aria-label={`Edit ${item.name}`}><Pencil size={14} /></button>
                  <button onClick={() => setDeleting(item)} className="rounded-lg p-2 text-muted transition hover:bg-chili-500/10 hover:text-chili-400" aria-label={`Delete ${item.name}`}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit dish' : 'Add a new dish'}
        description="Changes go live on the storefront instantly."
        size="lg"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Add to menu'}</Button></div>}
      >
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Dish name" required className="sm:col-span-2">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Chicken Dum Biryani" required />
          </Field>
          <Field label="Description" className="sm:col-span-2" hint="Shown on the card — keep it tasty and under 120 characters.">
            <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Slow-cooked with saffron, mint and fried onions…" />
          </Field>
          <Field label="Category" required>
            <Select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })} required>
              {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.emoji} {c.name}</option>)}
            </Select>
          </Field>
          <Field label="Spice level">
            <Select value={String(draft.spiceLevel)} onChange={(e) => setDraft({ ...draft, spiceLevel: e.target.value })}>
              <option value="0">Mild / none</option>
              <option value="1">Medium</option>
              <option value="2">Spicy</option>
              <option value="3">Extra hot</option>
            </Select>
          </Field>
          <Field label="Price (₹)" required>
            <div className="relative">
              <IndianRupee size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input type="number" min="1" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="pl-8" required />
            </div>
          </Field>
          <Field label="Compare-at price (₹)" hint="Optional — shows a strike-through.">
            <Input type="number" min="0" value={draft.compareAtPrice} onChange={(e) => setDraft({ ...draft, compareAtPrice: e.target.value })} />
          </Field>
          <Field label="Prep time (min)">
            <Input type="number" min="1" value={draft.prepTime} onChange={(e) => setDraft({ ...draft, prepTime: e.target.value })} />
          </Field>
          <Field label="Calories">
            <Input type="number" min="0" value={draft.calories} onChange={(e) => setDraft({ ...draft, calories: e.target.value })} placeholder="e.g. 480" />
          </Field>

          <div className="sm:col-span-2">
            <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-muted"><ImageIcon size={12} /> Dish photo</p>
            <div className="grid max-h-44 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-white/10 bg-ink-800/50 p-2 sm:grid-cols-6">
              {IMAGE_OPTIONS.map(([src, label]) => (
                <button
                  type="button"
                  key={src}
                  onClick={() => setDraft({ ...draft, image: src })}
                  title={label}
                  className={cx('group relative overflow-hidden rounded-lg border-2 transition', draft.image === src ? 'border-saffron-500' : 'border-transparent hover:border-white/25')}
                >
                  <DishImage src={src} name={label} className="aspect-square w-full" rounded="rounded-md" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-ink-950/80 px-1 py-0.5 text-[8px] text-cream-dim">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            {[
              ['isVeg', 'Vegetarian'],
              ['isAvailable', 'Available today'],
              ['isBestseller', 'Bestseller badge'],
              ['isFeatured', "Chef's pick"],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-ink-800/40 px-3 py-2.5">
                <span className="text-[12px] font-medium text-cream-dim">{label}</span>
                <Switch checked={draft[key]} onChange={(v) => setDraft({ ...draft, [key]: v })} label={label} />
              </label>
            ))}
          </div>

          {formError && <p className="sm:col-span-2 rounded-lg bg-chili-500/10 px-3 py-2 text-[12px] text-chili-400">{formError}</p>}
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={catModal}
        onClose={() => setCatModal(false)}
        title="New category"
        size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setCatModal(false)}>Cancel</Button><Button onClick={addCategory} loading={catSaving}>Create category</Button></div>}
      >
        <div className="space-y-3">
          <Field label="Name" required><Input value={catDraft.name} onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })} placeholder="e.g. Tandoori Starters" /></Field>
          <Field label="Tagline"><Input value={catDraft.tagline} onChange={(e) => setCatDraft({ ...catDraft, tagline: e.target.value })} placeholder="Smoky, straight off the coal" /></Field>
          <Field label="Emoji"><Input value={catDraft.emoji} onChange={(e) => setCatDraft({ ...catDraft, emoji: e.target.value })} maxLength={2} /></Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deletingBusy}
        title={`Delete “${deleting?.name}”?`}
        message="This removes the dish from the storefront and your menu. Past orders keep their record."
        confirmLabel="Delete dish"
      />
    </div>
  );
}
