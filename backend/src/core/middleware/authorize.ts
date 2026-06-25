import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { ApiError } from './errorHandler';

/**
 * Role-based authorization middleware.
 * Usage: authorize('ADMIN') or authorize('ADMIN', 'OPERATOR')
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
};
