import { Router } from 'express';
import { getReadings, getLatestReadings, getTrends } from '../controllers/readingController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getReadings);
router.get('/latest', getLatestReadings);
router.get('/trends', getTrends);

export default router;
