import { Router } from 'express';
import { compareAssets } from '../controllers/compareController.js';

const router = Router();

router.post('/', compareAssets);

export default router;
