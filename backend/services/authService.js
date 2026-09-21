import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { store } from '../utils/inMemoryStore.js';

export const registerUser = async ({ name, email, password, role = 'operator' }) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  if (isMongoConnected) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('User with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role,
    });

    const token = generateToken(user);
    return { user: user.toJSON(), token };
  }

  // In-memory fallback
  const existing = store.users.find((u) => u.email === email);
  if (existing) {
    const error = new Error('User with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const newUser = {
    _id: `usr-${Date.now()}`,
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    createdAt: new Date(),
  };

  store.users.push(newUser);
  const token = generateToken(newUser);
  const userResp = { _id: newUser._id, name, email, role };
  return { user: userResp, token };
};

export const loginUser = async ({ email, password }) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  if (isMongoConnected) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken(user);
    return { user: user.toJSON(), token };
  }

  // In-memory fallback
  const user = store.users.find((u) => u.email === email);
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);
  const userResp = { _id: user._id, name: user.name, email: user.email, role: user.role };
  return { user: userResp, token };
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-aquasentinel-change-in-prod-2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export default { registerUser, loginUser };
