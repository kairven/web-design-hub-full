# Zayka E Raebareli 🍛

A complete, single-restaurant ordering & delivery platform for **Zayka E Raebareli** — built for Raebareli only.
Customers order direct from the kitchen (no aggregator fees), and the restaurant runs the whole operation from a
live dashboard: orders, menu, offers, riders and delivery zones.

> Mughlai, biryani aur Indo-Chinese — sirf Raebareli ke liye.

---

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18 + Vite + React Router, Tailwind CSS v4, lucide icons |
| Backend | Node.js + Express (ESM) |
| Database | SQLite via Node's built-in `node:sqlite` (no native build step) |
| Auth | JWT bearer tokens + bcrypt password hashing |
| Money | Server-side pricing engine — the client only previews it |

No paid services, no external DB, no image CDN required. The SQLite file is created on first run.

---

## Quick start

```bash
npm install                 # API deps
npm --prefix client install # Web deps
npm run seed                # create + populate the database (23 dishes, demo orders)
npm run dev                 # API on :8787, web on :5173
```

Open **http://localhost:5173** (two-port dev mode with hot reload).

**Single-port mode** — recommended for phones and previews, because one origin
serves the app, the API and the photos (no proxy, no dev websocket):

```bash
npm run serve               # builds, then serves everything on http://localhost:8787
# or, once built:
npm start
```

Deep links like `/orders/ZY20261024001` work in both modes.

Re-seed a fresh demo at any time:

```bash
npm run seed -- --force
```

### Demo accounts

| Role | Mobile | Password | Lands on |
| --- | --- | --- | --- |
| Customer | `919876543200` | `zayka123` | Storefront, orders, tracking |
| Admin | `9194210086` | `admin123` | `/admin` dashboard |
| Kitchen staff | `9194210087` | `staff123` | `/admin` (orders + menu) |

The sign-in screen has one-tap autofill cards for all three.

---

## What's included

### Storefront (customer)
- **Home** — hero, live "kitchen open" status, categories, chef's picks, bestsellers, reviews, value props.
- **Menu** — all 23 dishes with real photography, category filters, search, veg-only toggle, sorting, sold-out states.
- **Cart drawer** — optimistic quantity updates, free-delivery progress bar, coupon validation, live totals (GST, packaging, zone delivery fee).
- **Checkout** — saved/new addresses, delivery-zone selector with per-zone fees & ETAs, COD or UPI-on-delivery, kitchen notes, minimum-order guard.
- **Order tracking** — status timeline, rider card, live ETA, cancel (until cooking starts), reorder, and a post-delivery review modal.
- **Account** — profile edit, password change, full address CRUD with default selection.
- Empty, loading (skeletons) and error states throughout; fully responsive with a mobile cart bar and slide-up sheets.

### Admin dashboard (`/admin`)
- **Dashboard** — today's revenue/orders, live order queue, 7-day revenue chart, AOV, ratings, bestsellers.
- **Live orders** — filter by stage, search, auto-refresh every 30s, one-click stage advance (placed → confirmed → cooking → picked up → on the way → delivered), cancel, assign riders, call customer, open in Maps.
- **Menu manager** — full CRUD for dishes (price, photo picker, spice, prep time, veg/bestseller/featured flags), instant sold-out toggles, category CRUD.
- **Offers** — create/edit/pause/delete coupons (flat or percent, min order, caps, usage limits) with redemption progress.
- **Riders** — fleet CRUD, availability control, zones and ratings.
- **Customers** — lifetime value, repeat detection, CSV export.
- **Settings** — kitchen open/closed switch (reflects instantly on the storefront), restaurant details, fees, minimums, GST, and editable delivery zones.

---

## Project layout

```
server/src/
  index.js      Express app, static hosting, SPA fallback
  db.js         SQLite connection, schema/migrations, settings helpers
  auth.js       JWT + bcrypt, requireAuth / requireAdmin middleware
  pricing.js    Single source of truth for coupons, fees, tax, ETA
  routes.js     All REST endpoints (storefront + auth + admin)
  seed.js       Real menu, riders, coupons, orders, reviews, settings
client/src/
  pages/        Home, Menu, Checkout, Orders, OrderDetail, Account, Login, Register
  admin/        AdminLayout + Dashboard, Orders, Menu, Coupons, Riders, Customers, Settings
  components/   UI kit, dish cards, cart drawer, order timeline, header
  context/      Auth, Cart, Store (menu/settings), Toasts
public/dishes/  Dish photography
```

## API surface (excerpt)

```
GET    /api/restaurant            GET  /api/menu                 GET  /api/menu/:slug
GET    /api/reviews               POST /api/coupons/validate
POST   /api/auth/register         POST /api/auth/login           GET/PATCH /api/auth/me
POST   /api/auth/password
GET/POST /api/addresses           PATCH/DELETE /api/addresses/:id
POST   /api/orders/quote          POST /api/orders               GET /api/orders
GET    /api/orders/:code          POST /api/orders/:id/cancel    POST /api/orders/:id/review
GET    /api/admin/stats           GET  /api/admin/orders         PATCH /api/admin/orders/:id/status
PATCH  /api/admin/orders/:id/rider
GET/POST /api/admin/menu          PATCH/DELETE /api/admin/menu/:id
POST   /api/admin/categories      PATCH/DELETE /api/admin/categories/:id
GET/POST /api/admin/coupons       PATCH/DELETE /api/admin/coupons/:id
GET/POST /api/admin/riders        PATCH/DELETE /api/admin/riders/:id
GET    /api/admin/customers       GET/PATCH /api/admin/settings
```

## Notes

- **Mobile-safe storage**: browsers that block `localStorage` in embedded previews (iOS Safari) no longer blank the app — `client/src/lib/storage.js` falls back to memory, and `ErrorBoundary` shows a reload screen instead of a white page.
- **Security**: passwords are bcrypt-hashed, admin routes are role-gated server-side (not just hidden UI), all pricing is recomputed on write, and sold-out items are rejected at order time.
- **Persistence**: everything lives in `server/data/zayka.db` (git-ignored). Delete it and re-run `npm run seed` to start over.
- **Env**: optional `PORT`, `JWT_SECRET`, `DB_FILE`. Set `JWT_SECRET` in production.
- **Delivery scope**: only the six configured Raebareli zones are offered — by design.
