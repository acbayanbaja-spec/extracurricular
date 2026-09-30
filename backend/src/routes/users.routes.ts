import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { sendError, sendSuccess } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { hashPassword } from '../utils/password';
import { AuditService } from '../services/audit.service';

const router = Router();

// GET all users (Admin only)
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMINISTRATOR']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const search = (req.query.search as string || '').trim().toLowerCase();
      const role = req.query.role as string;
      const status = req.query.status as string;

      let query = `
        SELECT u.id, u.email, u.role, u.status, u.first_name, u.last_name, u.avatar_url, u.phone, u.created_at,
               s.id as student_id, s.student_id_number, s.grade_level, s.section, s.track_strand, s.attendance_rate, s.total_points,
               t.id as teacher_id, t.employee_id, t.department as teacher_department, t.title as teacher_title
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN teachers t ON u.id = t.user_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (search) {
        query += ` AND (LOWER(u.first_name) LIKE ? OR LOWER(u.last_name) LIKE ? OR LOWER(u.email) LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (role && role !== 'all') {
        query += ` AND u.role = ?`;
        params.push(role);
      }

      if (status && status !== 'all') {
        query += ` AND u.status = ?`;
        params.push(status);
      }

      query += ` ORDER BY u.created_at DESC`;

      const users = await db.query(query, params);
      sendSuccess(res, users);
    } catch (err) {
      sendError(res, 'Failed to fetch users', 500);
    }
  }
);

// GET students list (Admin & Teacher)
router.get(
  '/students',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const search = (req.query.search as string || '').trim().toLowerCase();
      const grade = req.query.grade as string;

      let query = `
        SELECT s.*, 
               u.email, u.first_name, u.last_name, u.avatar_url, u.phone, u.status as user_status,
               (SELECT COUNT(*) FROM registrations WHERE student_id = s.id AND status IN ('Approved', 'Completed')) as activities_joined_count
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (search) {
        query += ` AND (LOWER(u.first_name) LIKE ? OR LOWER(u.last_name) LIKE ? OR LOWER(s.student_id_number) LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (grade && grade !== 'all') {
        query += ` AND s.grade_level = ?`;
        params.push(grade);
      }

      query += ` ORDER BY u.last_name ASC`;

      const students = await db.query(query, params);
      sendSuccess(res, students);
    } catch (err) {
      sendError(res, 'Failed to fetch students', 500);
    }
  }
);

// GET teachers list (Admin & Teacher)
router.get(
  '/teachers',
  authenticateToken,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const teachers = await db.query(
        `SELECT t.*, u.first_name, u.last_name, u.email, u.avatar_url, u.phone, u.status as user_status
         FROM teachers t
         JOIN users u ON t.user_id = u.id
         WHERE u.status = 'ACTIVE'
         ORDER BY u.last_name ASC`
      );
      sendSuccess(res, teachers);
    } catch (err) {
      sendError(res, 'Failed to fetch teachers', 500);
    }
  }
);

// Toggle user status (ACTIVE / INACTIVE / SUSPENDED)
router.put(
  '/:id/status',
  authenticateToken,
  requireRole(['ADMINISTRATOR']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        sendError(res, 'Invalid status', 400);
        return;
      }

      await db.run('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

      await AuditService.log({
        userId: req.user!.userId,
        action: `USER_STATUS_${status}`,
        entityType: 'USER',
        entityId: id,
        newData: { status },
        ipAddress: req.ip,
      });

      sendSuccess(res, null, `User status updated to ${status}`);
    } catch (err) {
      sendError(res, 'Failed to update user status', 500);
    }
  }
);

export default router;
