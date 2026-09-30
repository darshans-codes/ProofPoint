import { Router } from 'express';
import { getMe, loginWithGoogle, loginAsGuest, logout } from '../controllers/authController.js';
import { optionalAuth } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

const router = Router();

router.post('/google', authLimiter, loginWithGoogle);
router.post('/guest', loginAsGuest);
router.post('/demo', loginAsGuest);
router.get('/me', optionalAuth, getMe);
router.post('/logout', logout);

export default router;
