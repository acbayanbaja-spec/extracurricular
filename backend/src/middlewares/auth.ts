import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { sendError } from '../utils/response';
import { db } from '../database/db';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    sendError(res, 'Authentication token required. Please sign in.', 401);
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    // Verify user is still active in database
    const user = await db.get(
      'SELECT id, email, role, status, first_name, last_name, avatar_url FROM users WHERE id = ?',
      [payload.userId]
    );

    if (!user || user.status !== 'ACTIVE') {
      sendError(res, 'User session has expired or account is inactive.', 401);
      return;
    }

    req.user = {
      ...payload,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
    };

    next();
  } catch (err: any) {
    sendError(res, 'Invalid or expired session token. Please sign in again.', 401);
  }
}
