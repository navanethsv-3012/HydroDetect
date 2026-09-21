import mongoose from 'mongoose';
import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import User from '../models/User.js';
import { store } from '../utils/inMemoryStore.js';

const router = Router();

/**
 * POST /api/auth/register
 * First registration is open (seeds the admin). All subsequent registrations require admin role.
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters.'),
    body('role')
      .optional()
      .isIn(['admin', 'authority', 'operator'])
      .withMessage('Role must be admin, authority, or operator.'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const isMongoConnected = mongoose.connection.readyState === 1;
      let userCount = 0;
      if (isMongoConnected) {
        userCount = await User.countDocuments();
      } else {
        userCount = store.users.length;
      }

      // Check if request carries an Authorization token (Admin creating a user)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authenticate(req, res, (authErr) => {
          if (authErr) return next(authErr);
          return authorize('admin')(req, res, (roleErr) => {
            if (roleErr) return next(roleErr);
            return register(req, res, next);
          });
        });
      }

      // Public registration (e.g. from Login/Register form)
      // Default to operator role if not specified
      if (!req.body.role) {
        req.body.role = userCount === 0 ? 'admin' : 'operator';
      }
      return register(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
    validateRequest,
  ],
  login
);

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, getMe);

export default router;
