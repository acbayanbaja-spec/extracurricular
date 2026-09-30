import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { sendError, sendSuccess } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { AttendanceService } from '../services/attendance.service';

const router = Router();

// GET full portfolio by studentId (or current logged in student)
router.get('/:studentId', async (req, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    // 1. Fetch student + user
    const student = await db.get(
      `SELECT s.*, 
              u.first_name, u.last_name, u.email, u.avatar_url, u.phone, u.created_at as member_since
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? OR s.student_id_number = ?`,
      [studentId, studentId]
    );

    if (!student) {
      sendError(res, 'Student profile not found', 404);
      return;
    }

    // 2. Interests & Skills
    const interests = (
      await db.query('SELECT interest_name FROM student_interests WHERE student_id = ?', [student.id])
    ).map((i) => i.interest_name);

    const skills = await db.query(
      'SELECT skill_name, proficiency_level FROM student_skills WHERE student_id = ?',
      [student.id]
    );

    // 3. Attendance metrics
    const attendanceStats = await AttendanceService.getStudentAttendanceStats(student.id);

    // 4. Badges
    const badges = await db.query(
      `SELECT sb.*, b.name, b.slug, b.description, b.icon_name, b.color, b.tier, b.criteria,
              a.title as activity_title
       FROM student_badges sb
       JOIN badges b ON sb.badge_id = b.id
       LEFT JOIN activities a ON sb.activity_id = a.id
       WHERE sb.student_id = ?
       ORDER BY sb.earned_at DESC`,
      [student.id]
    );

    // 5. Achievements
    const achievements = await db.query(
      `SELECT sa.*, a.title, a.description, a.category, a.icon, a.points,
              act.title as activity_title
       FROM student_achievements sa
       JOIN achievements a ON sa.achievement_id = a.id
       LEFT JOIN activities act ON sa.activity_id = act.id
       WHERE sa.student_id = ?
       ORDER BY sa.awarded_at DESC`,
      [student.id]
    );

    // 6. Certificates
    const certificates = await db.query(
      `SELECT c.*, act.title as activity_title, act.date as activity_date,
              cat.name as category_name, cat.color as category_color
       FROM certificates c
       JOIN activities a ON c.activity_id = a.id
       JOIN activities act ON c.activity_id = act.id
       LEFT JOIN categories cat ON act.category_id = cat.id
       WHERE c.student_id = ?
       ORDER BY c.issue_date DESC`,
      [student.id]
    );

    // 7. Registered & Completed Activities
    const activities = await db.query(
      `SELECT r.id as registration_id, r.status as registration_status, r.registration_date,
              a.id as activity_id, a.title, a.slug, a.location, a.date, a.start_time, a.end_time,
              a.banner_image, a.points,
              c.name as category_name, c.color as category_color,
              o.name as organization_name
       FROM registrations r
       JOIN activities a ON r.activity_id = a.id
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN clubs_organizations o ON a.organization_id = o.id
       WHERE r.student_id = ?
       ORDER BY a.date DESC`,
      [student.id]
    );

    // 8. Milestones
    const milestones = await db.query(
      `SELECT m.*, 
              COALESCE(sm.current_value, 0) as current_value,
              COALESCE(sm.is_completed, 0) as is_completed,
              sm.completed_at,
              b.name as badge_name, b.icon_name as badge_icon, b.tier as badge_tier
       FROM milestones m
       LEFT JOIN student_milestones sm ON sm.milestone_id = m.id AND sm.student_id = ?
       LEFT JOIN badges b ON m.badge_id = b.id
       ORDER BY m.order_index ASC`,
      [student.id]
    );

    // 9. Chronological Development Timeline
    const timeline: any[] = [];

    // Add activity registrations
    activities.forEach((act) => {
      timeline.push({
        type: 'activity',
        title: `Registered for "${act.title}"`,
        subtitle: `${act.category_name} • ${act.registration_status}`,
        date: act.registration_date || act.date,
        icon: 'Calendar',
        color: act.category_color || '#4F46E5',
      });
    });

    // Add badges
    badges.forEach((b) => {
      timeline.push({
        type: 'badge',
        title: `Earned "${b.name}" Badge`,
        subtitle: `${b.tier} Tier • ${b.description}`,
        date: b.earned_at,
        icon: 'Award',
        color: b.color || '#F59E0B',
      });
    });

    // Add certificates
    certificates.forEach((c) => {
      timeline.push({
        type: 'certificate',
        title: `Issued Official Certificate`,
        subtitle: `${c.title} • No. ${c.certificate_number}`,
        date: c.issue_date,
        icon: 'FileCheck',
        color: '#10B981',
      });
    });

    // Sort timeline newest first
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sendSuccess(res, {
      student,
      interests,
      skills,
      attendanceStats,
      badges,
      achievements,
      certificates,
      activities,
      milestones,
      timeline,
    });
  } catch (err) {
    sendError(res, 'Failed to fetch student portfolio', 500);
  }
});

// Update student profile (bio, interests, skills)
const updateProfileSchema = z.object({
  bio: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.object({ skill: z.string(), level: z.string() })).optional(),
});

router.put('/profile/update', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      sendError(res, 'Only students can update their portfolio preferences', 403);
      return;
    }

    const data = updateProfileSchema.parse(req.body);

    if (data.bio !== undefined || data.guardianName !== undefined || data.guardianPhone !== undefined) {
      await db.run(
        `UPDATE students 
         SET bio = COALESCE(?, bio),
             guardian_name = COALESCE(?, guardian_name),
             guardian_phone = COALESCE(?, guardian_phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.bio, data.guardianName, data.guardianPhone, studentId]
      );
    }

    if (data.interests) {
      await db.run('DELETE FROM student_interests WHERE student_id = ?', [studentId]);
      for (const interest of data.interests) {
        await db.run(
          'INSERT INTO student_interests (id, student_id, interest_name) VALUES (?, ?, ?)',
          [uuidv4(), studentId, interest]
        );
      }
    }

    if (data.skills) {
      await db.run('DELETE FROM student_skills WHERE student_id = ?', [studentId]);
      for (const s of data.skills) {
        await db.run(
          'INSERT INTO student_skills (id, student_id, skill_name, proficiency_level) VALUES (?, ?, ?, ?)',
          [uuidv4(), studentId, s.skill, s.level]
        );
      }
    }

    sendSuccess(res, null, 'Portfolio updated successfully');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      sendError(res, err.errors[0].message, 422);
    } else {
      sendError(res, 'Failed to update portfolio', 500);
    }
  }
});

export default router;
