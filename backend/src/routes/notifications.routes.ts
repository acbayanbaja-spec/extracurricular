import { Router, Response } from 'express';
import { db } from '../database/db';
import { sendError, sendSuccess } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

// GET all notifications for logged-in user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notifications = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user!.userId]
    );

    const unreadCountRes = await db.get(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [req.user!.userId]
    );
    const unreadCount = parseInt(unreadCountRes?.count || '0', 10);

    sendSuccess(res, {
      notifications,
      unreadCount,
    });
  } catch (err) {
    sendError(res, 'Failed to fetch notifications', 500);
  }
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.run(
      `UPDATE notifications 
       SET is_read = 1, read_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`,
      [id, req.user!.userId]
    );
    sendSuccess(res, null, 'Notification marked as read');
  } catch (err) {
    sendError(res, 'Failed to update notification', 500);
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await db.run(
      `UPDATE notifications 
       SET is_read = 1, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND is_read = 0`,
      [req.user!.userId]
    );
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) {
    sendError(res, 'Failed to mark all as read', 500);
  }
});

export default router;
