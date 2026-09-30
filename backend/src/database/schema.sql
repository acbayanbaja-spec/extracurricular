-- ANSI Relational Schema for Centrala National High School Extracurricular System
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- 'ADMINISTRATOR', 'TEACHER', 'STUDENT'
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id_number TEXT UNIQUE NOT NULL,
    grade_level TEXT NOT NULL,
    section TEXT NOT NULL,
    track_strand TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    bio TEXT,
    attendance_rate REAL DEFAULT 0.00,
    streak_count INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    title TEXT NOT NULL,
    specialization TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS administrators (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department TEXT NOT NULL DEFAULT 'Office of the Principal',
    permissions TEXT DEFAULT '["all"]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#4F46E5',
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clubs_organizations (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    adviser_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    logo_url TEXT,
    banner_url TEXT,
    meeting_schedule TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    organization_id TEXT REFERENCES clubs_organizations(id) ON DELETE SET NULL,
    organizer_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
    location TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    registration_deadline DATETIME NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 30,
    current_participants INTEGER NOT NULL DEFAULT 0,
    eligibility_grade_levels TEXT NOT NULL DEFAULT '["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]',
    required_skills TEXT DEFAULT '[]',
    banner_image TEXT,
    status TEXT NOT NULL DEFAULT 'Published',
    registration_status TEXT NOT NULL DEFAULT 'Registration Open',
    points INTEGER DEFAULT 20,
    qr_code_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending',
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    review_notes TEXT,
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, student_id)
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    session_title TEXT NOT NULL,
    session_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    qr_code_token TEXT UNIQUE,
    qr_expires_at DATETIME,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Present',
    check_in_time DATETIME,
    check_in_method TEXT DEFAULT 'manual',
    notes TEXT,
    recorded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

CREATE TABLE IF NOT EXISTS participation_records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'Participant',
    hours_spent REAL DEFAULT 2.0,
    performance_rating REAL,
    feedback TEXT,
    completion_status TEXT DEFAULT 'Completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Trophy',
    criteria TEXT NOT NULL,
    points INTEGER DEFAULT 50,
    badge_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_achievements (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    activity_id TEXT REFERENCES activities(id) ON DELETE SET NULL,
    awarded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    is_celebrated INTEGER DEFAULT 0,
    UNIQUE(student_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL DEFAULT 'Medal',
    color TEXT NOT NULL DEFAULT '#F59E0B',
    tier TEXT NOT NULL DEFAULT 'Bronze',
    criteria TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_badges (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    activity_id TEXT REFERENCES activities(id) ON DELETE SET NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    awarded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    is_celebrated INTEGER DEFAULT 0,
    UNIQUE(student_id, badge_id)
);

CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    target_value INTEGER NOT NULL DEFAULT 1,
    target_metric TEXT NOT NULL,
    badge_id TEXT REFERENCES badges(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_milestones (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    milestone_id TEXT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    current_value INTEGER DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    UNIQUE(student_id, milestone_id)
);

CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    certificate_number TEXT UNIQUE NOT NULL,
    file_url TEXT NOT NULL,
    file_size TEXT,
    issue_date TEXT NOT NULL,
    issued_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    template_id TEXT DEFAULT 'cnhs-standard-v1',
    status TEXT DEFAULT 'VERIFIED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 19. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    activity_id TEXT REFERENCES activities(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_audience TEXT NOT NULL DEFAULT 'All',
    target_grade_level TEXT,
    is_pinned INTEGER DEFAULT 0,
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiration_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 20. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    link TEXT,
    is_read INTEGER DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 21. STUDENT INTERESTS TABLE
CREATE TABLE IF NOT EXISTS student_interests (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    interest_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, interest_name)
);

-- 22. STUDENT SKILLS TABLE
CREATE TABLE IF NOT EXISTS student_skills (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    proficiency_level TEXT DEFAULT 'Intermediate',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, skill_name)
);

-- 23. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_data TEXT,
    new_data TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 24. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
