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

// Student registers for an activity
router.post(
  '/register',
  authenticateToken,
  requireRole(['STUDENT']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        sendError(res, 'Student profile not linked to user account.', 400);
        return;
      }

      const { activityId } = req.body;
      if (!activityId) {
        sendError(res, 'Activity ID is required.', 400);
        return;
      }

      // 1. Fetch activity
      const activity = await db.get(
        `SELECT a.*, u.id as teacher_user_id 
         FROM activities a
         LEFT JOIN teachers t ON a.organizer_id = t.id
         LEFT JOIN users u ON t.user_id = u.id
         WHERE a.id = ?`,
        [activityId]
      );

      if (!activity) {
        sendError(res, 'Activity does not exist.', 404);
        return;
      }

      // 2. Status checks
      if (activity.status === 'Cancelled' || activity.status === 'Completed') {
        sendError(res, `Registration is unavailable because the activity is ${activity.status.toLowerCase()}.`, 400);
        return;
      }

      if (activity.registration_status !== 'Registration Open') {
        sendError(res, 'Registration for this activity is currently closed.', 400);
        return;
      }

      // 3. Deadline check
      if (new Date(activity.registration_deadline) < new Date()) {
        sendError(res, 'The registration deadline for this activity has already passed.', 400);
        return;
      }

      // 4. Duplicate check
      const existing = await db.get(
        'SELECT id, status FROM registrations WHERE activity_id = ? AND student_id = ?',
        [activityId, studentId]
      );

      if (existing) {
        if (existing.status !== 'Cancelled') {
          sendError(res, `You have already registered for this activity (Status: ${existing.status}).`, 409);
          return;
        }
      }

      // 5. Grade level eligibility
      const student = await db.get('SELECT * FROM students WHERE id = ?', [studentId]);
      let eligibleGrades: string[] = [];
      try {
        eligibleGrades = JSON.parse(activity.eligibility_grade_levels || '[]');
      } catch {
        eligibleGrades = [];
      }

      if (eligibleGrades.length > 0 && !eligibleGrades.includes(student.grade_level)) {
        sendError(
          res,
          `This activity is restricted to ${eligibleGrades.join(', ')}. Your grade level is ${student.grade_level}.`,
          403
        );
        return;
      }

      // 6. Capacity check
      const isFull = activity.current_participants >= activity.max_participants;
      const initialStatus = isFull ? 'Waitlisted' : 'Pending';

      const regId = existing ? existing.id : uuidv4();

      if (existing) {
        await db.run(
          `UPDATE registrations 
           SET status = ?, registration_date = CURRENT_TIMESTAMP, review_notes = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [initialStatus, regId]
        );
      } else {
        await db.run(
          `INSERT INTO registrations (id, activity_id, student_id, status)
           VALUES (?, ?, ?, ?)`,
          [regId, activityId, studentId, initialStatus]
        );
      }

      if (!isFull) {
        await db.run(
          `UPDATE activities 
           SET current_participants = current_participants + 1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [activityId]
        );
      }

      // Notify teacher
      if (activity.teacher_user_id) {
        await db.run(
          `INSERT INTO notifications (id, user_id, title, message, type, link)
           VALUES (?, ?, 'New Student Registration', ?, 'registration', '/teacher/registrations')`,
          [
            uuidv4(),
            activity.teacher_user_id,
            `${req.user?.firstName || 'A student'} registered for "${activity.title}".`,
          ]
        );
      }

      await AuditService.log({
        userId: req.user!.userId,
        action: 'ACTIVITY_REGISTERED',
        entityType: 'REGISTRATION',
        entityId: regId,
        newData: { activityId, status: initialStatus },
        ipAddress: req.ip,
      });

      sendSuccess(
        res,
        {
          registrationId: regId,
          status: initialStatus,
          isWaitlisted: isFull,
        },
        isFull
          ? 'Capacity is currently full. You have been placed on the waitlist.'
          : 'Registration submitted successfully! Awaiting adviser review.',
        201
      );
    } catch (err) {
      sendError(res, 'Failed to process registration', 500);
    }
  }
);

// Get student's registrations
router.get(
  '/my',
  authenticateToken,
  requireRole(['STUDENT']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        sendError(res, 'Student profile not found', 400);
        return;
      }

      const registrations = await db.query(
        `SELECT r.*,
                a.title as activity_title, a.slug as activity_slug, a.location, a.date, a.start_time, a.end_time,
                a.banner_image, a.status as activity_status, a.points,
                c.name as category_name, c.color as category_color,
                o.name as organization_name,
                u.first_name as teacher_first_name, u.last_name as teacher_last_name
         FROM registrations r
         JOIN activities a ON r.activity_id = a.id
         LEFT JOIN categories c ON a.category_id = c.id
         LEFT JOIN clubs_organizations o ON a.organization_id = o.id
         LEFT JOIN teachers t ON a.organizer_id = t.id
         LEFT JOIN users u ON t.user_id = u.id
         WHERE r.student_id = ?
         ORDER BY a.date ASC`,
        [studentId]
      );

      sendSuccess(res, registrations);
    } catch (err) {
      sendError(res, 'Failed to fetch registrations', 500);
    }
  }
);

// Get all registrations (Teachers and Admins)
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const activityId = req.query.activityId as string;
      const status = req.query.status as string;

      let query = `
        SELECT r.*,
               a.title as activity_title, a.date as activity_date, a.location as activity_location,
               s.student_id_number, s.grade_level, s.section, s.track_strand, s.attendance_rate,
               u.first_name, u.last_name, u.email, u.avatar_url, u.phone
        FROM registrations r
        JOIN activities a ON r.activity_id = a.id
        JOIN students s ON r.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      // If teacher, only activities they advise unless admin
      if (req.user?.role === 'TEACHER' && req.user.teacherId) {
        query += ` AND (a.organizer_id = ? OR a.organization_id IN (SELECT id FROM clubs_organizations WHERE adviser_id = ?))`;
        params.push(req.user.teacherId, req.user.teacherId);
      }

      if (activityId) {
        query += ` AND r.activity_id = ?`;
        params.push(activityId);
      }

      if (status && status !== 'all') {
        query += ` AND r.status = ?`;
        params.push(status);
      }

      query += ` ORDER BY r.registration_date DESC`;

      const list = await db.query(query, params);
      sendSuccess(res, list);
    } catch (err) {
      sendError(res, 'Failed to fetch registrations list', 500);
    }
  }
);

// Review registration (Approve / Reject / Waitlist)
const reviewSchema = z.object({
  status: z.enum(['Approved', 'Rejected', 'Waitlisted', 'Cancelled', 'Completed']),
  reviewNotes: z.string().optional(),
});

router.put(
  '/:id/status',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, reviewNotes } = reviewSchema.parse(req.body);

      const registration = await db.get(
        `SELECT r.*, a.title as activity_title, s.user_id as student_user_id
         FROM registrations r
         JOIN activities a ON r.activity_id = a.id
         JOIN students s ON r.student_id = s.id
         WHERE r.id = ?`,
        [id]
      );

      if (!registration) {
        sendError(res, 'Registration record not found', 404);
        return;
      }

      await db.run(
        `UPDATE registrations 
         SET status = ?, review_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, reviewNotes || null, req.user!.userId, id]
      );

      // Send database notification to student
      const notifMessage = status === 'Approved'
        ? `Your registration for "${registration.activity_title}" has been approved!`
        : `Your registration for "${registration.activity_title}" status is now: ${status}.`;

      await db.run(
        `INSERT INTO notifications (id, user_id, title, message, type, link)
         VALUES (?, ?, ?, ?, 'registration', '/student/my-activities')`,
        [
          uuidv4(),
          registration.student_user_id,
          status === 'Approved' ? 'Registration Approved! 🌟' : `Registration ${status}`,
          notifMessage,
        ]
      );

      // If approved, trigger milestone evaluations
      if (status === 'Approved') {
        await AchievementService.evaluateStudentMilestones(registration.student_id);
      }

      await AuditService.log({
        userId: req.user!.userId,
        action: `REGISTRATION_${status.toUpperCase()}`,
        entityType: 'REGISTRATION',
        entityId: id,
        oldData: { status: registration.status },
        newData: { status, reviewNotes },
        ipAddress: req.ip,
      });

      sendSuccess(res, { id, status }, `Registration updated to ${status}`);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        sendError(res, err.errors[0].message, 422);
      } else {
        sendError(res, 'Failed to update registration status', 500);
      }
    }
  }
);

// Cancel registration (Student or Admin)
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const reg = await db.get('SELECT * FROM registrations WHERE id = ?', [id]);

      if (!reg) {
        sendError(res, 'Registration not found', 404);
        return;
      }

      // Check authorization
      if (req.user?.role === 'STUDENT' && req.user.studentId !== reg.student_id) {
        sendError(res, 'You are not authorized to cancel this registration', 403);
        return;
      }

      await db.run("UPDATE registrations SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);

      // Decrement participant count
      await db.run('UPDATE activities SET current_participants = MAX(0, current_participants - 1) WHERE id = ?', [
        reg.activity_id,
      ]);

      await AuditService.log({
        userId: req.user!.userId,
        action: 'REGISTRATION_CANCELLED',
        entityType: 'REGISTRATION',
        entityId: id,
        ipAddress: req.ip,
      });

      sendSuccess(res, null, 'Registration cancelled successfully');
    } catch (err) {
      sendError(res, 'Failed to cancel registration', 500);
    }
  }
);

export default router;
