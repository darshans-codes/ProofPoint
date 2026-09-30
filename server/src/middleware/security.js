import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

export const expensiveOperationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'This operation is temporarily rate-limited. Please try again shortly.' },
});

export function validateObjectId(...fields) {
  return (req, res, next) => {
    for (const field of fields) {
      const value = req.params[field] || req.body?.[field] || req.query?.[field];
      if (value !== undefined && !mongoose.isValidObjectId(value)) {
        return res.status(400).json({ error: `Invalid ${field}.` });
      }
    }
    next();
  };
}

export function requireTrustedOrigin(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('origin');
  const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174']
    .filter(Boolean);
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }
  next();
}
