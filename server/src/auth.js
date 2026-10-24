import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get } from './db.js';

const SECRET = process.env.JWT_SECRET || 'zayka-raebareli-dev-secret-change-me';
const TOKEN_TTL = '7d';

export const hashPassword = (pw) => bcrypt.hashSync(pw, 10);
export const verifyPassword = (pw, hash) => bcrypt.compareSync(pw, hash);

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: TOKEN_TTL });

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    createdAt: u.created_at,
  };
}

function readUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, SECRET);
    return get('SELECT * FROM users WHERE id = ?', payload.sub) || null;
  } catch {
    return null;
  }
}

/** Attaches req.user when a valid token is present. */
export function attachUser(req, _res, next) {
  req.user = readUser(req);
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have access to this resource.' });
    }
    next();
  };
}
