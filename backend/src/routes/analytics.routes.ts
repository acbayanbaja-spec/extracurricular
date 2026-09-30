import { Router, Response } from 'express';
import { db } from '../database/db';
import { sendError, sendSuccess } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';

const router = Router();

// GET Admin Dashboard Analytics
router.get(
  '/admin',
  authenticateToken,
  requireRole(['ADMINISTRATOR']),
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // 1. KPI Counts
      const totalStudentsRes = await db.get('SELECT COUNT(*) as count FROM students');
      const totalTeachersRes = await db.get('SELECT COUNT(*) as count FROM teachers');
      const totalActivitiesRes = await db.get('SELECT COUNT(*) as count FROM activities');
      const activeActivitiesRes = await db.get("SELECT COUNT(*) as count FROM activities WHERE status IN ('Published', 'Ongoing')");
      const completedActivitiesRes = await db.get("SELECT COUNT(*) as count FROM activities WHERE status = 'Completed'");
      const totalRegistrationsRes = await db.get('SELECT COUNT(*) as count FROM registrations');
      const achievementsAwardedRes = await db.get('SELECT COUNT(*) as count FROM student_achievements');
      const certificatesIssuedRes = await db.get('SELECT COUNT(*) as count FROM certificates');

      // Overall average attendance rate across students
      const avgAttendanceRes = await db.get('SELECT AVG(attendance_rate) as avg_rate FROM students');

      // 2. Activities by Category
      const activitiesByCategory = await db.query(
        `SELECT c.name, c.color, COUNT(a.id) as value
         FROM categories c
         LEFT JOIN activities a ON c.id = a.category_id
         GROUP BY c.id
         ORDER BY value DESC`
      );

      // 3. Participation by Grade Level
      const participationByGrade = await db.query(
        `SELECT s.grade_level as name, COUNT(r.id) as count
         FROM students s
         LEFT JOIN registrations r ON s.id = r.student_id AND r.status IN ('Approved', 'Completed')
         GROUP BY s.grade_level
         ORDER BY s.grade_level ASC`
      );

      // 4. Popular Activities (Top 5)
      const popularActivities = await db.query(
        `SELECT a.id, a.title, a.max_participants, a.current_participants,
                c.name as category_name, c.color as category_color
         FROM activities a
         LEFT JOIN categories c ON a.category_id = c.id
         ORDER BY a.current_participants DESC
         LIMIT 5`
      );

      // 5. Attendance Status Distribution
      const attendanceDistribution = await db.query(
        `SELECT status as name, COUNT(*) as value
         FROM attendance_records
         GROUP BY status`
      );

      // 6. Monthly Registration Trends (Simulated or Real timestamp aggregation)
      const participationOverTime = [
        { month: 'Jun', registrations: 18, attendance: 92 },
        { month: 'Jul', registrations: 45, attendance: 88 },
        { month: 'Aug', registrations: 72, attendance: 94 },
        { month: 'Sep', registrations: 120, attendance: 95 },
        { month: 'Oct', registrations: 154, attendance: 93 },
      ];

      sendSuccess(res, {
        kpis: {
          totalStudents: parseInt(totalStudentsRes?.count || '0', 10),
          totalTeachers: parseInt(totalTeachersRes?.count || '0', 10),
          totalActivities: parseInt(totalActivitiesRes?.count || '0', 10),
          activeActivities: parseInt(activeActivitiesRes?.count || '0', 10),
          completedActivities: parseInt(completedActivitiesRes?.count || '0', 10),
          totalRegistrations: parseInt(totalRegistrationsRes?.count || '0', 10),
          achievementsAwarded: parseInt(achievementsAwardedRes?.count || '0', 10),
          certificatesIssued: parseInt(certificatesIssuedRes?.count || '0', 10),
          averageAttendanceRate: Math.round(Number(avgAttendanceRes?.avg_rate || 90) * 10) / 10,
        },
        activitiesByCategory,
        participationByGrade,
        popularActivities,
        attendanceDistribution,
        participationOverTime,
      });
    } catch (err) {
      console.error('[Admin Analytics Error]', err);
      sendError(res, 'Failed to generate admin analytics', 500);
    }
  }
);

// GET Teacher Dashboard Stats
router.get(
  '/teacher',
  authenticateToken,
  requireRole(['TEACHER', 'ADMINISTRATOR']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const teacherId = req.user?.teacherId;
      const teacherFilter = teacherId ? 'WHERE organizer_id = ?' : '';
      const params = teacherId ? [teacherId] : [];

      const myActivitiesRes = await db.query(
        `SELECT * FROM activities ${teacherFilter} ORDER BY date ASC`,
        params
      );

      let pendingRegsCount = 0;
      if (myActivitiesRes.length > 0) {
        const actIds = myActivitiesRes.map((a) => `'${a.id}'`).join(',');
        const regCountRes = await db.get(
          `SELECT COUNT(*) as count FROM registrations WHERE activity_id IN (${actIds}) AND status = 'Pending'`
        );
        pendingRegsCount = parseInt(regCountRes?.count || '0', 10);
      }

      sendSuccess(res, {
        totalAssignedActivities: myActivitiesRes.length,
        pendingRegistrations: pendingRegsCount,
        activities: myActivitiesRes,
      });
    } catch (err) {
      sendError(res, 'Failed to fetch teacher analytics', 500);
    }
  }
);

// Export CSV Reports
router.get(
  '/export/:type',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { type } = req.params;

      if (type === 'attendance') {
        const records = await db.query(
          `SELECT ar.id, a.title as activity_title, s.session_title, s.session_date,
                  u.first_name || ' ' || u.last_name as student_name, std.student_id_number,
                  std.grade_level, std.section, ar.status, ar.check_in_time, ar.check_in_method, ar.notes
           FROM attendance_records ar
           JOIN attendance_sessions s ON ar.session_id = s.id
           JOIN activities a ON ar.activity_id = a.id
           JOIN students std ON ar.student_id = std.id
           JOIN users u ON std.user_id = u.id
           ORDER BY s.session_date DESC`
        );

        let csv = 'Record ID,Activity,Session Title,Session Date,Student Name,LRN,Grade,Section,Status,Check In Time,Method,Notes\n';
        records.forEach((r) => {
          csv += `"${r.id}","${r.activity_title}","${r.session_title}","${r.session_date}","${r.student_name}","${r.student_id_number}","${r.grade_level}","${r.section}","${r.status}","${r.check_in_time || ''}","${r.check_in_method || ''}","${r.notes || ''}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="cnhs_attendance_report.csv"');
        res.status(200).send(csv);
        return;
      }

      if (type === 'registrations') {
        const records = await db.query(
          `SELECT r.id, a.title as activity_title, a.date as activity_date,
                  u.first_name || ' ' || u.last_name as student_name, std.student_id_number,
                  std.grade_level, std.section, r.status, r.registration_date, r.review_notes
           FROM registrations r
           JOIN activities a ON r.activity_id = a.id
           JOIN students std ON r.student_id = std.id
           JOIN users u ON std.user_id = u.id
           ORDER BY r.registration_date DESC`
        );

        let csv = 'Registration ID,Activity,Activity Date,Student Name,LRN,Grade,Section,Status,Registered At,Notes\n';
        records.forEach((r) => {
          csv += `"${r.id}","${r.activity_title}","${r.activity_date}","${r.student_name}","${r.student_id_number}","${r.grade_level}","${r.section}","${r.status}","${r.registration_date}","${r.review_notes || ''}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="cnhs_registrations_report.csv"');
        res.status(200).send(csv);
        return;
      }

      sendError(res, 'Invalid export type requested', 400);
    } catch (err) {
      sendError(res, 'Failed to generate report export', 500);
    }
  }
);

export default router;
