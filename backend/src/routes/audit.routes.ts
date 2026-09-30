import { Router, Response } from 'express';
import { db } from '../database/db';
import { sendError, sendSuccess } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';

const router = Router();

// GET audit logs with filters
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMINISTRATOR']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const search = (req.query.search as string || '').trim().toLowerCase();
      const action = req.query.action as string;
      const limit = parseInt(req.query.limit as string || '100', 10);

      let query = `
        SELECT a.*, 
               u.first_name, u.last_name, u.email, u.role as user_role
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (search) {
        query += ` AND (LOWER(a.action) LIKE ? OR LOWER(a.entity_type) LIKE ? OR LOWER(u.email) LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (action && action !== 'all') {
        query += ` AND a.action = ?`;
        params.push(action);
      }

      query += ` ORDER BY a.created_at DESC LIMIT ?`;
      params.push(limit);

      const logs = await db.query(query, params);
      sendSuccess(res, logs);
    } catch (err) {
      sendError(res, 'Failed to fetch audit logs', 500);
    }
  }
);

export default router;
