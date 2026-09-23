import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === 'production';
const passwordHash = '$2b$12$y21rFNdfChyRddFSBcd.deSOUucEVfn/6TG5VvkynkPPxKKQq/F7a';
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10kb' }));
app.use(session({
  name: 'nc_admin_session',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction,
    maxAge: 2 * 60 * 60 * 1000,
  },
}));

const attempts = new Map();
function rateLimitFailedLogins(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter(time => now - time < 15 * 60 * 1000);
  attempts.set(ip, recent);
  return recent.length >= 10;
}

app.get('/api/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session.authenticated) });
});

app.post('/api/login', async (req, res) => {
  const ip = req.ip;
  if (rateLimitFailedLogins(ip)) {
    return res.status(429).json({ error: '잠시 후 다시 시도하세요.' });
  }

  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const valid = await bcrypt.compare(password, passwordHash);
  if (!valid) {
    const failed = attempts.get(ip) || [];
    failed.push(Date.now());
    attempts.set(ip, failed);
    return res.status(401).json({ error: '인증 실패' });
  }

  req.session.authenticated = true;
  return res.status(204).end();
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.status(204).end());
});

if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
}

app.listen(port, () => {
  console.log(`Authentication server listening on http://127.0.0.1:${port}`);
});
