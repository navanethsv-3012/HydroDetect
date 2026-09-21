import { Router } from 'express';
import { getSummary, getTrends, getEfficiency } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/trends', getTrends);
router.get('/efficiency', getEfficiency);

export default router;
