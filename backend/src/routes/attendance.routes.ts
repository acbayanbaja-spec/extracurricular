import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { sendError, sendSuccess } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { AttendanceService } from '../services/attendance.service';
import { AuditService } from '../services/audit.service';
import { AchievementService } from '../services/achievement.service';

const router = Router();

// Create session
const sessionSchema = z.object({
  activityId: z.string(),
  sessionTitle: z.string().min(2),
  sessionDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

router.post(
  '/sessions',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = sessionSchema.parse(req.body);
      const sessionId = uuidv4();

      await db.run(
        `INSERT INTO attendance_sessions (id, activity_id, session_title, session_date, start_time, end_time, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sessionId, data.activityId, data.sessionTitle, data.sessionDate, data.startTime, data.endTime, req.user!.userId]
      );

      // Pre-populate attendance records as 'Absent' for all approved students so teachers can easily flip them to Present/Late
      const approvedStudents = await db.query(
        `SELECT student_id FROM registrations WHERE activity_id = ? AND status IN ('Approved', 'Completed')`,
        [data.activityId]
      );

      for (const std of approvedStudents) {
        await db.run(
          `INSERT INTO attendance_records (id, session_id, activity_id, student_id, status)
           VALUES (?, ?, ?, ?, 'Absent')`,
          [uuidv4(), sessionId, data.activityId, std.student_id]
        );
      }

      await AuditService.log({
        userId: req.user!.userId,
        action: 'ATTENDANCE_SESSION_CREATED',
        entityType: 'ATTENDANCE_SESSION',
        entityId: sessionId,
        newData: data,
        ipAddress: req.ip,
      });

      sendSuccess(res, { id: sessionId }, 'Attendance session created successfully', 201);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        sendError(res, err.errors[0].message, 422);
      } else {
        sendError(res, 'Failed to create attendance session', 500);
      }
    }
  }
);

// Get sessions for an activity
router.get('/sessions/:activityId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { activityId } = req.params;
    const sessions = await db.query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'Present') as present_count,
              (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'Late') as late_count,
              (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'Absent') as absent_count,
              (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id) as total_enrolled
       FROM attendance_sessions s
       WHERE s.activity_id = ?
       ORDER BY s.session_date DESC, s.start_time ASC`,
      [activityId]
    );

    sendSuccess(res, sessions);
  } catch (err) {
    sendError(res, 'Failed to fetch sessions', 500);
  }
});

// Get session details + student attendance sheet
router.get(
  '/session/:sessionId',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const session = await db.get(
        `SELECT s.*, a.title as activity_title, a.location, a.date as activity_date
         FROM attendance_sessions s
         JOIN activities a ON s.activity_id = a.id
         WHERE s.id = ?`,
        [sessionId]
      );

      if (!session) {
        sendError(res, 'Session not found', 404);
        return;
      }

      // Query registered students and their attendance status for this session
      const records = await db.query(
        `SELECT s.id as student_id, s.student_id_number, s.grade_level, s.section, s.track_strand,
                u.first_name, u.last_name, u.email, u.avatar_url,
                ar.id as record_id, COALESCE(ar.status, 'Absent') as status, ar.check_in_time, ar.check_in_method, ar.notes
         FROM registrations r
         JOIN students s ON r.student_id = s.id
         JOIN users u ON s.user_id = u.id
         LEFT JOIN attendance_records ar ON ar.session_id = ? AND ar.student_id = s.id
         WHERE r.activity_id = ? AND r.status IN ('Approved', 'Completed')
         ORDER BY u.last_name ASC`,
        [sessionId, session.activity_id]
      );

      sendSuccess(res, {
        session,
        records,
      });
    } catch (err) {
      sendError(res, 'Failed to fetch session details', 500);
    }
  }
);

// Generate QR code for session
router.post(
  '/session/:sessionId/qr',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const minutes = req.body.minutes ? parseInt(req.body.minutes, 10) : 45;

      const qrResult = await AttendanceService.generateSessionQR(sessionId, minutes);
      sendSuccess(res, qrResult, 'QR Code generated successfully');
    } catch (err: any) {
      sendError(res, err.message || 'Failed to generate QR code', 500);
    }
  }
);

// Student QR Scan check-in
const qrScanSchema = z.object({
  sessionId: z.string(),
  token: z.string(),
});

router.post(
  '/qr/scan',
  authenticateToken,
  requireRole(['STUDENT']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        sendError(res, 'Student profile required', 400);
        return;
      }

      const { sessionId, token } = qrScanSchema.parse(req.body);
      const result = await AttendanceService.recordQrCheckIn(studentId, { sessionId, token });

      // Evaluate achievements
      await AchievementService.evaluateStudentMilestones(studentId);

      await AuditService.log({
        userId: req.user!.userId,
        action: 'ATTENDANCE_QR_CHECKIN',
        entityType: 'ATTENDANCE_RECORD',
        entityId: result.recordId,
        newData: { sessionId, checkInMethod: 'qr_scan' },
        ipAddress: req.ip,
      });

      sendSuccess(res, result, result.message);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        sendError(res, err.errors[0].message, 422);
      } else {
        sendError(res, err.message || 'QR Check-in verification failed', 400);
      }
    }
  }
);

// Teacher manually marks or updates attendance
const markAttendanceSchema = z.object({
  sessionId: z.string(),
  activityId: z.string(),
  studentId: z.string(),
  status: z.enum(['Present', 'Absent', 'Late', 'Excused']),
  notes: z.string().optional(),
});

router.post(
  '/mark',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = markAttendanceSchema.parse(req.body);

      const existing = await db.get(
        'SELECT id FROM attendance_records WHERE session_id = ? AND student_id = ?',
        [data.sessionId, data.studentId]
      );

      const nowIso = new Date().toISOString();
      const checkInTime = data.status === 'Present' || data.status === 'Late' ? nowIso : null;

      let recordId = existing ? existing.id : uuidv4();

      if (existing) {
        await db.run(
          `UPDATE attendance_records 
           SET status = ?, check_in_time = COALESCE(?, check_in_time), notes = ?, recorded_by = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [data.status, checkInTime, data.notes || null, req.user!.userId, recordId]
        );
      } else {
        await db.run(
          `INSERT INTO attendance_records (id, session_id, activity_id, student_id, status, check_in_time, check_in_method, notes, recorded_by)
           VALUES (?, ?, ?, ?, ?, ?, 'manual', ?, ?)`,
          [recordId, data.sessionId, data.activityId, data.studentId, data.status, checkInTime, data.notes || null, req.user!.userId]
        );
      }

      // Update student metrics
      await AttendanceService.updateStudentAttendanceMetrics(data.studentId);
      await AchievementService.evaluateStudentMilestones(data.studentId);

      await AuditService.log({
        userId: req.user!.userId,
        action: 'ATTENDANCE_RECORD_UPDATED',
        entityType: 'ATTENDANCE_RECORD',
        entityId: recordId,
        newData: data,
        ipAddress: req.ip,
      });

      sendSuccess(res, { id: recordId, status: data.status }, `Attendance recorded as ${data.status}`);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        sendError(res, err.errors[0].message, 422);
      } else {
        sendError(res, 'Failed to record attendance', 500);
      }
    }
  }
);

// Get student attendance stats and history
router.get('/student/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const stats = await AttendanceService.getStudentAttendanceStats(studentId);

    const history = await db.query(
      `SELECT ar.*, 
              s.session_title, s.session_date, s.start_time, s.end_time,
              a.title as activity_title, a.id as activity_id,
              c.name as category_name, c.color as category_color
       FROM attendance_records ar
       JOIN attendance_sessions s ON ar.session_id = s.id
       JOIN activities a ON ar.activity_id = a.id
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE ar.student_id = ?
       ORDER BY s.session_date DESC, ar.created_at DESC`,
      [studentId]
    );

    sendSuccess(res, { stats, history });
  } catch (err) {
    sendError(res, 'Failed to fetch attendance records', 500);
  }
});

// Current student's own attendance records
router.get('/my', authenticateToken, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      sendError(res, 'Student profile not found', 400);
      return;
    }

    const stats = await AttendanceService.getStudentAttendanceStats(studentId);
    const history = await db.query(
      `SELECT ar.*, 
              s.session_title, s.session_date, s.start_time, s.end_time,
              a.title as activity_title, a.id as activity_id,
              c.name as category_name, c.color as category_color
       FROM attendance_records ar
       JOIN attendance_sessions s ON ar.session_id = s.id
       JOIN activities a ON ar.activity_id = a.id
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE ar.student_id = ?
       ORDER BY s.session_date DESC, ar.created_at DESC`,
      [studentId]
    );

    sendSuccess(res, { stats, history });
  } catch (err) {
    sendError(res, 'Failed to fetch attendance history', 500);
  }
});

export default router;
