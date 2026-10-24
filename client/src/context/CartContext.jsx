import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../lib/storage.js';

const CartContext = createContext(null);
const CART_KEY = 'zayka.cart.v1';
const ZONE_KEY = 'zayka.zone';

function readCart() {
  const raw = storage.getJSON(CART_KEY, []);
  return Array.isArray(raw) ? raw.filter((l) => l && l.id && l.qty > 0) : [];
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(readCart);
  const [zone, setZoneState] = useState(() => storage.get(ZONE_KEY) || 'Civil Lines');
  const [coupon, setCoupon] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  useEffect(() => {
    storage.setJSON(CART_KEY, lines);
  }, [lines]);

  const setZone = useCallback((z) => {
    setZoneState(z);
    storage.set(ZONE_KEY, z);
  }, []);

  const add = useCallback((item, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === item.id);
      if (found) return prev.map((l) => (l.id === item.id ? { ...l, qty: Math.min(20, l.qty + qty) } : l));
      return [...prev, {
        id: item.id, name: item.name, price: item.price, image: item.image,
        isVeg: item.isVeg, slug: item.slug, qty: Math.min(20, qty),
      }];
    });
    setLastAdded(item.id);
    setTimeout(() => setLastAdded(null), 900);
  }, []);

  const remove = useCallback((id) => setLines((prev) => prev.filter((l) => l.id !== id)), []);

  /**
   * Drop lines the kitchen can no longer fulfil (dish deleted, re-created or
   * sold out). Accepts ids/slugs/names because a reseed changes numeric ids.
   */
  const prune = useCallback((targets = []) => {
    if (!targets.length) return;
    const ids = new Set(targets.map((t) => (typeof t === 'object' ? t.id : t)).filter(Boolean));
    const slugs = new Set(targets.map((t) => (typeof t === 'object' ? t.slug : null)).filter(Boolean));
    setLines((prev) => prev.filter((l) => !(ids.has(l.id) || (l.slug && slugs.has(l.slug)))));
  }, []);

  /** Re-map cart lines onto live menu rows so prices/ids stay current. */
  const reconcile = useCallback((menuItems = []) => {
    if (!menuItems.length) return;
    setLines((prev) => {
      const bySlug = new Map(menuItems.map((m) => [m.slug, m]));
      const byId = new Map(menuItems.map((m) => [m.id, m]));
      const next = [];
      for (const line of prev) {
        const live = bySlug.get(line.slug) || byId.get(line.id);
        if (!live || !live.isAvailable) continue; // silently drop dead lines
        next.push({
          ...line,
          id: live.id,
          slug: live.slug,
          name: live.name,
          price: live.price,
          image: live.image,
          isVeg: live.isVeg,
        });
      }
      const changed =
        next.length !== prev.length ||
        next.some((l, i) => l.id !== prev[i].id || l.price !== prev[i].price);
      return changed ? next : prev;
    });
  }, []);

  const setQty = useCallback((id, qty) => {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l))));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setCoupon(null);
  }, []);

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  const value = useMemo(
    () => ({
      lines, zone, setZone, coupon, setCoupon, add, remove, setQty, clear, prune, reconcile,
      count, subtotal, drawerOpen, setDrawerOpen, lastAdded,
    }),
    [lines, zone, setZone, coupon, add, remove, setQty, clear, prune, reconcile, count, subtotal, drawerOpen, lastAdded]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
