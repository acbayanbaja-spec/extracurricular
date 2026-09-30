import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { sendError, sendSuccess } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { AuditService } from '../services/audit.service';

const router = Router();

// GET all categories
router.get('/categories', async (_req, res: Response): Promise<void> => {
  try {
    const categories = await db.query(
      `SELECT c.*, COUNT(a.id) as activity_count 
       FROM categories c
       LEFT JOIN activities a ON c.id = a.category_id AND a.status != 'Cancelled'
       GROUP BY c.id
       ORDER BY c.display_order ASC`
    );
    sendSuccess(res, categories);
  } catch (error) {
    sendError(res, 'Failed to fetch categories', 500);
  }
});

// GET all clubs/organizations
router.get('/organizations', async (_req, res: Response): Promise<void> => {
  try {
    const clubs = await db.query(
      `SELECT o.*, c.name as category_name, c.color as category_color,
              u.first_name as adviser_first_name, u.last_name as adviser_last_name
       FROM clubs_organizations o
       LEFT JOIN categories c ON o.category_id = c.id
       LEFT JOIN teachers t ON o.adviser_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY o.name ASC`
    );
    sendSuccess(res, clubs);
  } catch (error) {
    sendError(res, 'Failed to fetch clubs & organizations', 500);
  }
});

// GET activities list with search, filter, sort
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const search = (req.query.search as string || '').trim().toLowerCase();
    const categoryId = req.query.categoryId as string;
    const gradeLevel = req.query.gradeLevel as string;
    const status = req.query.status as string;
    const sortBy = (req.query.sortBy as string) || 'date'; // date, title, popularity, points
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let query = `
      SELECT a.*,
             c.name as category_name, c.color as category_color, c.icon as category_icon,
             o.name as organization_name, o.code as organization_code,
             u.first_name as teacher_first_name, u.last_name as teacher_last_name
      FROM activities a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN clubs_organizations o ON a.organization_id = o.id
      LEFT JOIN teachers t ON a.organizer_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (LOWER(a.title) LIKE ? OR LOWER(a.description) LIKE ? OR LOWER(a.location) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (categoryId && categoryId !== 'all') {
      query += ` AND a.category_id = ?`;
      params.push(categoryId);
    }

    if (status && status !== 'all') {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (gradeLevel && gradeLevel !== 'all') {
      query += ` AND a.eligibility_grade_levels LIKE ?`;
      params.push(`%${gradeLevel}%`);
    }

    if (sortBy === 'title') {
      query += ` ORDER BY a.title ${sortOrder}`;
    } else if (sortBy === 'popularity') {
      query += ` ORDER BY a.current_participants ${sortOrder}`;
    } else if (sortBy === 'points') {
      query += ` ORDER BY a.points ${sortOrder}`;
    } else {
      query += ` ORDER BY a.date ${sortOrder}`;
    }

    const activities = await db.query(query, params);

    // If user is a student, attach their personal registration status
    let userRegistrations: Record<string, any> = {};
    if (req.user && req.user.studentId) {
      const myRegs = await db.query(
        'SELECT activity_id, status, registration_date FROM registrations WHERE student_id = ?',
        [req.user.studentId]
      );
      for (const reg of myRegs) {
        userRegistrations[reg.activity_id] = reg;
      }
    }

    const mapped = activities.map((act) => ({
      ...act,
      myRegistration: userRegistrations[act.id] || null,
      availableSlots: Math.max(0, act.max_participants - act.current_participants),
      isFull: act.current_participants >= act.max_participants,
    }));

    sendSuccess(res, mapped);
  } catch (error) {
    sendError(res, 'Failed to fetch activities', 500);
  }
});

// GET single activity details
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const activity = await db.get(
      `SELECT a.*,
              c.name as category_name, c.color as category_color, c.icon as category_icon,
              o.name as organization_name, o.code as organization_code, o.description as organization_desc,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name, u.email as teacher_email,
              t.department as teacher_department
       FROM activities a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN clubs_organizations o ON a.organization_id = o.id
       LEFT JOIN teachers t ON a.organizer_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE a.id = ? OR a.slug = ?`,
      [id, id]
    );

    if (!activity) {
      sendError(res, 'Activity not found', 404);
      return;
    }

    // Fetch attendance sessions for this activity
    const sessions = await db.query(
      `SELECT * FROM attendance_sessions WHERE activity_id = ? ORDER BY session_date ASC`,
      [activity.id]
    );

    // Fetch announcements linked to this activity
    const announcements = await db.query(
      `SELECT a.*, u.first_name, u.last_name 
       FROM announcements a
       JOIN users u ON a.author_id = u.id
       WHERE a.activity_id = ?
       ORDER BY a.publish_date DESC`,
      [activity.id]
    );

    // If teacher/admin, fetch registrations list
    let registrations: any[] = [];
    const canViewRegistrations = req.user && (req.user.role === 'ADMINISTRATOR' || req.user.role === 'TEACHER');
    if (canViewRegistrations) {
      registrations = await db.query(
        `SELECT r.*, 
                s.student_id_number, s.grade_level, s.section, s.track_strand, s.attendance_rate,
                u.first_name, u.last_name, u.email, u.avatar_url
         FROM registrations r
         JOIN students s ON r.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE r.activity_id = ?
         ORDER BY r.registration_date DESC`,
        [activity.id]
      );
    }

    // Check student's individual registration status
    let myRegistration = null;
    if (req.user && req.user.studentId) {
      myRegistration = await db.get(
        'SELECT * FROM registrations WHERE activity_id = ? AND student_id = ?',
        [activity.id, req.user.studentId]
      );
    }

    sendSuccess(res, {
      ...activity,
      sessions,
      announcements,
      registrations,
      myRegistration,
      availableSlots: Math.max(0, activity.max_participants - activity.current_participants),
      isFull: activity.current_participants >= activity.max_participants,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch activity details', 500);
  }
});

// CREATE activity
const activitySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  categoryId: z.string(),
  organizationId: z.string().optional(),
  organizerId: z.string().optional(),
  location: z.string().min(2),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  registrationDeadline: z.string(),
  maxParticipants: z.number().int().min(1).default(30),
  eligibilityGradeLevels: z.array(z.string()).default(['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
  requiredSkills: z.array(z.string()).default([]),
  bannerImage: z.string().optional(),
  points: z.number().int().default(20),
  status: z.enum(['Draft', 'Pending', 'Published', 'Ongoing', 'Completed', 'Cancelled']).default('Published'),
  registrationStatus: z.enum(['Registration Open', 'Registration Closed']).default('Registration Open'),
});

router.post(
  '/',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = activitySchema.parse(req.body);
      const id = uuidv4();
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;

      let organizerId = data.organizerId;
      if (!organizerId && req.user?.teacherId) {
        organizerId = req.user.teacherId;
      }

      await db.run(
        `INSERT INTO activities (
           id, title, slug, description, category_id, organization_id, organizer_id,
           location, date, start_time, end_time, registration_deadline,
           max_participants, current_participants, eligibility_grade_levels,
           required_skills, banner_image, status, registration_status, points
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.title,
          slug,
          data.description,
          data.categoryId,
          data.organizationId || null,
          organizerId || null,
          data.location,
          data.date,
          data.startTime,
          data.endTime,
          data.registrationDeadline,
          data.maxParticipants,
          JSON.stringify(data.eligibilityGradeLevels),
          JSON.stringify(data.requiredSkills),
          data.bannerImage || null,
          data.status,
          data.registrationStatus,
          data.points,
        ]
      );

      await AuditService.log({
        userId: req.user!.userId,
        action: 'ACTIVITY_CREATED',
        entityType: 'ACTIVITY',
        entityId: id,
        newData: { title: data.title, category: data.categoryId },
        ipAddress: req.ip,
      });

      sendSuccess(res, { id, slug }, 'Activity created successfully', 201);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        sendError(res, err.errors[0].message, 422);
      } else {
        sendError(res, 'Failed to create activity', 500);
      }
    }
  }
);

// UPDATE activity
router.put(
  '/:id',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await db.get('SELECT * FROM activities WHERE id = ?', [id]);
      if (!existing) {
        sendError(res, 'Activity not found', 404);
        return;
      }

      const body = req.body;
      await db.run(
        `UPDATE activities 
         SET title = COALESCE(?, title),
             description = COALESCE(?, description),
             location = COALESCE(?, location),
             date = COALESCE(?, date),
             start_time = COALESCE(?, start_time),
             end_time = COALESCE(?, end_time),
             registration_deadline = COALESCE(?, registration_deadline),
             max_participants = COALESCE(?, max_participants),
             banner_image = COALESCE(?, banner_image),
             status = COALESCE(?, status),
             registration_status = COALESCE(?, registration_status),
             points = COALESCE(?, points),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          body.title,
          body.description,
          body.location,
          body.date,
          body.startTime,
          body.endTime,
          body.registrationDeadline,
          body.maxParticipants,
          body.bannerImage,
          body.status,
          body.registrationStatus,
          body.points,
          id,
        ]
      );

      await AuditService.log({
        userId: req.user!.userId,
        action: 'ACTIVITY_UPDATED',
        entityType: 'ACTIVITY',
        entityId: id,
        oldData: existing,
        newData: body,
        ipAddress: req.ip,
      });

      sendSuccess(res, null, 'Activity updated successfully');
    } catch (err) {
      sendError(res, 'Failed to update activity', 500);
    }
  }
);

// DELETE activity (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['ADMINISTRATOR']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await db.get('SELECT * FROM activities WHERE id = ?', [id]);
      if (!existing) {
        sendError(res, 'Activity not found', 404);
        return;
      }

      await db.run('DELETE FROM activities WHERE id = ?', [id]);

      await AuditService.log({
        userId: req.user!.userId,
        action: 'ACTIVITY_DELETED',
        entityType: 'ACTIVITY',
        entityId: id,
        oldData: existing,
        ipAddress: req.ip,
      });

      sendSuccess(res, null, 'Activity deleted successfully');
    } catch (err) {
      sendError(res, 'Failed to delete activity', 500);
    }
  }
);

export default router;
