import { Router } from 'express';
import { getSuggestedPairs } from '../controllers/pairController.js';

const router = Router();

router.get('/', getSuggestedPairs);

export default router;
