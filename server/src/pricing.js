import { getSetting } from './db.js';

export const ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'picked_up', 'delivering', 'delivered', 'cancelled'];
export const ACTIVE_STATUSES = ['placed', 'confirmed', 'preparing', 'picked_up', 'delivering'];

export const STATUS_META = {
  placed: { label: 'Order placed', short: 'Placed', tone: 'amber', icon: 'receipt' },
  confirmed: { label: 'Confirmed by kitchen', short: 'Confirmed', tone: 'sky', icon: 'check' },
  preparing: { label: 'Being cooked', short: 'Preparing', tone: 'orange', icon: 'flame' },
  picked_up: { label: 'Picked up by rider', short: 'Picked up', tone: 'violet', icon: 'bike' },
  delivering: { label: 'Out for delivery', short: 'Delivering', tone: 'blue', icon: 'navigation' },
  delivered: { label: 'Delivered', short: 'Delivered', tone: 'green', icon: 'home' },
  cancelled: { label: 'Cancelled', short: 'Cancelled', tone: 'rose', icon: 'x' },
};

const round = (n) => Math.round(n);

export function computeCoupon(coupon, subtotal) {
  if (!coupon || !coupon.active) return { discount: 0, reason: 'This code is not active.' };
  if (subtotal < coupon.min_order) {
    return { discount: 0, reason: `Add ₹${round(coupon.min_order - subtotal)} more to use ${coupon.code}.` };
  }
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { discount: 0, reason: 'This offer has been fully claimed.' };
  }
  let discount =
    coupon.type === 'flat'
      ? coupon.value
      : Math.min((subtotal * coupon.value) / 100, coupon.max_discount ?? Infinity);
  discount = round(Math.min(discount, subtotal));
  return { discount, reason: null };
}

export function quote({ items, zone, coupon, settings }) {
  const cfg = settings || getSetting('restaurant');
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const zoneCfg = cfg.zones?.find((z) => z.name === zone);
  const baseDelivery = zoneCfg?.fee ?? cfg.deliveryFee ?? 25;
  const deliveryFee = subtotal >= (cfg.freeDeliveryAbove ?? 299) ? 0 : baseDelivery;
  const packagingFee = cfg.packagingFee ?? 15;

  let discount = 0;
  let couponError = null;
  if (coupon) {
    const res = computeCoupon(coupon, subtotal);
    discount = res.discount;
    couponError = res.reason;
  }

  const taxPercent = cfg.taxPercent ?? 5;
  const tax = round(((subtotal - discount) * taxPercent) / 100);
  const total = subtotal - discount + deliveryFee + packagingFee + tax;

  return {
    subtotal,
    discount,
    deliveryFee,
    packagingFee,
    tax,
    taxPercent,
    total,
    freeDeliveryAbove: cfg.freeDeliveryAbove ?? 299,
    amountToFreeDelivery: Math.max(0, (cfg.freeDeliveryAbove ?? 299) - subtotal),
    couponError,
  };
}

export function etaFor(zone, settings) {
  const cfg = settings || getSetting('restaurant');
  const z = cfg.zones?.find((x) => x.name === zone);
  // Zone ETAs already include kitchen prep — don't add it twice.
  return Math.round(z?.eta ?? 32);
}
