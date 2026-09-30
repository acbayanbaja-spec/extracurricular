import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { sendError } from '../utils/response';

export function requireRole(allowedRoles: ('ADMINISTRATOR' | 'TEACHER' | 'STUDENT')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`,
        403
      );
      return;
    }

    next();
  };
}
