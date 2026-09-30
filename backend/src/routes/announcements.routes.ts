import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { sendError, sendSuccess } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { AuditService } from '../services/audit.service';

const router = Router();

// GET announcements (Public / Authenticated with audience filter)
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const activityId = req.query.activityId as string;
    let query = `
      SELECT a.*, 
             u.first_name, u.last_name, u.role as author_role, u.avatar_url,
             act.title as activity_title
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN activities act ON a.activity_id = act.id
      WHERE (a.expiration_date IS NULL OR a.expiration_date > CURRENT_TIMESTAMP)
    `;
    const params: any[] = [];

    if (activityId) {
      query += ` AND a.activity_id = ?`;
      params.push(activityId);
    }

    query += ` ORDER BY a.is_pinned DESC, a.publish_date DESC`;

    const list = await db.query(query, params);
    sendSuccess(res, list);
  } catch (err) {
    sendError(res, 'Failed to fetch announcements', 500);
  }
});

// CREATE announcement
const announcementSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  imageUrl: z.string().optional(),
  activityId: z.string().optional(),
  targetAudience: z.enum(['All', 'Students', 'Teachers', 'Grade Level']).default('All'),
  targetGradeLevel: z.string().optional(),
  isPinned: z.boolean().default(false),
  expirationDate: z.string().optional(),
});

router.post(
  '/',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = announcementSchema.parse(req.body);
      const id = uuidv4();

      await db.run(
        `INSERT INTO announcements (
           id, title, content, image_url, activity_id, author_id,
           target_audience, target_grade_level, is_pinned, expiration_date
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.title,
          data.content,
          data.imageUrl || null,
          data.activityId || null,
          req.user!.userId,
          data.targetAudience,
          data.targetGradeLevel || null,
          data.isPinned ? 1 : 0,
          data.expirationDate || null,
        ]
      );

      // Create notifications for audience
      if (data.targetAudience === 'All' || data.targetAudience === 'Students') {
        const students = await db.query('SELECT user_id FROM students');
        for (const s of students.slice(0, 50)) { // notify active students
          await db.run(
            `INSERT INTO notifications (id, user_id, title, message, type, link)
             VALUES (?, ?, 'New Announcement 📢', ?, 'announcement', '/announcements')`,
            [uuidv4(), s.user_id, data.title]
          );
        }
      }

      await AuditService.log({
        userId: req.user!.userId,
        action: 'ANNOUNCEMENT_PUBLISHED',
        entityType: 'ANNOUNCEMENT',
        entityId: id,
        newData: { title: data.title, audience: data.targetAudience },
        ipAddress: req.ip,
      });

      sendSuccess(res, { id }, 'Announcement published successfully', 201);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        sendError(res, err.errors[0].message, 422);
      } else {
        sendError(res, 'Failed to publish announcement', 500);
      }
    }
  }
);

// DELETE announcement (Admin or author)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await db.run('DELETE FROM announcements WHERE id = ?', [id]);
      await AuditService.log({
        userId: req.user!.userId,
        action: 'ANNOUNCEMENT_DELETED',
        entityType: 'ANNOUNCEMENT',
        entityId: id,
        ipAddress: req.ip,
      });
      sendSuccess(res, null, 'Announcement removed successfully');
    } catch (err) {
      sendError(res, 'Failed to delete announcement', 500);
    }
  }
);

export default router;
