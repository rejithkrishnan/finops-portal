import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  authProvider,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from './authService';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/authenticate';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).optional(),
  isActive: z.boolean().optional(),
});

// ─── Routes ──────────────────────────────────────────────────────

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const user = await authProvider.authenticate(username, password);

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await authProvider.getUserById(decoded.id);

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authProvider.getUserById(req.user!.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// ─── User Management (Admin only) ───────────────────────────────

// GET /api/auth/users
router.get('/users', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await authProvider.listUsers!();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/users
router.post('/users', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await authProvider.createUser!(data);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/users/:id
router.put('/users/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data = updateUserSchema.parse(req.body);
    const user = await authProvider.updateUser!(id, data);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
