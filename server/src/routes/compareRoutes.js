import { Router } from 'express';
import { compareAssets } from '../controllers/compareController.js';
import { requireAuth } from '../middleware/auth.js';
import { expensiveOperationLimiter, validateObjectId } from '../middleware/security.js';

const router = Router();

router.post('/', requireAuth, expensiveOperationLimiter, validateObjectId('beforeId', 'afterId'), compareAssets);

export default router;
