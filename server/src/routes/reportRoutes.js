import { Router } from 'express';
import { createReport, getReports, getReportBySlug } from '../controllers/reportController.js';

const router = Router();

router.post('/', createReport);
router.get('/', getReports);
router.get('/:slug', getReportBySlug);

export default router;
