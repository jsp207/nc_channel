import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const passwordHash = process.env.PASSWORD_HASH;
const sessionSecret = process.env.SESSION_SECRET;
const cookieName = 'nc_admin_session';
const sessionLifetime = 2 * 60 * 60;

function unauthorized(res) {
  res.status(401).json({ authenticated: false });
}

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret).update(value).digest('base64url');
}

function createToken() {
  const payload = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + sessionLifetime,
  })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function hasValidSession(req) {
  if (!sessionSecret) return false;
  const header = req.headers.cookie || '';
  const entry = header.split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`));
  if (!entry) return false;
  const token = entry.slice(cookieName.length + 1);
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function setSessionCookie(res) {
  res.setHeader('Set-Cookie', `${cookieName}=${createToken()}; Max-Age=${sessionLifetime}; Path=/; HttpOnly; Secure; SameSite=Lax`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${cookieName}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`);
}

export async function login(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!passwordHash || !sessionSecret) return res.status(500).json({ error: 'Authentication is not configured' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const password = typeof body.password === 'string' ? body.password : '';
  if (!(await bcrypt.compare(password, passwordHash))) return res.status(401).json({ error: '인증 실패' });
  setSessionCookie(res);
  return res.status(204).end();
}

export function session(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasValidSession(req)) return unauthorized(res);
  return res.status(200).json({ authenticated: true });
}

export function logout(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  clearSessionCookie(res);
  return res.status(204).end();
}
