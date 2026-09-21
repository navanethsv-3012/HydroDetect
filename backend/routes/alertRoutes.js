import { Router } from 'express';
import { getAlerts, getAlertSummary, acknowledgeAlert } from '../controllers/alertController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getAlerts);
router.get('/summary', getAlertSummary);
router.put('/:id/acknowledge', authorize('admin', 'authority'), acknowledgeAlert);

export default router;
