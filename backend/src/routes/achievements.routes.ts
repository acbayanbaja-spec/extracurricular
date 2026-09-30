import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { sendError, sendSuccess } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { AuditService } from '../services/audit.service';
import { AchievementService } from '../services/achievement.service';

const router = Router();

// GET all achievements
router.get('/', async (_req, res: Response): Promise<void> => {
  try {
    const achievements = await db.query('SELECT * FROM achievements ORDER BY points ASC');
    sendSuccess(res, achievements);
  } catch (err) {
    sendError(res, 'Failed to fetch achievements', 500);
  }
});

// GET all badges
router.get('/badges', async (_req, res: Response): Promise<void> => {
  try {
    const badges = await db.query(
      `SELECT b.*, 
              (SELECT COUNT(*) FROM student_badges WHERE badge_id = b.id) as recipients_count
       FROM badges b
       ORDER BY 
         CASE b.tier 
           WHEN 'Platinum' THEN 1 
           WHEN 'Gold' THEN 2 
           WHEN 'Silver' THEN 3 
           WHEN 'Bronze' THEN 4 
           ELSE 5 
         END, b.name ASC`
    );
    sendSuccess(res, badges);
  } catch (err) {
    sendError(res, 'Failed to fetch badges', 500);
  }
});

// GET all milestones
router.get('/milestones', async (_req, res: Response): Promise<void> => {
  try {
    const milestones = await db.query(
      `SELECT m.*, b.name as badge_name, b.icon_name as badge_icon, b.tier as badge_tier, b.color as badge_color
       FROM milestones m
       LEFT JOIN badges b ON m.badge_id = b.id
       ORDER BY m.order_index ASC`
    );
    sendSuccess(res, milestones);
  } catch (err) {
    sendError(res, 'Failed to fetch milestones', 500);
  }
});

// GET current student's badges
router.get('/badges/my', authenticateToken, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      sendError(res, 'Student profile not found', 400);
      return;
    }

    const allBadges = await db.query('SELECT * FROM badges ORDER BY name ASC');
    const earnedBadges = await db.query(
      `SELECT sb.*, b.name, b.slug, b.description, b.icon_name, b.color, b.tier, b.criteria,
              a.title as activity_title,
              u.first_name as awarder_first_name, u.last_name as awarder_last_name
       FROM student_badges sb
       JOIN badges b ON sb.badge_id = b.id
       LEFT JOIN activities a ON sb.activity_id = a.id
       LEFT JOIN users u ON sb.awarded_by = u.id
       WHERE sb.student_id = ?
       ORDER BY sb.earned_at DESC`,
      [studentId]
    );

    const earnedMap = new Map(earnedBadges.map((eb) => [eb.badge_id, eb]));

    const result = allBadges.map((badge) => {
      const earned = earnedMap.get(badge.id);
      return {
        ...badge,
        isUnlocked: !!earned,
        earnedAt: earned ? earned.earned_at : null,
        activityTitle: earned ? earned.activity_title : null,
        awarderName: earned && earned.awarder_first_name ? `${earned.awarder_first_name} ${earned.awarder_last_name}` : 'CNHS System',
        isCelebrated: earned ? Boolean(earned.is_celebrated) : true,
      };
    });

    sendSuccess(res, result);
  } catch (err) {
    sendError(res, 'Failed to fetch student badges', 500);
  }
});

// GET student's milestones progress
router.get('/milestones/my', authenticateToken, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      sendError(res, 'Student profile not found', 400);
      return;
    }

    // Refresh milestones evaluation
    await AchievementService.evaluateStudentMilestones(studentId);

    const milestones = await db.query(
      `SELECT m.*, 
              COALESCE(sm.current_value, 0) as current_value,
              COALESCE(sm.is_completed, 0) as is_completed,
              sm.completed_at,
              b.name as badge_name, b.icon_name as badge_icon, b.tier as badge_tier, b.color as badge_color
       FROM milestones m
       LEFT JOIN student_milestones sm ON sm.milestone_id = m.id AND sm.student_id = ?
       LEFT JOIN badges b ON m.badge_id = b.id
       ORDER BY m.order_index ASC`,
      [studentId]
    );

    sendSuccess(res, milestones);
  } catch (err) {
    sendError(res, 'Failed to fetch student milestones', 500);
  }
});

// GET uncelebrated achievements/badges for instant celebration popups
router.get('/uncelebrated', authenticateToken, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      sendSuccess(res, []);
      return;
    }

    const uncelebratedBadges = await db.query(
      `SELECT sb.id as record_id, 'badge' as award_type, b.name as title, b.description, b.tier, b.color, b.icon_name, sb.earned_at
       FROM student_badges sb
       JOIN badges b ON sb.badge_id = b.id
       WHERE sb.student_id = ? AND sb.is_celebrated = 0
       ORDER BY sb.earned_at DESC`,
      [studentId]
    );

    sendSuccess(res, uncelebratedBadges);
  } catch (err) {
    sendError(res, 'Failed to check celebrations', 500);
  }
});

// POST mark celebration completed
router.post('/celebrate', authenticateToken, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { recordId } = req.body;
    if (!recordId) {
      sendError(res, 'Record ID is required', 400);
      return;
    }

    await db.run('UPDATE student_badges SET is_celebrated = 1 WHERE id = ?', [recordId]);
    await db.run('UPDATE student_achievements SET is_celebrated = 1 WHERE id = ?', [recordId]);

    sendSuccess(res, null, 'Marked as celebrated');
  } catch (err) {
    sendError(res, 'Failed to update celebration state', 500);
  }
});

// POST award badge manually (Teacher / Admin)
const awardBadgeSchema = z.object({
  studentId: z.string(),
  badgeId: z.string(),
  activityId: z.string().optional(),
  notes: z.string().optional(),
});

router.post(
  '/award-badge',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = awardBadgeSchema.parse(req.body);
      const awarded = await AchievementService.awardBadge(
        data.studentId,
        data.badgeId,
        data.activityId || null,
        req.user!.userId
      );

      if (!awarded) {
        sendError(res, 'Student already has this badge, or badge does not exist.', 409);
        return;
      }

      await AuditService.log({
        userId: req.user!.userId,
        action: 'BADGE_AWARDED',
        entityType: 'BADGE',
        entityId: data.badgeId,
        newData: data,
        ipAddress: req.ip,
      });

      sendSuccess(res, null, 'Badge awarded successfully!');
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        sendError(res, err.errors[0].message, 422);
      } else {
        sendError(res, 'Failed to award badge', 500);
      }
    }
  }
);

export default router;
