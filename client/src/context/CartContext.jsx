import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'zayka.cart.v1';
const ZONE_KEY = 'zayka.zone';

function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((l) => l && l.id && l.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(readCart);
  const [zone, setZoneState] = useState(() => localStorage.getItem(ZONE_KEY) || 'Civil Lines');
  const [coupon, setCoupon] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines]);

  const setZone = useCallback((z) => {
    setZoneState(z);
    localStorage.setItem(ZONE_KEY, z);
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
      lines, zone, setZone, coupon, setCoupon, add, remove, setQty, clear,
      count, subtotal, drawerOpen, setDrawerOpen, lastAdded,
    }),
    [lines, zone, setZone, coupon, add, remove, setQty, clear, count, subtotal, drawerOpen, lastAdded]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
