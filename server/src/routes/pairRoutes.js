import { Router } from 'express';
import { getSuggestedPairs } from '../controllers/pairController.js';
import { validateObjectId } from '../middleware/security.js';

const router = Router();

router.get('/', validateObjectId('projectId'), getSuggestedPairs);

export default router;
