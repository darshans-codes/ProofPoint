import { Router } from 'express';
import { createReport, getReports, getReportBySlug } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';
import { expensiveOperationLimiter, validateObjectId } from '../middleware/security.js';

const router = Router();

router.post('/', requireAuth, expensiveOperationLimiter, validateObjectId('projectId', 'beforeId', 'afterId'), createReport);
router.get('/', validateObjectId('projectId'), getReports);
router.get('/:slug', getReportBySlug);

export default router;
