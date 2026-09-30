import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { db } from '../database/db';
import { AuditService } from './audit.service';

export interface AttendanceStats {
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number; // percentage
  streakCount: number;
}

export class AttendanceService {
  public static async generateSessionQR(sessionId: string, expirationMinutes = 45): Promise<{ token: string; qrDataUrl: string; expiresAt: string }> {
    const session = await db.get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) {
      throw new Error('Attendance session not found');
    }

    const token = `CNHS-ATT-${sessionId}-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();

    await db.run(
      `UPDATE attendance_sessions 
       SET qr_code_token = ?, qr_expires_at = ? 
       WHERE id = ?`,
      [token, expiresAt, sessionId]
    );

    // Generate high quality QR data URL for display on teacher screen
    const qrDataPayload = JSON.stringify({
      system: 'CNHS-EASDS',
      sessionId,
      token,
      expiresAt,
    });

    const qrDataUrl = await QRCode.toDataURL(qrDataPayload, {
      errorCorrectionLevel: 'H',
      width: 320,
      margin: 2,
      color: {
        dark: '#1E3A8A', // CNHS Navy
        light: '#FFFFFF',
      },
    });

    return { token, qrDataUrl, expiresAt };
  }

  public static async recordQrCheckIn(
    studentId: string,
    qrPayload: { sessionId: string; token: string }
  ): Promise<{ success: boolean; message: string; recordId: string }> {
    const { sessionId, token } = qrPayload;

    const session = await db.get(
      `SELECT s.*, a.title as activity_title 
       FROM attendance_sessions s
       JOIN activities a ON s.activity_id = a.id
       WHERE s.id = ?`,
      [sessionId]
    );

    if (!session) {
      throw new Error('Invalid attendance session');
    }

    if (session.qr_code_token !== token) {
      throw new Error('Invalid or expired attendance QR token');
    }

    if (session.qr_expires_at && new Date(session.qr_expires_at) < new Date()) {
      throw new Error('This attendance QR code has expired. Please ask the adviser for a fresh QR code.');
    }

    // Verify student is registered and approved for this activity
    const registration = await db.get(
      `SELECT * FROM registrations 
       WHERE activity_id = ? AND student_id = ? AND status IN ('Approved', 'Completed')`,
      [session.activity_id, studentId]
    );

    if (!registration) {
      throw new Error('You must have an approved registration for this activity to check in.');
    }

    // Check if already checked in
    const existing = await db.get(
      'SELECT id, status, check_in_time FROM attendance_records WHERE session_id = ? AND student_id = ?',
      [sessionId, studentId]
    );

    const nowIso = new Date().toISOString();
    let recordId = existing ? existing.id : uuidv4();

    if (existing) {
      if (existing.status === 'Present' || existing.status === 'Late') {
        return {
          success: true,
          message: `Already checked in at ${existing.check_in_time}`,
          recordId: existing.id,
        };
      }
      // Update from Absent to Present
      await db.run(
        `UPDATE attendance_records 
         SET status = 'Present', check_in_time = ?, check_in_method = 'qr_scan', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [nowIso, recordId]
      );
    } else {
      await db.run(
        `INSERT INTO attendance_records (id, session_id, activity_id, student_id, status, check_in_time, check_in_method, notes)
         VALUES (?, ?, ?, ?, 'Present', ?, 'qr_scan', 'Verified via QR Code scan')`,
        [recordId, sessionId, session.activity_id, studentId, nowIso]
      );
    }

    // Recalculate student statistics
    await this.updateStudentAttendanceMetrics(studentId);

    return {
      success: true,
      message: `Checked in successfully for ${session.activity_title}!`,
      recordId,
    };
  }

  public static async updateStudentAttendanceMetrics(studentId: string): Promise<void> {
    const stats = await this.getStudentAttendanceStats(studentId);

    await db.run(
      `UPDATE students 
       SET attendance_rate = ?, streak_count = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [stats.attendanceRate, stats.streakCount, studentId]
    );
  }

  public static async getStudentAttendanceStats(studentId: string): Promise<AttendanceStats> {
    const records = await db.query(
      `SELECT status FROM attendance_records WHERE student_id = ?`,
      [studentId]
    );

    const totalSessions = records.length;
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    for (const r of records) {
      if (r.status === 'Present') present++;
      else if (r.status === 'Late') late++;
      else if (r.status === 'Absent') absent++;
      else if (r.status === 'Excused') excused++;
    }

    const effectivePresent = present + late * 0.75 + excused;
    const rate = totalSessions > 0 ? Math.min(100, Math.round((effectivePresent / totalSessions) * 1000) / 10) : 100;

    // Calculate recent streak
    const recentRecords = await db.query(
      `SELECT status FROM attendance_records 
       WHERE student_id = ? 
       ORDER BY created_at DESC LIMIT 10`,
      [studentId]
    );

    let streak = 0;
    for (const rec of recentRecords) {
      if (rec.status === 'Present' || rec.status === 'Late') {
        streak++;
      } else {
        break;
      }
    }

    return {
      totalSessions,
      present,
      absent,
      late,
      excused,
      attendanceRate: rate,
      streakCount: streak,
    };
  }
}
