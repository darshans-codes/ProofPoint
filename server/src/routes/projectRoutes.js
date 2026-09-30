import { Router } from 'express';
import { getProjects, createProject } from '../controllers/projectController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', getProjects);
router.post('/', requireAuth, createProject);

export default router;
