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

// Public Certificate Verification by Number
router.get('/verify/:certificateNumber', async (req, res: Response): Promise<void> => {
  try {
    const { certificateNumber } = req.params;
    const cert = await db.get(
      `SELECT c.*, 
              s.student_id_number, s.grade_level, s.section,
              u.first_name as student_first_name, u.last_name as student_last_name,
              a.title as activity_title, a.date as activity_date, a.location as activity_location,
              iu.first_name as issuer_first_name, iu.last_name as issuer_last_name
       FROM certificates c
       JOIN students s ON c.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN activities a ON c.activity_id = a.id
       LEFT JOIN users iu ON c.issued_by = iu.id
       WHERE c.certificate_number = ?`,
      [certificateNumber.trim()]
    );

    if (!cert) {
      sendError(res, 'Certificate not found or invalid certificate number.', 404);
      return;
    }

    sendSuccess(res, cert, 'Certificate verified authentic by Centrala National High School');
  } catch (err) {
    sendError(res, 'Failed to verify certificate', 500);
  }
});

// GET all certificates (Admin or Teacher)
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const activityId = req.query.activityId as string;
      let query = `
        SELECT c.*, 
               s.student_id_number, s.grade_level, s.section,
               u.first_name as student_first_name, u.last_name as student_last_name,
               a.title as activity_title,
               iu.first_name as issuer_first_name, iu.last_name as issuer_last_name
        FROM certificates c
        JOIN students s ON c.student_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN activities a ON c.activity_id = a.id
        LEFT JOIN users iu ON c.issued_by = iu.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (activityId) {
        query += ` AND c.activity_id = ?`;
        params.push(activityId);
      }

      query += ` ORDER BY c.issue_date DESC`;

      const list = await db.query(query, params);
      sendSuccess(res, list);
    } catch (err) {
      sendError(res, 'Failed to fetch certificates', 500);
    }
  }
);

// GET student's own certificates
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

      const certs = await db.query(
        `SELECT c.*, 
                a.title as activity_title, a.date as activity_date,
                cat.name as category_name, cat.color as category_color,
                iu.first_name as issuer_first_name, iu.last_name as issuer_last_name
         FROM certificates c
         JOIN activities a ON c.activity_id = a.id
         LEFT JOIN categories cat ON a.category_id = cat.id
         LEFT JOIN users iu ON c.issued_by = iu.id
         WHERE c.student_id = ?
         ORDER BY c.issue_date DESC`,
        [studentId]
      );

      sendSuccess(res, certs);
    } catch (err) {
      sendError(res, 'Failed to fetch student certificates', 500);
    }
  }
);

// Issue / Upload Certificate (Admin or Teacher)
const issueCertSchema = z.object({
  studentId: z.string(),
  activityId: z.string(),
  title: z.string().min(3),
  description: z.string().optional(),
  fileUrl: z.string().default('https://images.unsplash.com/photo-1607344645866-009c320b5ab8?auto=format&fit=crop&w=1200&q=80'),
  fileSize: z.string().default('1.2 MB'),
  issueDate: z.string().default(() => new Date().toISOString().split('T')[0]),
  templateId: z.string().default('cnhs-gold-standard-v1'),
});

router.post(
  '/',
  authenticateToken,
  requireRole(['ADMINISTRATOR', 'TEACHER']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = issueCertSchema.parse(req.body);
      const id = uuidv4();
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      const certificateNumber = `CNHS-CERT-${year}-${randomCode}`;

      await db.run(
        `INSERT INTO certificates (
           id, student_id, activity_id, title, description, certificate_number,
           file_url, file_size, issue_date, issued_by, template_id, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED')`,
        [
          id,
          data.studentId,
          data.activityId,
          data.title,
          data.description || null,
          certificateNumber,
          data.fileUrl,
          data.fileSize,
          data.issueDate,
          req.user!.userId,
          data.templateId,
        ]
      );

      // Create notification for student
      const student = await db.get('SELECT user_id FROM students WHERE id = ?', [data.studentId]);
      if (student) {
        await db.run(
          `INSERT INTO notifications (id, user_id, title, message, type, link)
           VALUES (?, ?, 'Certificate Issued 📜', ?, 'certificate', '/student/certificates')`,
          [
            uuidv4(),
            student.user_id,
            `You have been awarded the certificate: "${data.title}"!`,
          ]
        );
      }

      // Check milestones
      await AchievementService.evaluateStudentMilestones(data.studentId);

      await AuditService.log({
        userId: req.user!.userId,
        action: 'CERTIFICATE_ISSUED',
        entityType: 'CERTIFICATE',
        entityId: id,
        newData: { certificateNumber, studentId: data.studentId, title: data.title },
        ipAddress: req.ip,
      });

      sendSuccess(res, { id, certificateNumber }, 'Certificate issued successfully', 201);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        sendError(res, err.errors[0].message, 422);
      } else {
        sendError(res, 'Failed to issue certificate', 500);
      }
    }
  }
);

// DELETE certificate (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['ADMINISTRATOR']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await db.run('DELETE FROM certificates WHERE id = ?', [id]);
      await AuditService.log({
        userId: req.user!.userId,
        action: 'CERTIFICATE_DELETED',
        entityType: 'CERTIFICATE',
        entityId: id,
        ipAddress: req.ip,
      });
      sendSuccess(res, null, 'Certificate removed');
    } catch (err) {
      sendError(res, 'Failed to delete certificate', 500);
    }
  }
);

export default router;
