import { db } from '../database/db';

export interface RecommendedActivity {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  organizationName: string;
  organizerName: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  bannerImage: string;
  status: string;
  registrationStatus: string;
  points: number;
  matchScore: number; // 0 - 100%
  matchReasons: string[];
  isAlreadyRegistered: boolean;
}

export class RecommendationService {
  public static async getRecommendationsForStudent(studentId: string): Promise<RecommendedActivity[]> {
    // 1. Fetch student info
    const student = await db.get(
      `SELECT s.*, u.first_name, u.last_name 
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [studentId]
    );

    if (!student) {
      return [];
    }

    // 2. Fetch student interests and skills
    const interests = await db.query(
      `SELECT interest_name FROM student_interests WHERE student_id = ?`,
      [studentId]
    );
    const skills = await db.query(
      `SELECT skill_name FROM student_skills WHERE student_id = ?`,
      [studentId]
    );

    const interestNames = interests.map((i) => i.interest_name.toLowerCase());
    const skillNames = skills.map((s) => s.skill_name.toLowerCase());

    // 3. Fetch past registered activities
    const registrations = await db.query(
      `SELECT activity_id, status FROM registrations WHERE student_id = ?`,
      [studentId]
    );
    const registeredActivityIds = new Set(registrations.map((r) => r.activity_id));

    // 4. Fetch all published activities with category and club details
    const activities = await db.query(
      `SELECT a.*, 
              c.name as category_name, c.color as category_color,
              o.name as organization_name,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM activities a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN clubs_organizations o ON a.organization_id = o.id
       LEFT JOIN teachers t ON a.organizer_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE a.status = 'Published' AND a.registration_status = 'Registration Open'
       ORDER BY a.date ASC`
    );

    const scoredActivities: RecommendedActivity[] = [];

    for (const act of activities) {
      let rawScore = 0;
      const reasons: string[] = [];
      const isRegistered = registeredActivityIds.has(act.id);

      // Check grade eligibility
      let eligibleGrades: string[] = [];
      try {
        eligibleGrades = JSON.parse(act.eligibility_grade_levels || '[]');
      } catch {
        eligibleGrades = [];
      }

      const isGradeEligible =
        eligibleGrades.length === 0 || eligibleGrades.includes(student.grade_level);

      if (isGradeEligible) {
        rawScore += 25;
        reasons.push(`Directly open to ${student.grade_level} students`);
      } else {
        // Skip or heavily penalize if not grade eligible
        continue;
      }

      // Check interest matches
      const categoryLower = (act.category_name || '').toLowerCase();
      const titleLower = (act.title || '').toLowerCase();
      const descLower = (act.description || '').toLowerCase();

      for (const interest of interestNames) {
        if (
          categoryLower.includes(interest) ||
          titleLower.includes(interest) ||
          descLower.includes(interest)
        ) {
          rawScore += 25;
          reasons.push(`Matches your interest in "${interest}"`);
          break;
        }
      }

      // Check skill matches
      let requiredSkills: string[] = [];
      try {
        requiredSkills = JSON.parse(act.required_skills || '[]');
      } catch {
        requiredSkills = [];
      }

      for (const reqSkill of requiredSkills) {
        const reqLower = reqSkill.toLowerCase();
        for (const userSkill of skillNames) {
          if (userSkill.includes(reqLower) || reqLower.includes(userSkill)) {
            rawScore += 20;
            reasons.push(`Applies your skill in "${userSkill}"`);
            break;
          }
        }
      }

      // Capacity factor (has available spots)
      const availableSeats = (act.max_participants || 30) - (act.current_participants || 0);
      if (availableSeats > 5) {
        rawScore += 15;
        reasons.push(`${availableSeats} open seats available`);
      } else if (availableSeats > 0) {
        rawScore += 10;
        reasons.push(`Fast-filling: only ${availableSeats} spots left`);
      }

      // Track or Strand alignment bonus
      if (student.track_strand && student.track_strand.includes('STEM') && categoryLower.includes('stem')) {
        rawScore += 15;
        reasons.push('Curriculum enrichment for STEM strand');
      }

      // Normalize match score to max 98%
      const matchScore = Math.min(98, Math.max(45, rawScore));

      if (reasons.length === 0) {
        reasons.push('Recommended school-wide extracurricular activity');
      }

      scoredActivities.push({
        id: act.id,
        title: act.title,
        slug: act.slug,
        description: act.description,
        categoryId: act.category_id,
        categoryName: act.category_name || 'General',
        categoryColor: act.category_color || '#4F46E5',
        organizationName: act.organization_name || 'Centrala National High School',
        organizerName: act.teacher_first_name ? `${act.teacher_first_name} ${act.teacher_last_name}` : 'Faculty Adviser',
        location: act.location,
        date: act.date,
        startTime: act.start_time,
        endTime: act.end_time,
        registrationDeadline: act.registration_deadline,
        maxParticipants: act.max_participants,
        currentParticipants: act.current_participants,
        bannerImage: act.banner_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        status: act.status,
        registrationStatus: act.registration_status,
        points: act.points || 20,
        matchScore,
        matchReasons: reasons,
        isAlreadyRegistered: isRegistered,
      });
    }

    // Sort by match score descending
    return scoredActivities.sort((a, b) => b.matchScore - a.matchScore);
  }
}
