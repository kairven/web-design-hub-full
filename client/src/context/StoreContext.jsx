import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kitchenOpen, setKitchenOpenState] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [store, menuData] = await Promise.all([api('/restaurant'), api('/menu')]);
      setRestaurant(store.restaurant);
      setCategories(store.categories);
      setKitchenOpenState(store.kitchenOpen);
      setMenu(menuData.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const value = useMemo(
    () => ({ restaurant, categories, menu, loading, error, reload: load, kitchenOpen, setKitchenOpen: setKitchenOpenState }),
    [restaurant, categories, menu, loading, error, load, kitchenOpen]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
};

/** Mirrors the server's pricing rules for instant cart feedback. */
export function previewCart({ lines, zone, restaurant, coupon }) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const zoneCfg = restaurant?.zones?.find((z) => z.name === zone);
  const freeAbove = restaurant?.freeDeliveryAbove ?? 299;
  const baseDelivery = zoneCfg?.fee ?? restaurant?.deliveryFee ?? 25;
  const deliveryFee = subtotal >= freeAbove ? 0 : baseDelivery;
  const packagingFee = restaurant?.packagingFee ?? 15;
  let discount = 0;
  if (coupon) {
    discount =
      coupon.type === 'percent'
        ? Math.min(Math.round((subtotal * coupon.value) / 100), coupon.maxDiscount ?? Infinity)
        : Math.min(coupon.value, subtotal);
  }
  const taxPercent = restaurant?.taxPercent ?? 5;
  const tax = Math.round(((subtotal - discount) * taxPercent) / 100);
  const total = subtotal - discount + deliveryFee + packagingFee + tax;
  return {
    subtotal, discount, deliveryFee, packagingFee, tax, taxPercent, total, freeAbove,
    amountToFreeDelivery: Math.max(0, freeAbove - subtotal),
    zoneEta: zoneCfg?.eta ?? restaurant?.avgPrepMinutes ?? 30,
  };
}
