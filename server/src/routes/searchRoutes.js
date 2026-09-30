import { Router } from 'express';
import { searchAssets } from '../controllers/searchController.js';
import { requireAuth } from '../middleware/auth.js';
import { expensiveOperationLimiter } from '../middleware/security.js';

const router = Router();

router.post('/', requireAuth, expensiveOperationLimiter, searchAssets);

export default router;
