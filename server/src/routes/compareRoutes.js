import { Router } from 'express';
import { compareAssets } from '../controllers/compareController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, compareAssets);

export default router;
