import { Router } from 'express';
import { searchAssets } from '../controllers/searchController.js';

const router = Router();

router.post('/', searchAssets);

export default router;
