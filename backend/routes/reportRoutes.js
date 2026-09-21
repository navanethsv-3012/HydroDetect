import { Router } from 'express';
import { getReport, getReportData } from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/:period', getReport);
router.get('/:period/data', getReportData);

export default router;
