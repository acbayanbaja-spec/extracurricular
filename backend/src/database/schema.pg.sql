-- Centrala National High School - Extracurricular Activities and Student Development System
-- Database Schema for PostgreSQL / Supabase
-- Author: CNHS System Development Team
-- Location: Surallah, South Cotabato

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('ADMINISTRATOR', 'TEACHER', 'STUDENT')),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id_number VARCHAR(64) UNIQUE NOT NULL, -- Learner Reference Number (LRN)
    grade_level VARCHAR(32) NOT NULL,              -- Grade 7, Grade 8, Grade 9, Grade 10, Grade 11, Grade 12
    section VARCHAR(64) NOT NULL,
    track_strand VARCHAR(64),                      -- STEM, ABM, HUMSS, TVL, Junior High General
    guardian_name VARCHAR(128),
    guardian_phone VARCHAR(32),
    bio TEXT,
    attendance_rate NUMERIC(5, 2) DEFAULT 0.00,
    streak_count INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TEACHERS TABLE
CREATE TABLE IF NOT EXISTS teachers (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(64) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,                   -- Master Teacher I, Head Teacher, Teacher III, etc.
    specialization VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ADMINISTRATORS TABLE
CREATE TABLE IF NOT EXISTS administrators (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL DEFAULT 'Office of the Principal',
    permissions TEXT DEFAULT '["all"]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(64) NOT NULL DEFAULT 'Tag',
    color VARCHAR(32) NOT NULL DEFAULT '#4F46E5',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CLUBS & ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS clubs_organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) UNIQUE NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,              -- e.g. CNHS-SSLG, CNHS-RCY, CNHS-SCI
    description TEXT NOT NULL,
    adviser_id VARCHAR(64) REFERENCES teachers(id) ON DELETE SET NULL,
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    logo_url TEXT,
    banner_url TEXT,
    meeting_schedule VARCHAR(128),
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    organization_id VARCHAR(64) REFERENCES clubs_organizations(id) ON DELETE SET NULL,
    organizer_id VARCHAR(64) REFERENCES teachers(id) ON DELETE SET NULL,
    location VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time VARCHAR(16) NOT NULL,
    end_time VARCHAR(16) NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 30,
    current_participants INTEGER NOT NULL DEFAULT 0,
    eligibility_grade_levels TEXT NOT NULL DEFAULT '["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]',
    required_skills TEXT DEFAULT '[]',
    banner_image TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Pending', 'Published', 'Ongoing', 'Completed', 'Cancelled')),
    registration_status VARCHAR(32) NOT NULL DEFAULT 'Registration Open' CHECK (registration_status IN ('Registration Open', 'Registration Closed')),
    points INTEGER DEFAULT 20,
    qr_code_hash VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS registrations (
    id VARCHAR(64) PRIMARY KEY,
    activity_id VARCHAR(64) NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Waitlisted', 'Cancelled', 'Completed')),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    review_notes TEXT,
    reviewed_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, student_id)
);

-- 9. ATTENDANCE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id VARCHAR(64) PRIMARY KEY,
    activity_id VARCHAR(64) NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    session_title VARCHAR(128) NOT NULL,
    session_date DATE NOT NULL,
    start_time VARCHAR(16) NOT NULL,
    end_time VARCHAR(16) NOT NULL,
    qr_code_token VARCHAR(128) UNIQUE,
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    activity_id VARCHAR(64) NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_in_method VARCHAR(32) DEFAULT 'manual' CHECK (check_in_method IN ('manual', 'qr_scan')),
    notes TEXT,
    recorded_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

-- 11. PARTICIPATION RECORDS TABLE
CREATE TABLE IF NOT EXISTS participation_records (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_id VARCHAR(64) NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    role VARCHAR(64) DEFAULT 'Participant',
    hours_spent NUMERIC(5, 2) DEFAULT 2.0,
    performance_rating NUMERIC(3, 1),
    feedback TEXT,
    completion_status VARCHAR(32) DEFAULT 'Completed' CHECK (completion_status IN ('In Progress', 'Completed', 'Dropped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    icon VARCHAR(64) NOT NULL DEFAULT 'Trophy',
    criteria TEXT NOT NULL,
    points INTEGER DEFAULT 50,
    badge_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. STUDENT ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS student_achievements (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    achievement_id VARCHAR(64) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    activity_id VARCHAR(64) REFERENCES activities(id) ON DELETE SET NULL,
    awarded_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    is_celebrated BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, achievement_id)
);

-- 14. BADGES TABLE
CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(128) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon_name VARCHAR(64) NOT NULL DEFAULT 'Medal',
    color VARCHAR(32) NOT NULL DEFAULT '#F59E0B',
    tier VARCHAR(32) NOT NULL DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
    criteria TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. STUDENT BADGES TABLE
CREATE TABLE IF NOT EXISTS student_badges (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    badge_id VARCHAR(64) NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    activity_id VARCHAR(64) REFERENCES activities(id) ON DELETE SET NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    awarded_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    is_celebrated BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, badge_id)
);

-- 16. MILESTONES TABLE
CREATE TABLE IF NOT EXISTS milestones (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    target_value INTEGER NOT NULL DEFAULT 1,
    target_metric VARCHAR(64) NOT NULL,           -- activities_joined, attendance_rate, badges_earned, certificates_earned
    badge_id VARCHAR(64) REFERENCES badges(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. STUDENT MILESTONES TABLE
CREATE TABLE IF NOT EXISTS student_milestones (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    milestone_id VARCHAR(64) NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    current_value INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(student_id, milestone_id)
);

-- 18. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_id VARCHAR(64) NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    certificate_number VARCHAR(128) UNIQUE NOT NULL,
    file_url TEXT NOT NULL,
    file_size VARCHAR(32),
    issue_date DATE NOT NULL,
    issued_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    template_id VARCHAR(64) DEFAULT 'cnhs-standard-v1',
    status VARCHAR(32) DEFAULT 'VERIFIED' CHECK (status IN ('VERIFIED', 'REVOKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    activity_id VARCHAR(64) REFERENCES activities(id) ON DELETE CASCADE,
    author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_audience VARCHAR(32) NOT NULL DEFAULT 'All' CHECK (target_audience IN ('All', 'Students', 'Teachers', 'Grade Level')),
    target_grade_level VARCHAR(32),
    is_pinned BOOLEAN DEFAULT FALSE,
    publish_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'system' CHECK (type IN ('registration', 'attendance', 'achievement', 'badge', 'certificate', 'announcement', 'system')),
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. STUDENT INTERESTS TABLE
CREATE TABLE IF NOT EXISTS student_interests (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    interest_name VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, interest_name)
);

-- 22. STUDENT SKILLS TABLE
CREATE TABLE IF NOT EXISTS student_skills (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    skill_name VARCHAR(64) NOT NULL,
    proficiency_level VARCHAR(32) DEFAULT 'Intermediate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, skill_name)
);

-- 23. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    old_data TEXT,
    new_data TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 24. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(64) PRIMARY KEY,
    setting_key VARCHAR(64) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_lrn ON students(student_id_number);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category_id);
CREATE INDEX IF NOT EXISTS idx_activities_organization ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_activity ON registrations(activity_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_activity ON attendance_records(activity_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_student ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(publish_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
