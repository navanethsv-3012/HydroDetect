import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { store } from '../utils/inMemoryStore.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Authorization denied.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-aquasentinel-change-in-prod-2024');

    const isMongoConnected = mongoose.connection.readyState === 1;

    let user;
    if (isMongoConnected) {
      user = await User.findById(decoded.id).select('-passwordHash');
      if (!user && decoded.email) {
        user = await User.findOne({ email: decoded.email }).select('-passwordHash');
      }
    } else {
      const u = store.users.find((x) => x._id === decoded.id || x.email === decoded.email);
      if (u) {
        user = { _id: u._id, name: u.name, email: u.email, role: u.role };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Role '${req.user.role}' is not authorized for this action.`,
      });
    }

    next();
  };
};

export default { authenticate, authorize };
