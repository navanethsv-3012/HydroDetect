import { Router } from 'express';
import { body } from 'express-validator';
import {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
} from '../controllers/deviceController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router();

// All device routes require authentication
router.use(authenticate);

router.get('/', getDevices);
router.get('/:id', getDevice);

router.post(
  '/',
  authorize('admin'),
  [
    body('deviceId').trim().notEmpty().withMessage('Device ID is required.'),
    body('name').trim().notEmpty().withMessage('Device name is required.'),
    body('location').optional().trim(),
    body('factoryName').optional().trim(),
    validateRequest,
  ],
  createDevice
);

router.put('/:id', authorize('admin', 'authority'), updateDevice);
router.delete('/:id', authorize('admin'), deleteDevice);

export default router;
