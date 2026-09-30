import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';

export class AchievementService {
  public static async evaluateStudentMilestones(studentId: string): Promise<void> {
    // 1. Fetch completed or approved activities count
    const regCountRes = await db.get(
      `SELECT COUNT(*) as count FROM registrations 
       WHERE student_id = ? AND status IN ('Approved', 'Completed')`,
      [studentId]
    );
    const activitiesCount = parseInt(regCountRes?.count || '0', 10);

    // 2. Fetch student attendance rate
    const student = await db.get(
      `SELECT attendance_rate FROM students WHERE id = ?`,
      [studentId]
    );
    const attendanceRate = Number(student?.attendance_rate || 0);

    // 3. Fetch certificates count
    const certCountRes = await db.get(
      `SELECT COUNT(*) as count FROM certificates WHERE student_id = ?`,
      [studentId]
    );
    const certsCount = parseInt(certCountRes?.count || '0', 10);

    // 4. Fetch badges count
    const badgeCountRes = await db.get(
      `SELECT COUNT(*) as count FROM student_badges WHERE student_id = ?`,
      [studentId]
    );
    const badgesCount = parseInt(badgeCountRes?.count || '0', 10);

    // 5. Check all milestones
    const milestones = await db.query('SELECT * FROM milestones');

    for (const m of milestones) {
      let currentVal = 0;
      if (m.target_metric === 'activities_joined') currentVal = activitiesCount;
      else if (m.target_metric === 'attendance_rate') currentVal = Math.round(attendanceRate);
      else if (m.target_metric === 'certificates_earned') currentVal = certsCount;
      else if (m.target_metric === 'badges_earned') currentVal = badgesCount;

      const isCompleted = currentVal >= m.target_value ? 1 : 0;

      const existing = await db.get(
        'SELECT id, is_completed FROM student_milestones WHERE student_id = ? AND milestone_id = ?',
        [studentId, m.id]
      );

      if (existing) {
        if (!existing.is_completed && isCompleted) {
          await db.run(
            `UPDATE student_milestones 
             SET current_value = ?, is_completed = 1, completed_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [currentVal, existing.id]
          );

          // If milestone is linked to a badge, award it
          if (m.badge_id) {
            await this.awardBadge(studentId, m.badge_id, null, 'system');
          }
        } else {
          await db.run(
            `UPDATE student_milestones SET current_value = ? WHERE id = ?`,
            [currentVal, existing.id]
          );
        }
      } else {
        await db.run(
          `INSERT INTO student_milestones (id, student_id, milestone_id, current_value, is_completed, completed_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            studentId,
            m.id,
            currentVal,
            isCompleted,
            isCompleted ? new Date().toISOString() : null,
          ]
        );

        if (isCompleted && m.badge_id) {
          await this.awardBadge(studentId, m.badge_id, null, 'system');
        }
      }
    }
  }

  public static async awardBadge(
    studentId: string,
    badgeId: string,
    activityId: string | null = null,
    awardedBy: string = 'system'
  ): Promise<boolean> {
    const existing = await db.get(
      'SELECT id FROM student_badges WHERE student_id = ? AND badge_id = ?',
      [studentId, badgeId]
    );

    if (existing) return false;

    const badge = await db.get('SELECT name FROM badges WHERE id = ?', [badgeId]);
    if (!badge) return false;

    const student = await db.get('SELECT user_id FROM students WHERE id = ?', [studentId]);

    const id = uuidv4();
    await db.run(
      `INSERT INTO student_badges (id, student_id, badge_id, activity_id, awarded_by, is_celebrated)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [id, studentId, badgeId, activityId, awardedBy]
    );

    // Create real notification for student
    if (student) {
      await db.run(
        `INSERT INTO notifications (id, user_id, title, message, type, link, is_read)
         VALUES (?, ?, ?, ?, 'badge', '/student/badges', 0)`,
        [
          uuidv4(),
          student.user_id,
          'New Badge Earned! 🏅',
          `Congratulations! You earned the "${badge.name}" badge.`,
        ]
      );
    }

    return true;
  }
}
