export type UserRole = 'ADMINISTRATOR' | 'TEACHER' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  createdAt: string;
  student?: StudentProfile | null;
  teacher?: TeacherProfile | null;
  administrator?: AdminProfile | null;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  student_id_number: string;
  grade_level: string;
  section: string;
  track_strand?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  bio?: string | null;
  attendance_rate: number;
  streak_count: number;
  total_points: number;
  interests?: string[];
  skills?: { skill_name: string; proficiency_level: string }[];
}

export interface TeacherProfile {
  id: string;
  user_id: string;
  employee_id: string;
  department: string;
  title: string;
  specialization?: string | null;
}

export interface AdminProfile {
  id: string;
  user_id: string;
  department: string;
  permissions: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  display_order: number;
  activity_count?: number;
}

export interface ClubOrganization {
  id: string;
  name: string;
  code: string;
  description: string;
  adviser_id?: string;
  category_id?: string;
  logo_url?: string;
  banner_url?: string;
  meeting_schedule?: string;
  status: 'ACTIVE' | 'INACTIVE';
  category_name?: string;
  category_color?: string;
  adviser_first_name?: string;
  adviser_last_name?: string;
}

export type ActivityStatus = 'Draft' | 'Pending' | 'Published' | 'Ongoing' | 'Completed' | 'Cancelled';
export type RegistrationState = 'Registration Open' | 'Registration Closed';

export interface Activity {
  id: string;
  title: string;
  slug: string;
  description: string;
  category_id: string;
  organization_id?: string;
  organizer_id?: string;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  max_participants: number;
  current_participants: number;
  eligibility_grade_levels: string; // JSON array
  required_skills: string; // JSON array
  banner_image?: string;
  status: ActivityStatus;
  registration_status: RegistrationState;
  points: number;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  organization_name?: string;
  organization_code?: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
  myRegistration?: Registration | null;
  availableSlots?: number;
  isFull?: boolean;
}

export type RegistrationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Waitlisted' | 'Cancelled' | 'Completed';

export interface Registration {
  id: string;
  activity_id: string;
  student_id: string;
  status: RegistrationStatus;
  registration_date: string;
  review_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  activity_title?: string;
  activity_slug?: string;
  location?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  banner_image?: string;
  category_name?: string;
  category_color?: string;
  organization_name?: string;
  student_name?: string;
  student_id_number?: string;
  grade_level?: string;
  section?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface AttendanceSession {
  id: string;
  activity_id: string;
  session_title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  qr_code_token?: string;
  qr_expires_at?: string;
  present_count?: number;
  late_count?: number;
  absent_count?: number;
  total_enrolled?: number;
  activity_title?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  activity_id: string;
  student_id: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  check_in_time?: string | null;
  check_in_method?: string;
  notes?: string | null;
  session_title?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  activity_title?: string;
  first_name?: string;
  last_name?: string;
  student_id_number?: string;
  grade_level?: string;
  section?: string;
  avatar_url?: string;
}

export interface AttendanceStats {
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
  streakCount: number;
}

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  color: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  criteria: string;
  isUnlocked?: boolean;
  earnedAt?: string | null;
  activityTitle?: string | null;
  awarderName?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  criteria: string;
  points: number;
  badge_id?: string;
  awarded_at?: string;
  activity_title?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  category: string;
  target_value: number;
  target_metric: string;
  badge_id?: string;
  order_index: number;
  current_value?: number;
  is_completed?: boolean | number;
  completed_at?: string | null;
  badge_name?: string;
  badge_icon?: string;
  badge_tier?: string;
  badge_color?: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  activity_id: string;
  title: string;
  description?: string;
  certificate_number: string;
  file_url: string;
  file_size?: string;
  issue_date: string;
  issued_by?: string;
  status: 'VERIFIED' | 'REVOKED';
  activity_title?: string;
  category_name?: string;
  category_color?: string;
  issuer_first_name?: string;
  issuer_last_name?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  activity_id?: string | null;
  author_id: string;
  target_audience: 'All' | 'Students' | 'Teachers' | 'Grade Level';
  target_grade_level?: string | null;
  is_pinned: boolean | number;
  publish_date: string;
  first_name?: string;
  last_name?: string;
  author_role?: string;
  activity_title?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'registration' | 'attendance' | 'achievement' | 'badge' | 'certificate' | 'announcement' | 'system';
  link?: string | null;
  is_read: boolean | number;
  created_at: string;
}

export interface RecommendedActivity extends Activity {
  matchScore: number;
  matchReasons: string[];
  isAlreadyRegistered: boolean;
}
