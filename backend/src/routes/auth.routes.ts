import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { comparePassword, hashPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendError, sendSuccess } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { AuditService } from '../services/audit.service';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db.get(
      'SELECT id, email, password_hash, role, status, first_name, last_name, avatar_url, phone FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (!user) {
      sendError(res, 'Invalid email or password credentials.', 401);
      return;
    }

    if (user.status !== 'ACTIVE') {
      sendError(res, 'This account has been deactivated. Please contact CNHS Administration.', 403);
      return;
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      sendError(res, 'Invalid email or password credentials.', 401);
      return;
    }

    let studentProfile = null;
    let teacherProfile = null;
    let adminProfile = null;

    if (user.role === 'STUDENT') {
      studentProfile = await db.get('SELECT * FROM students WHERE user_id = ?', [user.id]);
    } else if (user.role === 'TEACHER') {
      teacherProfile = await db.get('SELECT * FROM teachers WHERE user_id = ?', [user.id]);
    } else if (user.role === 'ADMINISTRATOR') {
      adminProfile = await db.get('SELECT * FROM administrators WHERE user_id = ?', [user.id]);
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      studentId: studentProfile ? studentProfile.id : undefined,
      teacherId: teacherProfile ? teacherProfile.id : undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await AuditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        phone: user.phone,
        student: studentProfile,
        teacher: teacherProfile,
        administrator: adminProfile,
      },
    }, 'Sign in successful');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, error.errors[0].message, 422);
    } else {
      sendError(res, 'Login processing error', 500);
    }
  }
});

const registerStudentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  studentIdNumber: z.string().min(6),
  gradeLevel: z.string(),
  section: z.string(),
  trackStrand: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerStudentSchema.parse(req.body);

    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [data.email.toLowerCase()]);
    if (existingUser) {
      sendError(res, 'An account with this email address already exists.', 409);
      return;
    }

    const existingLrn = await db.get('SELECT id FROM students WHERE student_id_number = ?', [data.studentIdNumber]);
    if (existingLrn) {
      sendError(res, 'A student with this Student ID / LRN already exists.', 409);
      return;
    }

    const userId = uuidv4();
    const studentId = uuidv4();
    const hashedPassword = await hashPassword(data.password);

    await db.run(
      `INSERT INTO users (id, email, password_hash, role, status, first_name, last_name)
       VALUES (?, ?, ?, 'STUDENT', 'ACTIVE', ?, ?)`,
      [userId, data.email.toLowerCase(), hashedPassword, data.firstName, data.lastName]
    );

    await db.run(
      `INSERT INTO students (id, user_id, student_id_number, grade_level, section, track_strand, guardian_name, guardian_phone, attendance_rate, streak_count, total_points)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 100.0, 0, 0)`,
      [
        studentId,
        userId,
        data.studentIdNumber,
        data.gradeLevel,
        data.section,
        data.trackStrand || null,
        data.guardianName || null,
        data.guardianPhone || null,
      ]
    );

    // Initial notification
    await db.run(
      `INSERT INTO notifications (id, user_id, title, message, type, link)
       VALUES (?, ?, 'Welcome to CNHS Extracurricular! 🎓', 'Your student account is active. Explore clubs and register for upcoming activities.', 'system', '/student/discover')`,
      [uuidv4(), userId]
    );

    const payload = {
      userId,
      email: data.email.toLowerCase(),
      role: 'STUDENT' as const,
      studentId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: data.email.toLowerCase(),
        role: 'STUDENT',
        firstName: data.firstName,
        lastName: data.lastName,
        student: {
          id: studentId,
          student_id_number: data.studentIdNumber,
          grade_level: data.gradeLevel,
          section: data.section,
          track_strand: data.trackStrand,
        },
      },
    }, 'Student registration completed successfully', 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      sendError(res, err.errors[0].message, 422);
    } else {
      sendError(res, 'Registration failed. Please check your data.', 500);
    }
  }
});

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await db.get(
      'SELECT id, email, role, status, first_name, last_name, avatar_url, phone, created_at FROM users WHERE id = ?',
      [req.user!.userId]
    );

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    let student = null;
    let teacher = null;
    let administrator = null;

    if (user.role === 'STUDENT') {
      student = await db.get('SELECT * FROM students WHERE user_id = ?', [user.id]);
      if (student) {
        student.interests = (await db.query('SELECT interest_name FROM student_interests WHERE student_id = ?', [student.id])).map(i => i.interest_name);
        student.skills = (await db.query('SELECT skill_name, proficiency_level FROM student_skills WHERE student_id = ?', [student.id]));
      }
    } else if (user.role === 'TEACHER') {
      teacher = await db.get('SELECT * FROM teachers WHERE user_id = ?', [user.id]);
    } else if (user.role === 'ADMINISTRATOR') {
      administrator = await db.get('SELECT * FROM administrators WHERE user_id = ?', [user.id]);
    }

    sendSuccess(res, {
      ...user,
      student,
      teacher,
      administrator,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch user profile', 500);
  }
});

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    sendError(res, 'Refresh token required', 400);
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      studentId: payload.studentId,
      teacherId: payload.teacherId,
    });

    sendSuccess(res, { accessToken: newAccessToken });
  } catch (err) {
    sendError(res, 'Invalid refresh token', 401);
  }
});

router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
  });

  try {
    const { currentPassword, newPassword } = schema.parse(req.body);
    const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user!.userId]);

    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      sendError(res, 'Current password does not match.', 400);
      return;
    }

    const newHash = await hashPassword(newPassword);
    await db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      newHash,
      req.user!.userId,
    ]);

    await AuditService.log({
      userId: req.user!.userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: req.user!.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    sendSuccess(res, null, 'Password updated successfully');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      sendError(res, err.errors[0].message, 422);
    } else {
      sendError(res, 'Could not update password', 500);
    }
  }
});

router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await AuditService.log({
    userId: req.user!.userId,
    action: 'USER_LOGOUT',
    entityType: 'USER',
    entityId: req.user!.userId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] as string,
  });
  sendSuccess(res, null, 'Logged out successfully');
});

export default router;
