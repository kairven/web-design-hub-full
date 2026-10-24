import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = join(__dirname, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(process.env.DB_FILE || join(DATA_DIR, 'zayka.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      phone         TEXT NOT NULL UNIQUE,
      email         TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'customer',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label     TEXT NOT NULL,
      name      TEXT NOT NULL,
      phone     TEXT NOT NULL,
      line1     TEXT NOT NULL,
      area      TEXT NOT NULL,
      city      TEXT NOT NULL DEFAULT 'Raebareli',
      pincode   TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      slug       TEXT NOT NULL UNIQUE,
      tagline    TEXT,
      emoji      TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT NOT NULL,
      slug            TEXT NOT NULL UNIQUE,
      description     TEXT,
      price           REAL NOT NULL,
      compare_at_price REAL,
      image           TEXT,
      category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      is_veg          INTEGER NOT NULL DEFAULT 0,
      is_available    INTEGER NOT NULL DEFAULT 1,
      is_featured     INTEGER NOT NULL DEFAULT 0,
      is_bestseller   INTEGER NOT NULL DEFAULT 0,
      spice_level     INTEGER NOT NULL DEFAULT 1,
      prep_time       INTEGER NOT NULL DEFAULT 20,
      calories        INTEGER,
      rating          REAL NOT NULL DEFAULT 4.6,
      rating_count    INTEGER NOT NULL DEFAULT 0,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      code        TEXT NOT NULL UNIQUE,
      title       TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'percent',
      value       REAL NOT NULL,
      min_order   REAL NOT NULL DEFAULT 0,
      max_discount REAL,
      active      INTEGER NOT NULL DEFAULT 1,
      usage_limit INTEGER,
      usage_count INTEGER NOT NULL DEFAULT 0,
      valid_till  TEXT
    );

    CREATE TABLE IF NOT EXISTS riders (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      phone      TEXT NOT NULL,
      vehicle    TEXT NOT NULL DEFAULT 'Bike',
      zone       TEXT NOT NULL DEFAULT 'Civil Lines',
      status     TEXT NOT NULL DEFAULT 'available',
      rating     REAL NOT NULL DEFAULT 4.8,
      deliveries INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      code            TEXT NOT NULL UNIQUE,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status          TEXT NOT NULL DEFAULT 'placed',
      payment_method  TEXT NOT NULL DEFAULT 'cod',
      payment_status  TEXT NOT NULL DEFAULT 'pending',
      subtotal        REAL NOT NULL,
      delivery_fee    REAL NOT NULL DEFAULT 0,
      packaging_fee   REAL NOT NULL DEFAULT 0,
      discount        REAL NOT NULL DEFAULT 0,
      tax             REAL NOT NULL DEFAULT 0,
      total           REAL NOT NULL,
      coupon_code     TEXT,
      address_json    TEXT NOT NULL,
      rider_id        INTEGER REFERENCES riders(id) ON DELETE SET NULL,
      notes           TEXT,
      eta_minutes     INTEGER NOT NULL DEFAULT 35,
      placed_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
      name         TEXT NOT NULL,
      price        REAL NOT NULL,
      qty          INTEGER NOT NULL,
      image        TEXT
    );

    CREATE TABLE IF NOT EXISTS order_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status     TEXT NOT NULL,
      note       TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id     INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      rating       INTEGER NOT NULL,
      comment      TEXT,
      dish         TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_menu_category ON menu_items(category_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_events_order ON order_events(order_id);
  `);
}

const q = (sql) => db.prepare(sql);
export const all = (sql, ...p) => q(sql).all(...p);
export const get = (sql, ...p) => q(sql).get(...p);
export const run = (sql, ...p) => q(sql).run(...p);

export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function getSetting(key, fallback = null) {
  const row = get('SELECT value FROM settings WHERE key = ?', key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

export function setSetting(key, value) {
  run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    JSON.stringify(value)
  );
}
