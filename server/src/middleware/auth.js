import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'proofpoint_session';

function getCookieValue(req, name) {
  const header = req.headers.cookie || '';
  const entry = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

export function signSession(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured.');
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    secret,
    { expiresIn: '2h', issuer: 'proofpoint' }
  );
}

export function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAMESITE || (secure ? 'None' : 'Lax');
  if (sameSite === 'None' && !secure) {
    throw new Error('COOKIE_SAMESITE=None requires NODE_ENV=production.');
  }
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=7200; SameSite=${sameSite}${secure ? '; Secure' : ''}`
  );
}

export function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAMESITE || (secure ? 'None' : 'Lax');
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=${sameSite}${secure ? '; Secure' : ''}`
  );
}

export function requireAuth(req, res, next) {
  const token = getCookieValue(req, COOKIE_NAME);
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    req.auth = jwt.verify(token, secret, { issuer: 'proofpoint' });
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

export function optionalAuth(req, res, next) {
  const token = getCookieValue(req, COOKIE_NAME);
  const secret = process.env.JWT_SECRET;
  if (token && secret) {
    try {
      req.auth = jwt.verify(token, secret, { issuer: 'proofpoint' });
    } catch {
      req.auth = null;
    }
  }
  next();
}

export const sessionCookieName = COOKIE_NAME;
