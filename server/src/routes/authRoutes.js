import { Router } from 'express';
import { getMe, loginWithGoogle, logout } from '../controllers/authController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/google', loginWithGoogle);
router.get('/me', optionalAuth, getMe);
router.post('/logout', logout);

export default router;
