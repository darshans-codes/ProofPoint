import { Router } from 'express';
import { createReport, getReports, getReportBySlug } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createReport);
router.get('/', getReports);
router.get('/:slug', getReportBySlug);

export default router;
