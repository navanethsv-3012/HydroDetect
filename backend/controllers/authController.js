import { registerUser, loginUser } from '../services/authService.js';

/**
 * POST /api/auth/register
 * Admin-gated: only admins can register new users.
 * First user registration is open (seeds admin).
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await registerUser({ name, email, password, role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user profile.
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

export default { register, login, getMe };
