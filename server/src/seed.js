/**
 * Seeds Zayka E Raebareli with the real menu, demo customers, riders,
 * coupons, reviews and a spread of orders across every lifecycle stage.
 * Safe to run repeatedly: it resets the demo tables first.
 */
import { db, migrate, run, get, all, setSetting, transaction } from './db.js';
import { hashPassword } from './auth.js';

const CATEGORIES = [
  { name: 'Biryani & Rice', slug: 'biryani-rice', emoji: '🍛', tagline: 'Dum-cooked, ghar jaisa', sort: 1 },
  { name: 'Chicken Specials', slug: 'chicken-specials', emoji: '🍗', tagline: 'Zayka signature', sort: 2 },
  { name: 'Fried Rice & Combos', slug: 'fried-rice', emoji: '🍚', tagline: 'Indo-Chinese heat', sort: 3 },
  { name: 'Rolls & Breads', slug: 'rolls-breads', emoji: '🌯', tagline: 'Tawa fresh', sort: 4 },
  { name: 'Egg Corner', slug: 'egg-corner', emoji: '🥚', tagline: 'Anda, desi style', sort: 5 },
  { name: 'Salads & Sides', slug: 'salads-sides', emoji: '🥗', tagline: 'Fresh crunch', sort: 6 },
];

const MENU = [
  // --- Biryani & Rice
  {
    name: 'Chicken Dum Biryani', slug: 'chicken-dum-biryani', cat: 'biryani-rice', price: 80, compare: 110,
    desc: 'Ghar ke khas peshey masalon aur dum par tayyar — har dana khushbu se bhara hua, keema-style chicken ke saath.',
    image: '/dishes/hero.jpg', veg: 0, spice: 2, prep: 25, cal: 520, rating: 4.9, reviews: 412,
    featured: 1, bestseller: 1, sort: 1,
  },
  {
    name: 'Egg Biryani', slug: 'egg-biryani', cat: 'biryani-rice', price: 80,
    desc: 'Saffron rice layered with masala-boiled eggs, fried onions aur thodi si pudina — comfort food ka asli meaning.',
    image: '/dishes/egg-biryani.jpg', veg: 0, spice: 1, prep: 20, cal: 480, rating: 4.7, reviews: 188,
    bestseller: 1, sort: 2,
  },
  {
    name: 'Plain Rice', slug: 'plain-rice', cat: 'biryani-rice', price: 50,
    desc: 'Bhaap me sahi tareeke se pakaye gaye khile-khile lambe basmati dane — har curry ka perfect partner.',
    image: '/dishes/plain-rice.jpg', veg: 1, spice: 0, prep: 12, cal: 280, rating: 4.5, reviews: 96, sort: 3,
  },
  {
    name: 'Jeera Rice', slug: 'jeera-rice', cat: 'biryani-rice', price: 60,
    desc: 'Ghee me bhune jeere ke saath basmati rice — khushbudaar, halka aur ghar ke daal ke saath best.',
    image: '/dishes/jeera-rice.jpg', veg: 1, spice: 0, prep: 15, cal: 310, rating: 4.6, reviews: 121, sort: 4,
  },

  // --- Chicken Specials
  {
    name: 'Zayka Special Chicken', slug: 'zayka-special-chicken', cat: 'chicken-specials', price: 140, compare: 170,
    desc: 'Rich aur Mughlai masalon me bana hua signature whole chicken — zaykedaar gravy, seene mein masala.',
    image: '/dishes/murg-musallam.jpg', veg: 0, spice: 2, prep: 35, cal: 640, rating: 4.9, reviews: 356,
    featured: 1, bestseller: 1, sort: 1,
  },
  {
    name: 'Chicken Dum Biryani (Half)', slug: 'chicken-dum-biryani-half', cat: 'chicken-specials', price: 80,
    desc: 'Aadha handi, poora swaad. Slow-cooked chicken aur basmati rice ka dum wala jodi.',
    image: '/dishes/hero.jpg', veg: 0, spice: 2, prep: 22, cal: 420, rating: 4.7, reviews: 143, sort: 2,
    hidden: 0,
  },
  {
    name: 'Chilly Chicken Dry', slug: 'chilly-chicken-dry', cat: 'chicken-specials', price: 120,
    desc: 'Bahar se ekdum crispy aur andar se juicy chicken, teekhi mirchi aur spring onion ke saath.',
    image: '/dishes/chilly-chicken.jpg', veg: 0, spice: 3, prep: 20, cal: 460, rating: 4.8, reviews: 276,
    featured: 1, bestseller: 1, sort: 3,
  },
  {
    name: 'Chilly Chicken Gravy', slug: 'chilly-chicken-gravy', cat: 'chicken-specials', price: 100,
    desc: 'Crispy fried chicken ke rasile tukde, shimla mirch aur pyaaz ki gravy me — chawal ke saath zabardast.',
    image: '/dishes/chilly-chicken-gravy.jpg', veg: 0, spice: 3, prep: 20, cal: 430, rating: 4.6, reviews: 154, sort: 4,
  },
  {
    name: 'Chicken Keema', slug: 'chicken-keema', cat: 'chicken-specials', price: 130,
    desc: 'Garma-garam aur zaykedaar chicken keema, desi masalon me bhuna hua — paav, roti ya paratha ke saath.',
    image: '/dishes/chicken-keema.jpg', veg: 0, spice: 2, prep: 25, cal: 390, rating: 4.7, reviews: 203, sort: 5,
  },
  {
    name: 'Chicken Fry', slug: 'chicken-fry', cat: 'chicken-specials', price: 150,
    desc: 'Garma-garam aur crispy chicken, onion rings aur nimbu ke saath — ekdum dhaba style.',
    image: '/dishes/chicken-fry.jpg', veg: 0, spice: 2, prep: 25, cal: 540, rating: 4.8, reviews: 231,
    bestseller: 1, sort: 6,
  },
  {
    name: 'Chicken Lollypop', slug: 'chicken-lollypop', cat: 'chicken-specials', price: 170, compare: 199,
    desc: 'Crispy Chicken Lollipop ko khas spice mix me toss kiya gaya — har bite me crunch, andar juice.',
    image: '/dishes/chicken-lollypop.jpg', veg: 0, spice: 2, prep: 25, cal: 480, rating: 4.9, reviews: 298,
    featured: 1, sort: 7,
  },
  {
    name: 'Chicken Curry', slug: 'chicken-curry', cat: 'chicken-specials', price: 100,
    desc: 'Desi masalon aur rich gravy me bana hua ghar jaisa chicken curry — roti ke saath perfect.',
    image: '/dishes/chicken-curry.jpg', veg: 0, spice: 2, prep: 25, cal: 410, rating: 4.7, reviews: 265, sort: 8,
  },

  // --- Fried Rice
  {
    name: 'Chicken Fried Rice', slug: 'chicken-fried-rice', cat: 'fried-rice', price: 80,
    desc: 'Wok-tossed rice with shredded chicken, egg aur spring onion — street-style Indo-Chinese swaad.',
    image: '/dishes/chicken-fried-rice.jpg', veg: 0, spice: 1, prep: 18, cal: 450, rating: 4.7, reviews: 244,
    bestseller: 1, sort: 1,
  },
  {
    name: 'Veg Fried Rice', slug: 'veg-fried-rice', cat: 'fried-rice', price: 60,
    desc: 'Veg Fried Rice — matar, gajar, corn aur spring onion ke saath halka aur tasty.',
    image: '/dishes/veg-fried-rice.jpg', veg: 1, spice: 1, prep: 15, cal: 380, rating: 4.5, reviews: 132, sort: 2,
  },
  {
    name: 'Chicken Chilly + 2 Pc Egg Rice Combo', slug: 'chicken-chilly-egg-rice-combo', cat: 'fried-rice', price: 99, compare: 130,
    desc: 'Zaaykedaar Egg Rice aur saucy, crispy Chicken Chilly — do logon ke liye perfect combo.',
    image: '/dishes/combo.jpg', veg: 0, spice: 2, prep: 22, cal: 720, rating: 4.8, reviews: 167,
    featured: 1, sort: 3,
  },

  // --- Rolls & Breads
  {
    name: 'Chicken Roll', slug: 'chicken-roll', cat: 'rolls-breads', price: 50,
    desc: 'Chicken Roll — soft paratha me juicy chicken, pyaaz aur pudina chutney. Ek haath ka pura meal.',
    image: '/dishes/chicken-roll.jpg', veg: 0, spice: 2, prep: 12, cal: 380, rating: 4.6, reviews: 214,
    bestseller: 1, sort: 1,
  },
  {
    name: 'Chicken Egg Roll', slug: 'chicken-egg-roll', cat: 'rolls-breads', price: 70,
    desc: 'Chicken Egg Roll — paratha par anda, phir masaledaar chicken aur crunchy salad. Double delight.',
    image: '/dishes/chicken-egg-roll.jpg', veg: 0, spice: 2, prep: 14, cal: 440, rating: 4.8, reviews: 189, sort: 2,
  },
  {
    name: 'Double Egg Roll', slug: 'double-egg-roll', cat: 'rolls-breads', price: 50,
    desc: 'Taaze ande ki layer ke saath seka hua crispy paratha roll — double anda, double maza.',
    image: '/dishes/egg-roll.jpg', veg: 0, spice: 1, prep: 10, cal: 360, rating: 4.5, reviews: 176, sort: 3,
  },
  {
    name: 'Single Egg Roll', slug: 'single-egg-roll', cat: 'rolls-breads', price: 30,
    desc: 'Taaze ande ki layer ke saath seka hua crispy paratha roll — light, quick aur pocket friendly.',
    image: '/dishes/egg-roll.jpg', veg: 0, spice: 1, prep: 8, cal: 260, rating: 4.4, reviews: 143, sort: 4,
  },
  {
    name: 'Mughlai Paratha', slug: 'mughlai-paratha', cat: 'rolls-breads', price: 15,
    desc: 'Ulte tawa ka Mughlai paratha — layered, ghee-brushed aur garma-garam.',
    image: '/dishes/mughlai-paratha.jpg', veg: 1, spice: 0, prep: 8, cal: 210, rating: 4.6, reviews: 89, sort: 5,
  },
  {
    name: 'Tawa Roti', slug: 'tawa-roti', cat: 'rolls-breads', price: 7,
    desc: 'Shuddh gehun ke aate se bani garma-garam roti, ekdum naram — curry ka best saathi.',
    image: '/dishes/tawa-roti.jpg', veg: 1, spice: 0, prep: 5, cal: 90, rating: 4.5, reviews: 201, sort: 6,
  },

  // --- Egg Corner
  {
    name: 'Egg Curry', slug: 'egg-curry', cat: 'egg-corner', price: 70,
    desc: 'Desi style me bani garma-garam Egg Curry — do ande, rich tomato-onion gravy. Rice ya roti dono ke saath.',
    image: '/dishes/egg-curry.jpg', veg: 0, spice: 2, prep: 18, cal: 340, rating: 4.7, reviews: 158, sort: 1,
  },

  // --- Salads
  {
    name: 'Green Salad', slug: 'green-salad', cat: 'salads-sides', price: 30,
    desc: 'Green Salad — kheera, tamatar, pyaaz aur nimbu ke saath taaza crunch, har meal ke saath.',
    image: '/dishes/green-salad.jpg', veg: 1, spice: 0, prep: 5, cal: 90, rating: 4.5, reviews: 64, sort: 1,
  },
];

const RIDERS = [
  { name: 'Ravi Verma', phone: '919876543210', vehicle: 'Bike · UP 33 AB 4412', zone: 'Civil Lines', status: 'available', rating: 4.9, deliveries: 812 },
  { name: 'Ajeet Kumar', phone: '919876543211', vehicle: 'Bike · UP 33 CD 9081', zone: 'Indira Nagar', status: 'on_delivery', rating: 4.8, deliveries: 654 },
  { name: 'Sonu Yadav', phone: '919876543212', vehicle: 'Scooter · UP 33 EF 2231', zone: 'Railway Road', status: 'available', rating: 4.7, deliveries: 511 },
  { name: 'Irfan Ali', phone: '919876543213', vehicle: 'Bike · UP 33 GH 7710', zone: 'Bachhrawan', status: 'offline', rating: 4.6, deliveries: 322 },
  { name: 'Deepak Singh', phone: '919876543214', vehicle: 'Bike · UP 33 IJ 5567', zone: 'Jais', status: 'available', rating: 4.9, deliveries: 947 },
];

const COUPONS = [
  { code: 'ZAYKA50', title: '₹50 off your first order', type: 'flat', value: 50, min_order: 199, active: 1, usage_limit: 500, usage_count: 128 },
  { code: 'RAEBARELI10', title: '10% off across Raebareli', type: 'percent', value: 10, min_order: 149, max_discount: 60, active: 1, usage_limit: 1000, usage_count: 402 },
  { code: 'BIRYANI99', title: '₹30 off on biryani night', type: 'flat', value: 30, min_order: 149, active: 1, usage_limit: 300, usage_count: 97 },
  { code: 'FREEDEL', title: 'Free delivery in Civil Lines', type: 'flat', value: 25, min_order: 99, active: 0, usage_limit: 200, usage_count: 143 },
];

const REVIEWS = [
  { name: 'Shalini Tiwari', rating: 5, done: true, comment: 'Dum biryani ekdum ghar jaisi! Aajtak Raebareli me itni khushbudaar biryani nahi khaayi.', dish: 'Chicken Dum Biryani' },
  { name: 'Anand Mishra', rating: 5, done: true, comment: 'Chicken lollypop crisp tha aur andar se juicy. Packing bhi shaandar, 32 minute me pahunch gaya.', dish: 'Chicken Lollypop' },
  { name: 'Ritu Singh', rating: 4, done: true, comment: 'Mughlai paratha ke saath chicken curry — dono garma-garam. Bas thoda aur gravy ho sakta tha.', dish: 'Mughlai Paratha' },
  { name: 'Faizan Khan', rating: 5, done: true, comment: 'Keema aur tawa roti ka combo best. Ghar jaisa swaad, Zayka kabhi disappoint nahi karta.', dish: 'Chicken Keema' },
  { name: 'Pooja Gupta', rating: 4, done: true, comment: 'Veg fried rice fresh tha, thoda kam salt. Delivery rider ka behaviour bahut accha tha.', dish: 'Veg Fried Rice' },
  { name: 'Ayush Srivastava', rating: 5, done: true, comment: 'Egg roll sirf ₹30 me? Value for money. Raat ki bhookh ka perfect solution.', dish: 'Single Egg Roll' },
];

const PK = ['Amit Srivastava', 'Neha Gupta', 'Rahul Verma', 'Pooja Tandon', 'Vikas Singh', 'Ishita Mishra'];
const PK_AREAS = ['Civil Lines', 'Indira Nagar', 'Railway Road', 'Bachhrawan', 'Jais', 'Ahiyapur'];
const PK_ADDRESS = ['12/A Tilak Nagar, near Ghantaghar', 'House 44, Indira Nagar Sector 3', 'Shop 8, Railway Road', 'L-21 Avas Vikas Colony', 'Near Bus Stand, Jais Road', '32 Ahiyapur Chauraha'];

function seed() {
  migrate();
  const has = get('SELECT COUNT(*) AS c FROM menu_items');
  const force = process.argv.includes('--force');

  if (has.c > 0 && !force) {
    console.log('Database already seeded. Use `npm run seed -- --force` to reset.');
    return;
  }

  transaction(() => {
    // Wipe demo data in FK-safe order
    ['order_events', 'order_items', 'reviews', 'orders', 'addresses', 'menu_items', 'categories', 'coupons', 'riders']
      .forEach((t) => db.exec(`DELETE FROM ${t};`));
    db.exec(`DELETE FROM users WHERE role = 'customer';`);
    db.exec(`UPDATE users SET password_hash = '${hashPassword('admin123')}' WHERE role = 'admin';`);

    // Staff + demo accounts
    const admin = get("SELECT * FROM users WHERE role = 'admin'");
    if (!admin) {
      run(
        `INSERT INTO users (name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, 'admin')`,
        'Zayka Kitchen', '9194210086', 'admin@zaykaraebareli.in', hashPassword('admin123')
      );
    }
    const staff = get("SELECT * FROM users WHERE role = 'staff'");
    if (!staff) {
      run(
        `INSERT INTO users (name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, 'staff')`,
        'Kitchen Staff', '9194210087', 'staff@zaykaraebareli.in', hashPassword('staff123')
      );
    }

    const customerIds = [];
    PK.forEach((name, i) => {
      const phone = `91987654${String(3200 + i).padStart(4, '0')}`;
      const r = run(
        `INSERT INTO users (name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, 'customer')`,
        name,
        phone,
        i === 0 ? 'demo@zaykaraebareli.in' : null,
        hashPassword('zayka123')
      );
      const uid = Number(r.lastInsertRowid);
      customerIds.push(uid);
      run(
        `INSERT INTO addresses (user_id, label, name, phone, line1, area, city, pincode, is_default)
         VALUES (?, ?, ?, ?, ?, ?, 'Raebareli', ?, 1)`,
        uid, 'Home', name, phone, PK_ADDRESS[i], PK_AREAS[i], '229001'
      );
      if (i === 0) {
        run(
          `INSERT INTO addresses (user_id, label, name, phone, line1, area, city, pincode, is_default)
           VALUES (?, 'Work', ?, ?, 'Court Road, opp. DM Residence', 'Civil Lines', 'Raebareli', '229001', 0)`,
          uid, name, phone
        );
      }
    });

    // Categories
    const catIds = {};
    CATEGORIES.forEach((c) => {
      const r = run(
        'INSERT INTO categories (name, slug, tagline, emoji, sort_order) VALUES (?, ?, ?, ?, ?)',
        c.name, c.slug, c.tagline, c.emoji, c.sort
      );
      catIds[c.slug] = Number(r.lastInsertRowid);
    });

    // Menu
    const menuIds = {};
    MENU.forEach((m, i) => {
      const r = run(
        `INSERT INTO menu_items
         (name, slug, description, price, compare_at_price, image, category_id, is_veg, is_available,
          is_featured, is_bestseller, spice_level, prep_time, calories, rating, rating_count, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        m.name, m.slug, m.desc, m.price, m.compare ?? null, m.image, catIds[m.cat], m.veg,
        m.hidden ? 0 : 1, m.featured ?? 0, m.bestseller ?? 0, m.spice, m.prep, m.cal,
        m.rating, m.reviews, m.sort ?? i
      );
      menuIds[m.slug] = Number(r.lastInsertRowid);
    });
    // One item missing today, so the dashboard's availability toggle is meaningful
    run('UPDATE menu_items SET is_available = 0 WHERE slug = ?', 'chicken-fry');

    RIDERS.forEach((r) => {
      run(
        'INSERT INTO riders (name, phone, vehicle, zone, status, rating, deliveries) VALUES (?, ?, ?, ?, ?, ?, ?)',
        r.name, r.phone, r.vehicle, r.zone, r.status, r.rating, r.deliveries
      );
    });

    COUPONS.forEach((c) => {
      run(
        `INSERT INTO coupons (code, title, type, value, min_order, max_discount, active, usage_limit, usage_count, valid_till)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', '+45 days'))`,
        c.code, c.title, c.type, c.value, c.min_order, c.max_discount ?? null, c.active, c.usage_limit, c.usage_count
      );
    });

    // Demo orders
    const riderRows = all('SELECT id FROM riders');
    const itemRows = all('SELECT id, name, price, image, slug FROM menu_items');
    const bySlug = Object.fromEntries(itemRows.map((i) => [i.slug, i]));
    const now = Date.now();

    const plans = [
      { status: 'delivering', minutesAgo: 18, items: [['chicken-dum-biryani', 2], ['green-salad', 1]], pay: 'cod', rider: 1, coupon: 'RAEBARELI10' },
      { status: 'preparing', minutesAgo: 6, items: [['chicken-lollypop', 1], ['chicken-fried-rice', 1]], pay: 'cod', rider: 0 },
      { status: 'placed', minutesAgo: 2, items: [['zayka-special-chicken', 1], ['mughlai-paratha', 3]], pay: 'upi', rider: null },
      { status: 'delivered', minutesAgo: 95, items: [['chicken-keema', 1], ['tawa-roti', 4]], pay: 'cod', rider: 0, coupon: 'ZAYKA50' },
      { status: 'delivered', minutesAgo: 260, items: [['egg-biryani', 2], ['chilly-chicken-dry', 1]], pay: 'upi', rider: 2 },
      { status: 'delivered', minutesAgo: 1420, items: [['chicken-roll', 2], ['double-egg-roll', 1]], pay: 'cod', rider: 4 },
      { status: 'cancelled', minutesAgo: 1500, items: [['veg-fried-rice', 1]], pay: 'cod', rider: null },
      { status: 'delivered', minutesAgo: 2900, items: [['chicken-dum-biryani', 1], ['chicken-curry', 1], ['plain-rice', 2]], pay: 'upi', rider: 0, coupon: 'BIRYANI99' },
      { status: 'delivered', minutesAgo: 4200, items: [['chicken-chilly-egg-rice-combo', 1]], pay: 'cod', rider: 2 },
    ];

    const statusFlow = ['placed', 'confirmed', 'preparing', 'picked_up', 'delivering'];

    plans.forEach((plan, idx) => {
      const userId = customerIds[idx % customerIds.length];
      const address = get('SELECT * FROM addresses WHERE user_id = ? LIMIT 1', userId);
      const items = plan.items.map(([slug, qty]) => ({ ...bySlug[slug], qty }));
      if (items.some((i) => !i.id)) return;
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const deliveryFee = subtotal >= 299 ? 0 : 25;
      const packaging = 15;
      const coupon = plan.coupon ? get('SELECT * FROM coupons WHERE code = ?', plan.coupon) : null;
      let discount = 0;
      if (coupon && subtotal >= coupon.min_order) {
        discount = coupon.type === 'flat' ? coupon.value : Math.min((subtotal * coupon.value) / 100, coupon.max_discount ?? Infinity);
        discount = Math.round(discount);
      }
      const tax = Math.round((subtotal - discount) * 0.05);
      const total = subtotal - discount + deliveryFee + packaging + tax;
      const placedAt = new Date(now - plan.minutesAgo * 60_000);
      const iso = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
      const code = `ZY${placedAt.getFullYear()}${String(placedAt.getMonth() + 1).padStart(2, '0')}${String(placedAt.getDate()).padStart(2, '0')}${String(idx + 1).padStart(3, '0')}`;

      const r = run(
        `INSERT INTO orders (code, user_id, status, payment_method, payment_status, subtotal, delivery_fee,
          packaging_fee, discount, tax, total, coupon_code, address_json, rider_id, notes, eta_minutes, placed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        code, userId, plan.status, plan.pay,
        plan.status === 'delivered' ? 'paid' : 'pending',
        subtotal, deliveryFee, packaging, discount, tax, total, plan.coupon ?? null,
        JSON.stringify({
          label: address.label, name: address.name, phone: address.phone,
          line1: address.line1, area: address.area, city: address.city, pincode: address.pincode,
        }),
        plan.rider === null ? null : riderRows[plan.rider]?.id ?? null,
        idx === 3 ? 'Ghar ke bahar handover kar dena, bell mat bajana.' : null,
        plan.status === 'delivered' ? 28 : 35,
        iso(placedAt), iso(placedAt)
      );
      const orderId = Number(r.lastInsertRowid);

      items.forEach((it) => {
        run(
          'INSERT INTO order_items (order_id, menu_item_id, name, price, qty, image) VALUES (?, ?, ?, ?, ?, ?)',
          orderId, it.id, it.name, it.price, it.qty, it.image
        );
      });

      let reached = plan.status === 'cancelled' ? 1 : plan.status === 'delivered' ? statusFlow.length : statusFlow.indexOf(plan.status) + 1;
      for (let s = 0; s < Math.max(reached, 1); s++) {
        const t = new Date(placedAt.getTime() + s * 4 * 60_000);
        run(
          'INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, ?, ?, ?)',
          orderId, statusFlow[s], s === 0 ? 'Order received by kitchen' : null, iso(t)
        );
      }
      if (plan.status === 'cancelled') {
        run(
          'INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, ?, ?, ?)',
          orderId, 'cancelled', 'Customer cancelled before preparation', iso(new Date(placedAt.getTime() + 3 * 60_000))
        );
      }
    });

    REVIEWS.forEach((rev, i) => {
      run(
        'INSERT INTO reviews (user_id, rating, comment, dish, created_at) VALUES (?, ?, ?, ?, ?)',
        customerIds[i % customerIds.length], rev.rating, rev.comment, rev.dish,
        new Date(now - (i + 1) * 7 * 3600_000).toISOString().slice(0, 19).replace('T', ' ')
      );
    });

    setSetting('restaurant', {
      name: 'Zayka E Raebareli',
      tagline: 'Mughlai, biryani aur Indo-Chinese — sirf Raebareli ke liye.',
      phone: '+91 91942 10086',
      whatsapp: '919194210086',
      address: 'Ghantaghar Road, Civil Lines, Raebareli, Uttar Pradesh 229001',
      openTime: '11:00',
      closeTime: '23:30',
      deliveryRadiusKm: 8,
      deliveryFee: 25,
      freeDeliveryAbove: 299,
      packagingFee: 15,
      taxPercent: 5,
      minOrder: 99,
      avgPrepMinutes: 28,
      upiId: 'zaykaraebareli@upi',
      zones: [
        { name: 'Civil Lines', eta: 25, fee: 0 },
        { name: 'Indira Nagar', eta: 30, fee: 15 },
        { name: 'Railway Road', eta: 28, fee: 15 },
        { name: 'Ahiyapur', eta: 35, fee: 25 },
        { name: 'Bachhrawan', eta: 45, fee: 40 },
        { name: 'Jais', eta: 50, fee: 45 },
      ],
    });
    setSetting('kitchen_open', true);
  });

  const counts = {
    menu: get('SELECT COUNT(*) c FROM menu_items').c,
    orders: get('SELECT COUNT(*) c FROM orders').c,
    customers: get("SELECT COUNT(*) c FROM users WHERE role='customer'").c,
    riders: get('SELECT COUNT(*) c FROM riders').c,
  };
  console.log('Seeded Zayka E Raebareli:', counts);
  console.log('Admin login   → 9194210086 / admin123');
  console.log('Staff login   → 9194210087 / staff123');
  console.log('Customer demo → 919876543200 / zayka123');
}

seed();
