import { Router } from 'express';
import { all, get, getSetting, run, transaction } from './db.js';
import { attachUser, hashPassword, publicUser, requireAdmin, requireAuth, signToken, verifyPassword } from './auth.js';
import { STATUS_META, ACTIVE_STATUSES, ORDER_STATUSES, quote, computeCoupon, etaFor } from './pricing.js';

const router = Router();
router.use(attachUser);

const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
const nowSql = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

/* ------------------------------------------------------------------ */
/* Storefront                                                          */
/* ------------------------------------------------------------------ */

router.get('/restaurant', (req, res) => {
  res.json({
    restaurant: getSetting('restaurant'),
    kitchenOpen: getSetting('kitchen_open', true),
    categories: all('SELECT * FROM categories ORDER BY sort_order'),
  });
});

router.get('/menu', (req, res) => {
  const rows = all(`
    SELECT m.*, c.name AS category_name, c.slug AS category_slug, c.emoji AS category_emoji
    FROM menu_items m LEFT JOIN categories c ON c.id = m.category_id
    ORDER BY c.sort_order, m.sort_order, m.id
  `);
  res.json({ items: rows.map(normalizeItem) });
});

router.get('/menu/:slug', (req, res) => {
  const row = get(`
    SELECT m.*, c.name AS category_name, c.slug AS category_slug
    FROM menu_items m LEFT JOIN categories c ON c.id = m.category_id
    WHERE m.slug = ?`, req.params.slug);
  if (!row) return bad(res, 'Dish not found.', 404);
  const related = all(
    'SELECT * FROM menu_items WHERE category_id = ? AND id != ? AND is_available = 1 LIMIT 3',
    row.category_id, row.id
  ).map(normalizeItem);
  res.json({ item: normalizeItem(row), related });
});

function normalizeItem(m) {
  return {
    id: m.id,
    name: m.name,
    slug: m.slug,
    description: m.description,
    price: m.price,
    compareAtPrice: m.compare_at_price,
    image: m.image,
    categoryId: m.category_id,
    category: m.category_name,
    categorySlug: m.category_slug,
    isVeg: !!m.is_veg,
    isAvailable: !!m.is_available,
    isFeatured: !!m.is_featured,
    isBestseller: !!m.is_bestseller,
    spiceLevel: m.spice_level,
    prepTime: m.prep_time,
    calories: m.calories,
    rating: m.rating,
    ratingCount: m.rating_count,
  };
}

router.get('/reviews', (_req, res) => {
  const rows = all(`
    SELECT r.*, u.name AS user_name FROM reviews r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC LIMIT 20
  `);
  res.json({ reviews: rows });
});

router.post('/coupons/validate', (req, res) => {
  const { code, subtotal = 0 } = req.body || {};
  if (!code) return bad(res, 'Enter a coupon code.');
  const coupon = get('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)', String(code).trim());
  if (!coupon) return bad(res, 'That coupon is not valid.', 404);
  const { discount, reason } = computeCoupon(coupon, Number(subtotal));
  if (reason) return bad(res, reason);
  res.json({
    code: coupon.code,
    title: coupon.title,
    discount,
    type: coupon.type,
    value: coupon.value,
    minOrder: coupon.min_order,
    maxDiscount: coupon.max_discount,
  });
});

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

router.post('/auth/register', (req, res) => {
  const { name, phone, email, password } = req.body || {};
  if (!name?.trim()) return bad(res, 'Please enter your name.');
  if (!/^\d{10}$/.test(String(phone || '').trim())) return bad(res, 'Enter a valid 10-digit mobile number.');
  if (!password || password.length < 6) return bad(res, 'Password must be at least 6 characters.');

  const cleanPhone = String(phone).trim();
  if (get('SELECT id FROM users WHERE phone = ?', cleanPhone)) {
    return bad(res, 'This mobile number is already registered. Try signing in.', 409);
  }
  const r = run(
    'INSERT INTO users (name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    name.trim(), cleanPhone, email?.trim() || null, hashPassword(password), 'customer'
  );
  const user = get('SELECT * FROM users WHERE id = ?', Number(r.lastInsertRowid));
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/auth/login', (req, res) => {
  const { phone, password, identifier } = req.body || {};
  const id = String(identifier || phone || '').trim();
  if (!id || !password) return bad(res, 'Enter your mobile number and password.');
  const user = get('SELECT * FROM users WHERE phone = ? OR email = ?', id, id);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return bad(res, 'Incorrect mobile number or password.', 401);
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/auth/me', requireAuth, (req, res) => {
  res.json({
    user: publicUser(req.user),
    addresses: all('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', req.user.id),
  });
});

router.patch('/auth/me', requireAuth, (req, res) => {
  const { name, email } = req.body || {};
  run(
    'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?',
    name?.trim() || null, email?.trim() || null, req.user.id
  );
  res.json({ user: publicUser(get('SELECT * FROM users WHERE id = ?', req.user.id)) });
});

router.post('/auth/password', requireAuth, (req, res) => {
  const { current, next } = req.body || {};
  if (!verifyPassword(current || '', req.user.password_hash)) return bad(res, 'Current password is incorrect.');
  if (!next || next.length < 6) return bad(res, 'New password must be at least 6 characters.');
  run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(next), req.user.id);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* Addresses                                                           */
/* ------------------------------------------------------------------ */

router.get('/addresses', requireAuth, (req, res) => {
  res.json({ addresses: all('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', req.user.id) });
});

router.post('/addresses', requireAuth, (req, res) => {
  const { label = 'Home', name, phone, line1, area, pincode } = req.body || {};
  if (!name?.trim() || !line1?.trim() || !area?.trim() || !/^\d{6}$/.test(String(pincode || ''))) {
    return bad(res, 'Please fill name, address, area and a valid 6-digit pincode.');
  }
  const count = get('SELECT COUNT(*) c FROM addresses WHERE user_id = ?', req.user.id).c;
  const r = run(
    `INSERT INTO addresses (user_id, label, name, phone, line1, area, city, pincode, is_default)
     VALUES (?, ?, ?, ?, ?, ?, 'Raebareli', ?, ?)`,
    req.user.id, label, name, phone || req.user.phone, line1, area, pincode, count === 0 ? 1 : 0
  );
  res.status(201).json({ address: get('SELECT * FROM addresses WHERE id = ?', Number(r.lastInsertRowid)) });
});

router.patch('/addresses/:id', requireAuth, (req, res) => {
  const addr = get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  if (!addr) return bad(res, 'Address not found.', 404);
  const { label, name, phone, line1, area, pincode, isDefault } = req.body || {};
  transaction(() => {
    if (isDefault) run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', req.user.id);
    run(
      `UPDATE addresses SET label = ?, name = ?, phone = ?, line1 = ?, area = ?, pincode = ?, is_default = ?
       WHERE id = ?`,
      label ?? addr.label, name ?? addr.name, phone ?? addr.phone, line1 ?? addr.line1,
      area ?? addr.area, pincode ?? addr.pincode, isDefault ? 1 : isDefault === false ? 0 : addr.is_default,
      addr.id
    );
  });
  res.json({ address: get('SELECT * FROM addresses WHERE id = ?', addr.id) });
});

router.delete('/addresses/:id', requireAuth, (req, res) => {
  const r = run('DELETE FROM addresses WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  if (!r.changes) return bad(res, 'Address not found.', 404);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

const hydrateOrder = (order) => {
  if (!order) return null;
  const items = all('SELECT * FROM order_items WHERE order_id = ?', order.id);
  const events = all('SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at, id', order.id);
  const rider = order.rider_id ? get('SELECT * FROM riders WHERE id = ?', order.rider_id) : null;
  const customer = get('SELECT name, phone FROM users WHERE id = ?', order.user_id);
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    statusLabel: STATUS_META[order.status]?.label ?? order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    subtotal: order.subtotal,
    deliveryFee: order.delivery_fee,
    packagingFee: order.packaging_fee,
    discount: order.discount,
    tax: order.tax,
    total: order.total,
    couponCode: order.coupon_code,
    address: JSON.parse(order.address_json),
    notes: order.notes,
    etaMinutes: order.eta_minutes,
    placedAt: order.placed_at,
    updatedAt: order.updated_at,
    items,
    events,
    rider,
    customer,
  };
};

router.post('/orders/quote', (req, res) => {
  const { items = [], zone, couponCode } = req.body || {};
  if (!Array.isArray(items) || !items.length) return bad(res, 'Your cart is empty.');
  const priced = items.map((line) => {
    const dbItem = get('SELECT * FROM menu_items WHERE id = ?', line.id);
    if (!dbItem || !dbItem.is_available) return null;
    return { price: dbItem.price, qty: Math.max(1, Math.min(20, Number(line.qty) || 1)) };
  });
  if (priced.some((p) => p === null)) return bad(res, 'Some dishes are no longer available.');
  const coupon = couponCode ? get('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)', couponCode) : null;
  const q = quote({ items: priced, zone, coupon });
  res.json({ quote: q, etaMinutes: etaFor(zone) });
});

router.post('/orders', requireAuth, (req, res) => {
  if (!getSetting('kitchen_open', true)) return bad(res, 'The kitchen is closed right now. Please try again later.', 409);
  const { items = [], addressId, zone, couponCode, paymentMethod = 'cod', notes = '' } = req.body || {};
  if (!Array.isArray(items) || !items.length) return bad(res, 'Your cart is empty.');
  if (!['cod', 'upi'].includes(paymentMethod)) return bad(res, 'Unsupported payment method.');

  const address = get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', addressId, req.user.id);
  if (!address) return bad(res, 'Choose a delivery address.');

  const lines = [];
  for (const line of items) {
    const dbItem = get('SELECT * FROM menu_items WHERE id = ?', line.id);
    if (!dbItem) return bad(res, 'A dish in your cart no longer exists.');
    if (!dbItem.is_available) return bad(res, `${dbItem.name} is sold out right now.`);
    lines.push({ ...dbItem, qty: Math.max(1, Math.min(20, Number(line.qty) || 1)) });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const cfg = getSetting('restaurant');
  if (subtotal < (cfg.minOrder ?? 0)) {
    return bad(res, `Minimum order value is ₹${cfg.minOrder}. Add ₹${cfg.minOrder - subtotal} more.`);
  }

  const coupon = couponCode ? get('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)', couponCode) : null;
  const q = quote({ items: lines, zone: zone || address.area, coupon, settings: cfg });
  const code = `ZY${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(
    (get('SELECT COUNT(*) c FROM orders').c % 999) + 1
  ).padStart(3, '0')}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  const orderId = transaction(() => {
    const r = run(
      `INSERT INTO orders (code, user_id, status, payment_method, payment_status, subtotal, delivery_fee,
        packaging_fee, discount, tax, total, coupon_code, address_json, notes, eta_minutes, placed_at, updated_at)
       VALUES (?, ?, 'placed', ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      code, req.user.id, paymentMethod, q.subtotal, q.deliveryFee, q.packagingFee, q.discount, q.tax, q.total,
      coupon?.code ?? null,
      JSON.stringify({
        label: address.label, name: address.name, phone: address.phone,
        line1: address.line1, area: address.area, city: address.city, pincode: address.pincode,
      }),
      notes.slice(0, 300) || null, etaFor(zone || address.area, cfg), nowSql(), nowSql()
    );
    const id = Number(r.lastInsertRowid);
    lines.forEach((l) =>
      run('INSERT INTO order_items (order_id, menu_item_id, name, price, qty, image) VALUES (?, ?, ?, ?, ?, ?)',
        id, l.id, l.name, l.price, l.qty, l.image)
    );
    run('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)', id, 'placed', 'Order received by kitchen');
    if (coupon) run('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?', coupon.id);
    return id;
  });

  res.status(201).json({ order: hydrateOrder(get('SELECT * FROM orders WHERE id = ?', orderId)) });
});

router.get('/orders', requireAuth, (req, res) => {
  const rows = all('SELECT * FROM orders WHERE user_id = ? ORDER BY placed_at DESC', req.user.id);
  res.json({ orders: rows.map(hydrateOrder) });
});

router.get('/orders/:code', requireAuth, (req, res) => {
  const isStaff = ['admin', 'staff'].includes(req.user.role);
  const row = get(
    `SELECT * FROM orders WHERE code = ? AND (${isStaff ? '1=1' : 'user_id = ?'})`,
    ...(isStaff ? [req.params.code] : [req.params.code, req.user.id])
  );
  if (!row) return bad(res, 'Order not found.', 404);
  res.json({ order: hydrateOrder(row) });
});

router.post('/orders/:id/cancel', requireAuth, (req, res) => {
  const order = get('SELECT * FROM orders WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  if (!order) return bad(res, 'Order not found.', 404);
  if (!['placed', 'confirmed'].includes(order.status)) {
    return bad(res, 'This order is already in the kitchen and cannot be cancelled. Please call us.');
  }
  transaction(() => {
    run("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?", nowSql(), order.id);
    run("INSERT INTO order_events (order_id, status, note) VALUES (?, 'cancelled', ?)", order.id, 'Cancelled by customer');
  });
  res.json({ order: hydrateOrder(get('SELECT * FROM orders WHERE id = ?', order.id)) });
});

router.post('/orders/:id/review', requireAuth, (req, res) => {
  const { rating, comment, dish } = req.body || {};
  const order = get('SELECT * FROM orders WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  if (!order) return bad(res, 'Order not found.', 404);
  if (order.status !== 'delivered') return bad(res, 'You can review once the order is delivered.');
  if (!(rating >= 1 && rating <= 5)) return bad(res, 'Pick a rating from 1 to 5.');
  run(
    'INSERT INTO reviews (user_id, order_id, rating, comment, dish) VALUES (?, ?, ?, ?, ?)',
    req.user.id, order.id, Math.round(rating), comment?.slice(0, 400) || null, dish || null
  );
  res.status(201).json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

router.get('/admin/stats', requireAdmin, (_req, res) => {
  const today = "date('now')";
  const revenueRow = get(
    `SELECT COALESCE(SUM(total),0) v, COUNT(*) c FROM orders
     WHERE status != 'cancelled' AND date(placed_at) = ${today}`
  );
  const allTime = get("SELECT COALESCE(SUM(total),0) v, COUNT(*) c FROM orders WHERE status != 'cancelled'");
  const active = get(
    `SELECT COUNT(*) c FROM orders WHERE status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})`,
    ...ACTIVE_STATUSES
  );
  const avg = get("SELECT COALESCE(AVG(rating),0) r, COUNT(*) c FROM reviews");
  const topItems = all(`
    SELECT oi.name, SUM(oi.qty) qty, SUM(oi.qty * oi.price) revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'cancelled'
    GROUP BY oi.name ORDER BY qty DESC LIMIT 5
  `);
  const byDay = all(`
    SELECT date(placed_at) day, COUNT(*) orders, COALESCE(SUM(total),0) revenue
    FROM orders WHERE status != 'cancelled' AND placed_at >= date('now','-6 days')
    GROUP BY day ORDER BY day
  `);
  const byStatus = all('SELECT status, COUNT(*) c FROM orders GROUP BY status');
  const customers = get("SELECT COUNT(*) c FROM users WHERE role = 'customer'");
  const menuStats = get('SELECT COUNT(*) total, SUM(is_available) avail FROM menu_items');

  res.json({
    today: { revenue: revenueRow.v, orders: revenueRow.c },
    allTime: { revenue: allTime.v, orders: allTime.c, aov: allTime.c ? Math.round(allTime.v / allTime.c) : 0 },
    activeOrders: active.c,
    rating: { average: Math.round(avg.r * 10) / 10, count: avg.c },
    topItems,
    byDay,
    byStatus,
    customers: customers.c,
    menu: { total: menuStats.total, available: menuStats.avail ?? 0 },
  });
});

router.get('/admin/orders', requireAdmin, (req, res) => {
  const { status, q } = req.query;
  let sql = `SELECT o.* FROM orders o JOIN users u ON u.id = o.user_id WHERE 1=1`;
  const params = [];
  if (status && status !== 'all') {
    if (status === 'active') {
      sql += ` AND o.status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})`;
      params.push(...ACTIVE_STATUSES);
    } else {
      sql += ' AND o.status = ?';
      params.push(status);
    }
  }
  if (q) {
    sql += ' AND (o.code LIKE ? OR u.name LIKE ? OR u.phone LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY o.placed_at DESC LIMIT 200';
  res.json({ orders: all(sql, ...params).map(hydrateOrder) });
});

router.patch('/admin/orders/:id/status', requireAdmin, (req, res) => {
  const { status, note } = req.body || {};
  if (!ORDER_STATUSES.includes(status)) return bad(res, 'Unknown status.');
  const order = get('SELECT * FROM orders WHERE id = ?', req.params.id);
  if (!order) return bad(res, 'Order not found.', 404);

  transaction(() => {
    const paymentStatus =
      status === 'delivered' ? 'paid' : order.payment_status;
    run(
      'UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE id = ?',
      status, paymentStatus, nowSql(), order.id
    );
    run('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)', order.id, status, note || null);
  });
  res.json({ order: hydrateOrder(get('SELECT * FROM orders WHERE id = ?', order.id)) });
});

router.patch('/admin/orders/:id/rider', requireAdmin, (req, res) => {
  const { riderId } = req.body || {};
  const order = get('SELECT * FROM orders WHERE id = ?', req.params.id);
  if (!order) return bad(res, 'Order not found.', 404);
  if (riderId && !get('SELECT id FROM riders WHERE id = ?', riderId)) return bad(res, 'Rider not found.', 404);
  run('UPDATE orders SET rider_id = ?, updated_at = ? WHERE id = ?', riderId || null, nowSql(), order.id);
  if (riderId) run("UPDATE riders SET status = 'on_delivery' WHERE id = ?", riderId);
  res.json({ order: hydrateOrder(get('SELECT * FROM orders WHERE id = ?', order.id)) });
});

router.get('/admin/menu', requireAdmin, (_req, res) => {
  const rows = all(`
    SELECT m.*, c.name AS category_name FROM menu_items m
    LEFT JOIN categories c ON c.id = m.category_id
    ORDER BY c.sort_order, m.sort_order, m.id`);
  res.json({
    items: rows.map((m) => ({ ...normalizeItem(m), sortOrder: m.sort_order })),
    categories: all('SELECT * FROM categories ORDER BY sort_order'),
  });
});

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

function validateItem(body) {
  if (!body.name?.trim()) return 'Dish name is required.';
  if (!(Number(body.price) > 0)) return 'Price must be greater than zero.';
  if (!body.categoryId) return 'Pick a category.';
  return null;
}

router.post('/admin/menu', requireAdmin, (req, res) => {
  const b = req.body || {};
  const err = validateItem(b);
  if (err) return bad(res, err);
  let slug = slugify(b.name);
  if (get('SELECT id FROM menu_items WHERE slug = ?', slug)) slug = `${slug}-${Date.now().toString().slice(-4)}`;
  const maxSort = get('SELECT COALESCE(MAX(sort_order),0) s FROM menu_items').s;
  const r = run(
    `INSERT INTO menu_items (name, slug, description, price, compare_at_price, image, category_id, is_veg,
      is_available, is_featured, is_bestseller, spice_level, prep_time, calories, rating, rating_count, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    b.name.trim(), slug, b.description || '', Number(b.price), b.compareAtPrice || null,
    b.image || '/dishes/placeholder.jpg', b.categoryId, b.isVeg ? 1 : 0,
    b.isAvailable === false ? 0 : 1, b.isFeatured ? 1 : 0, b.isBestseller ? 1 : 0,
    Number(b.spiceLevel ?? 1), Number(b.prepTime ?? 20), Number(b.calories ?? 0),
    Number(b.rating ?? 4.6), maxSort + 1
  );
  const row = get('SELECT * FROM menu_items WHERE id = ?', Number(r.lastInsertRowid));
  res.status(201).json({ item: normalizeItem(row) });
});

router.patch('/admin/menu/:id', requireAdmin, (req, res) => {
  const item = get('SELECT * FROM menu_items WHERE id = ?', req.params.id);
  if (!item) return bad(res, 'Dish not found.', 404);
  const b = req.body || {};
  run(
    `UPDATE menu_items SET name = ?, description = ?, price = ?, compare_at_price = ?, image = ?,
      category_id = ?, is_veg = ?, is_available = ?, is_featured = ?, is_bestseller = ?,
      spice_level = ?, prep_time = ?, calories = ? WHERE id = ?`,
    b.name ?? item.name,
    b.description ?? item.description,
    b.price != null ? Number(b.price) : item.price,
    b.compareAtPrice !== undefined ? b.compareAtPrice || null : item.compare_at_price,
    b.image ?? item.image,
    b.categoryId ?? item.category_id,
    b.isVeg !== undefined ? (b.isVeg ? 1 : 0) : item.is_veg,
    b.isAvailable !== undefined ? (b.isAvailable ? 1 : 0) : item.is_available,
    b.isFeatured !== undefined ? (b.isFeatured ? 1 : 0) : item.is_featured,
    b.isBestseller !== undefined ? (b.isBestseller ? 1 : 0) : item.is_bestseller,
    b.spiceLevel !== undefined ? Number(b.spiceLevel) : item.spice_level,
    b.prepTime !== undefined ? Number(b.prepTime) : item.prep_time,
    b.calories !== undefined ? Number(b.calories) : item.calories,
    item.id
  );
  res.json({ item: normalizeItem(get('SELECT * FROM menu_items WHERE id = ?', item.id)) });
});

router.delete('/admin/menu/:id', requireAdmin, (req, res) => {
  const r = run('DELETE FROM menu_items WHERE id = ?', req.params.id);
  if (!r.changes) return bad(res, 'Dish not found.', 404);
  res.json({ ok: true });
});

router.post('/admin/categories', requireAdmin, (req, res) => {
  const { name, tagline = '', emoji = '🍽️' } = req.body || {};
  if (!name?.trim()) return bad(res, 'Category name is required.');
  const slug = slugify(name);
  if (get('SELECT id FROM categories WHERE slug = ?', slug)) return bad(res, 'That category already exists.', 409);
  const sort = get('SELECT COALESCE(MAX(sort_order),0) s FROM categories').s + 1;
  const r = run('INSERT INTO categories (name, slug, tagline, emoji, sort_order) VALUES (?, ?, ?, ?, ?)',
    name.trim(), slug, tagline, emoji, sort);
  res.status(201).json({ category: get('SELECT * FROM categories WHERE id = ?', Number(r.lastInsertRowid)) });
});

router.patch('/admin/categories/:id', requireAdmin, (req, res) => {
  const cat = get('SELECT * FROM categories WHERE id = ?', req.params.id);
  if (!cat) return bad(res, 'Category not found.', 404);
  const { name, tagline, emoji } = req.body || {};
  run('UPDATE categories SET name = ?, tagline = ?, emoji = ? WHERE id = ?',
    name ?? cat.name, tagline ?? cat.tagline, emoji ?? cat.emoji, cat.id);
  res.json({ category: get('SELECT * FROM categories WHERE id = ?', cat.id) });
});

router.delete('/admin/categories/:id', requireAdmin, (req, res) => {
  const inUse = get('SELECT COUNT(*) c FROM menu_items WHERE category_id = ?', req.params.id).c;
  if (inUse) return bad(res, `Move ${inUse} dish(es) to another category first.`);
  const r = run('DELETE FROM categories WHERE id = ?', req.params.id);
  if (!r.changes) return bad(res, 'Category not found.', 404);
  res.json({ ok: true });
});

router.get('/admin/coupons', requireAdmin, (_req, res) => {
  res.json({ coupons: all('SELECT * FROM coupons ORDER BY active DESC, id DESC') });
});

router.post('/admin/coupons', requireAdmin, (req, res) => {
  const { code, title, type = 'percent', value, minOrder = 0, maxDiscount, usageLimit } = req.body || {};
  if (!code?.trim() || !title?.trim()) return bad(res, 'Code and title are required.');
  if (!(Number(value) > 0)) return bad(res, 'Discount value must be greater than zero.');
  if (get('SELECT id FROM coupons WHERE UPPER(code) = UPPER(?)', code.trim())) {
    return bad(res, 'That coupon code already exists.', 409);
  }
  const r = run(
    `INSERT INTO coupons (code, title, type, value, min_order, max_discount, active, usage_limit, usage_count, valid_till)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, 0, date('now','+30 days'))`,
    code.trim().toUpperCase(), title.trim(), type, Number(value), Number(minOrder),
    maxDiscount ? Number(maxDiscount) : null, usageLimit ? Number(usageLimit) : null
  );
  res.status(201).json({ coupon: get('SELECT * FROM coupons WHERE id = ?', Number(r.lastInsertRowid)) });
});

router.patch('/admin/coupons/:id', requireAdmin, (req, res) => {
  const c = get('SELECT * FROM coupons WHERE id = ?', req.params.id);
  if (!c) return bad(res, 'Coupon not found.', 404);
  const b = req.body || {};
  run(
    `UPDATE coupons SET title = ?, type = ?, value = ?, min_order = ?, max_discount = ?,
      active = ?, usage_limit = ? WHERE id = ?`,
    b.title ?? c.title, b.type ?? c.type, b.value != null ? Number(b.value) : c.value,
    b.minOrder != null ? Number(b.minOrder) : c.min_order,
    b.maxDiscount !== undefined ? (b.maxDiscount ? Number(b.maxDiscount) : null) : c.max_discount,
    b.active !== undefined ? (b.active ? 1 : 0) : c.active,
    b.usageLimit !== undefined ? (b.usageLimit ? Number(b.usageLimit) : null) : c.usage_limit,
    c.id
  );
  res.json({ coupon: get('SELECT * FROM coupons WHERE id = ?', c.id) });
});

router.delete('/admin/coupons/:id', requireAdmin, (req, res) => {
  const r = run('DELETE FROM coupons WHERE id = ?', req.params.id);
  if (!r.changes) return bad(res, 'Coupon not found.', 404);
  res.json({ ok: true });
});

router.get('/admin/riders', requireAdmin, (_req, res) => {
  res.json({ riders: all('SELECT * FROM riders ORDER BY name') });
});

router.post('/admin/riders', requireAdmin, (req, res) => {
  const { name, phone, vehicle = 'Bike', zone = 'Civil Lines' } = req.body || {};
  if (!name?.trim() || !/^\d{10}$/.test(String(phone || '').trim())) {
    return bad(res, 'Rider name and a 10-digit phone are required.');
  }
  const r = run('INSERT INTO riders (name, phone, vehicle, zone) VALUES (?, ?, ?, ?)',
    name.trim(), phone.trim(), vehicle, zone);
  res.status(201).json({ rider: get('SELECT * FROM riders WHERE id = ?', Number(r.lastInsertRowid)) });
});

router.patch('/admin/riders/:id', requireAdmin, (req, res) => {
  const rider = get('SELECT * FROM riders WHERE id = ?', req.params.id);
  if (!rider) return bad(res, 'Rider not found.', 404);
  const { name, phone, vehicle, zone, status } = req.body || {};
  run('UPDATE riders SET name = ?, phone = ?, vehicle = ?, zone = ?, status = ? WHERE id = ?',
    name ?? rider.name, phone ?? rider.phone, vehicle ?? rider.vehicle, zone ?? rider.zone,
    status ?? rider.status, rider.id);
  res.json({ rider: get('SELECT * FROM riders WHERE id = ?', rider.id) });
});

router.delete('/admin/riders/:id', requireAdmin, (req, res) => {
  run('UPDATE orders SET rider_id = NULL WHERE rider_id = ?', req.params.id);
  const r = run('DELETE FROM riders WHERE id = ?', req.params.id);
  if (!r.changes) return bad(res, 'Rider not found.', 404);
  res.json({ ok: true });
});

router.get('/admin/customers', requireAdmin, (_req, res) => {
  const rows = all(`
    SELECT u.id, u.name, u.phone, u.email, u.created_at,
      COUNT(o.id) orders,
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END),0) spent,
      MAX(o.placed_at) last_order
    FROM users u LEFT JOIN orders o ON o.user_id = u.id
    WHERE u.role = 'customer'
    GROUP BY u.id ORDER BY spent DESC`);
  res.json({ customers: rows });
});

router.get('/admin/settings', requireAdmin, (_req, res) => {
  res.json({ settings: getSetting('restaurant'), kitchenOpen: getSetting('kitchen_open', true) });
});

router.patch('/admin/settings', requireAdmin, (req, res) => {
  const current = getSetting('restaurant');
  const { kitchenOpen, ...rest } = req.body || {};
  const next = { ...current, ...rest };
  run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    'restaurant', JSON.stringify(next));
  if (kitchenOpen !== undefined) {
    run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      'kitchen_open', JSON.stringify(!!kitchenOpen));
  }
  res.json({ settings: getSetting('restaurant'), kitchenOpen: getSetting('kitchen_open', true) });
});

export default router;
