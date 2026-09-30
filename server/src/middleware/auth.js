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

const DEFAULT_JWT_SECRET = 'proofpoint_dev_secret_jwt_key_fallback_12345';

export function signSession(user) {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  const userId = user._id ? user._id.toString() : (user.id || '000000000000000000000001');
  return jwt.sign(
    { sub: userId, role: user.role || 'user' },
    secret,
    { expiresIn: '24h', issuer: 'proofpoint' }
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
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=86400; SameSite=${sameSite}${secure ? '; Secure' : ''}`
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
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  if (!token) {
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
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  if (token) {
    try {
      req.auth = jwt.verify(token, secret, { issuer: 'proofpoint' });
    } catch {
      req.auth = null;
    }
  }
  next();
}

export const sessionCookieName = COOKIE_NAME;
