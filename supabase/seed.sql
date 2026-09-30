-- Seed SQL for Supabase PostgreSQL
-- Centrala National High School Extracurricular & Student Development System

-- Passwords: All accounts use Password123!
-- Bcrypt hash: $2a$10$7Z8l4xM57wZ/zJ1Vw/n82uW7y6ZgqB7c/gN0y3c4Vj7F8zB2rYn1K (standard seeded hash)

INSERT INTO users (id, email, password_hash, role, status, first_name, last_name, avatar_url, phone)
VALUES
('usr-admin-01', 'admin@cnhs.edu.ph', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMINISTRATOR', 'ACTIVE', 'Rodrigo', 'Mendoza', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', '+63 917 555 1201'),
('usr-teacher-01', 'maria.santos@cnhs.edu.ph', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'TEACHER', 'ACTIVE', 'Maria', 'Santos', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80', '+63 918 555 2301'),
('usr-teacher-02', 'roberto.delacruz@cnhs.edu.ph', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'TEACHER', 'ACTIVE', 'Roberto', 'Dela Cruz', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80', '+63 919 555 3401'),
('usr-teacher-03', 'jennifer.lim@cnhs.edu.ph', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'TEACHER', 'ACTIVE', 'Jennifer', 'Lim', 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=256&q=80', '+63 920 555 4501'),
('usr-student-01', 'student@cnhs.edu.ph', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', 'ACTIVE', 'Angelo', 'Morales', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80', '+63 921 555 5601'),
('usr-student-02', 'kristine.alcantara@cnhs.edu.ph', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', 'ACTIVE', 'Kristine Joy', 'Alcantara', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80', '+63 922 555 6701'),
('usr-student-03', 'john.fernandez@cnhs.edu.ph', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', 'ACTIVE', 'John Patrick', 'Fernandez', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80', '+63 923 555 7801'),
('usr-student-04', 'sofia.ramos@cnhs.edu.ph', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', 'ACTIVE', 'Sofia', 'Ramos', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80', '+63 924 555 8901')
ON CONFLICT (id) DO NOTHING;

INSERT INTO administrators (id, user_id, department, permissions)
VALUES ('adm-01', 'usr-admin-01', 'Office of the Principal / School Administration', '["all"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO teachers (id, user_id, employee_id, department, title, specialization)
VALUES
('tch-01', 'usr-teacher-01', 'CNHS-EMP-2015-089', 'English & Social Sciences', 'Master Teacher II / SSLG Adviser', 'Campus Journalism, Public Speaking, Youth Leadership'),
('tch-02', 'usr-teacher-02', 'CNHS-EMP-2017-104', 'MAPEH & Sports Department', 'Head Teacher I / Athletics Coordinator', 'Basketball Coaching, Tournament Officiating, Fitness'),
('tch-03', 'usr-teacher-03', 'CNHS-EMP-2019-142', 'Science & Technology (STEM)', 'Teacher III / Robotics Club Adviser', 'Robotics Engineering, IoT, Computer Science')
ON CONFLICT (id) DO NOTHING;

INSERT INTO students (id, user_id, student_id_number, grade_level, section, track_strand, guardian_name, guardian_phone, bio, attendance_rate, streak_count, total_points)
VALUES
('std-01', 'usr-student-01', '109823450012', 'Grade 10', 'Rizal', 'Special Program in Arts/Science', 'Elena Morales', '+63 917 111 2233', 'Grade 10 student passionate about youth leadership, civic volunteering, robotics, and creative problem solving.', 94.5, 5, 380),
('std-02', 'usr-student-02', '109823450013', 'Grade 11', 'STEM-A', 'STEM', 'Corazon Alcantara', '+63 918 222 3344', 'Senior high STEM enthusiast exploring Arduino robotics and investigative science writing.', 98.0, 8, 450),
('std-03', 'usr-student-03', '109823450014', 'Grade 9', 'Bonifacio', 'Junior High General', 'Arman Fernandez', '+63 919 333 4455', 'Aspiring athlete playing basketball and volleyball. Dedicated to school spirit and community cleanup drives.', 88.0, 3, 240),
('std-04', 'usr-student-04', '109823450015', 'Grade 12', 'HUMSS-B', 'HUMSS', 'Teresa Ramos', '+63 920 444 5566', 'Graduating HUMSS senior with focus on student advocacy, community outreach, and cultural performance arts.', 96.0, 6, 410)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, slug, description, icon, color, display_order)
VALUES
('cat-01', 'Leadership & Governance', 'leadership-governance', 'Student councils, parliamentary clubs, civic empowerment and diplomacy programs.', 'Crown', '#4F46E5', 1),
('cat-02', 'Sports & Athletics', 'sports-athletics', 'Interschool athletic competitions, team sports, wellness and sportsmanship.', 'Trophy', '#EA580C', 2),
('cat-03', 'STEM & Robotics', 'stem-robotics', 'Science Olympiad, robotics engineering, software coding, and mathematics guilds.', 'Cpu', '#0284C7', 3),
('cat-04', 'Arts & Culture', 'arts-culture', 'Performing arts, visual design, marching band, and Philippine traditional dance.', 'Palette', '#D97706', 4),
('cat-05', 'Community & Red Cross', 'community-red-cross', 'First aid rescue, environmental sustainability, Boy/Girl Scouts, disaster management.', 'HeartHandshake', '#DC2626', 5),
('cat-06', 'Campus Journalism', 'campus-journalism', 'News writing, photojournalism, editorial cartooning, broadcasting and debate.', 'Newspaper', '#059669', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO clubs_organizations (id, name, code, description, adviser_id, category_id, logo_url, banner_url, meeting_schedule, status)
VALUES
('club-01', 'CNHS Supreme Secondary Learner Government (SSLG)', 'CNHS-SSLG', 'The highest governing student representative council of Centrala National High School.', 'tch-01', 'cat-01', 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=256&q=80', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', 'Every Wednesday, 3:30 PM - 5:00 PM', 'ACTIVE'),
('club-02', 'CNHS Blue Knights Basketball & Athletics Club', 'CNHS-SPORTS', 'Official athletic varsity program dedicated to developing athletic excellence.', 'tch-02', 'cat-02', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=256&q=80', 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=1200&q=80', 'Mon / Wed / Fri 4:00 PM - 6:00 PM', 'ACTIVE'),
('club-03', 'CNHS Innovators: Robotics and Applied Science Guild', 'CNHS-ROBO', 'Hub for young inventors creating autonomous robotics and IoT green energy solutions.', 'tch-03', 'cat-03', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=256&q=80', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80', 'Tuesday & Thursday 3:45 PM - 5:30 PM', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activities (id, title, slug, description, category_id, organization_id, organizer_id, location, date, start_time, end_time, registration_deadline, max_participants, current_participants, eligibility_grade_levels, required_skills, banner_image, status, registration_status, points, qr_code_hash)
VALUES
('act-01', 'Annual Youth Leadership Summit & Parliamentary Simulation 2026', 'annual-youth-leadership-summit-2026', 'Intensive 2-day student leadership academy covering parliamentary procedures and project management.', 'cat-01', 'club-01', 'tch-01', 'CNHS Multi-Purpose Hall', '2026-10-14', '08:00 AM', '04:30 PM', '2026-10-10 23:59:59', 40, 28, '["Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]', '["Public Speaking","Leadership"]', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80', 'Published', 'Registration Open', 50, 'QR-CNHS-SUMMIT-2026-ALPHA'),
('act-03', 'Robotics Bootcamp: Arduino Microcontrollers & AI Prototyping', 'robotics-bootcamp-arduino-ai-prototyping', 'Hands-on hardware lab where students assemble autonomous obstacle-avoiding rovers.', 'cat-03', 'club-03', 'tch-03', 'CNHS STEM Innovation Lab', '2026-10-22', '01:00 PM', '05:00 PM', '2026-10-20 23:59:59', 25, 22, '["Grade 9","Grade 10","Grade 11","Grade 12"]', '["Arduino C++","Problem Solving"]', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80', 'Published', 'Registration Open', 60, 'QR-CNHS-ROBOTICS-2026-GAMMA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO badges (id, name, slug, description, icon_name, color, tier, criteria)
VALUES
('bdg-01', 'Active Participant', 'active-participant', 'Actively registered, participated, and completed at least 3 school extracurricular activities.', 'Medal', '#CD7F32', 'Bronze', 'Complete 3 sanctioned extracurricular activities.'),
('bdg-02', 'Outstanding Leader', 'outstanding-leader', 'Demonstrated exemplary servant leadership in student governance or activity facilitation.', 'Trophy', '#F59E0B', 'Gold', 'Lead an organization project or receive teacher leadership commendation.'),
('bdg-03', 'Consistent Participant', 'consistent-participant', 'Maintained 90% or higher attendance across all activity sessions.', 'Star', '#94A3B8', 'Silver', 'Maintain 90% attendance across extracurricular activities.'),
('bdg-04', 'Goal Achiever', 'goal-achiever', 'Successfully reached 5 milestones and collected official skill validations.', 'Target', '#10B981', 'Platinum', 'Complete 5 student development milestones.')
ON CONFLICT (id) DO NOTHING;
