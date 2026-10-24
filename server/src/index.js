import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import api from './routes.js';
import { migrate } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const PORT = Number(process.env.PORT || 8787);

migrate();

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'zayka-api' }));
app.use('/api', api);

app.use('/api', (req, res) => res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` }));

// Serve the database food photography so <img src="/dishes/x.jpg"> works in dev too.
app.use('/dishes', express.static(join(ROOT, 'public', 'dishes'), { maxAge: '7d' }));
app.use('/brand', express.static(join(ROOT, 'public', 'brand'), { maxAge: '7d' }));

// Production: serve the built SPA with client-side routing fallback.
const dist = join(ROOT, 'client', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[api error]', err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Zayka API listening on http://0.0.0.0:${PORT}`);
});
