import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

export async function runSeeder(): Promise<void> {
  console.log('🌱 [Seeder] Initializing database and starting seed...');
  await db.initSchema();

  // Check if users already exist
  const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', ['admin@cnhs.edu.ph']);
  if (existingAdmin) {
    console.log('ℹ️ [Seeder] Database already contains seed data. Skipping re-seed.');
    return;
  }

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. CREATE USERS
  const users = [
    {
      id: 'usr-admin-01',
      email: 'admin@cnhs.edu.ph',
      password_hash: defaultPasswordHash,
      role: 'ADMINISTRATOR',
      status: 'ACTIVE',
      first_name: 'Rodrigo',
      last_name: 'Mendoza',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      phone: '+63 917 555 1201',
    },
    {
      id: 'usr-teacher-01',
      email: 'maria.santos@cnhs.edu.ph',
      password_hash: defaultPasswordHash,
      role: 'TEACHER',
      status: 'ACTIVE',
      first_name: 'Maria',
      last_name: 'Santos',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
      phone: '+63 918 555 2301',
    },
    {
      id: 'usr-teacher-02',
      email: 'roberto.delacruz@cnhs.edu.ph',
      password_hash: defaultPasswordHash,
      role: 'TEACHER',
      status: 'ACTIVE',
      first_name: 'Roberto',
      last_name: 'Dela Cruz',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      phone: '+63 919 555 3401',
    },
    {
      id: 'usr-teacher-03',
      email: 'jennifer.lim@cnhs.edu.ph',
      password_hash: defaultPasswordHash,
      role: 'TEACHER',
      status: 'ACTIVE',
      first_name: 'Jennifer',
      last_name: 'Lim',
      avatar_url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=256&q=80',
      phone: '+63 920 555 4501',
    },
    {
      id: 'usr-student-01',
      email: 'student@cnhs.edu.ph', // Also aliases angelo.morales@cnhs.edu.ph
      password_hash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      first_name: 'Angelo',
      last_name: 'Morales',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
      phone: '+63 921 555 5601',
    },
    {
      id: 'usr-student-02',
      email: 'kristine.alcantara@cnhs.edu.ph',
      password_hash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      first_name: 'Kristine Joy',
      last_name: 'Alcantara',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
      phone: '+63 922 555 6701',
    },
    {
      id: 'usr-student-03',
      email: 'john.fernandez@cnhs.edu.ph',
      password_hash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      first_name: 'John Patrick',
      last_name: 'Fernandez',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      phone: '+63 923 555 7801',
    },
    {
      id: 'usr-student-04',
      email: 'sofia.ramos@cnhs.edu.ph',
      password_hash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      first_name: 'Sofia',
      last_name: 'Ramos',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      phone: '+63 924 555 8901',
    },
  ];

  for (const u of users) {
    await db.run(
      `INSERT INTO users (id, email, password_hash, role, status, first_name, last_name, avatar_url, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.email, u.password_hash, u.role, u.status, u.first_name, u.last_name, u.avatar_url, u.phone]
    );
  }

  // 2. ADMINISTRATOR PROFILE
  await db.run(
    `INSERT INTO administrators (id, user_id, department, permissions)
     VALUES (?, ?, ?, ?)`,
    ['adm-01', 'usr-admin-01', 'Office of the Principal / School Administration', '["all"]']
  );

  // 3. TEACHER PROFILES
  const teachers = [
    {
      id: 'tch-01',
      user_id: 'usr-teacher-01',
      employee_id: 'CNHS-EMP-2015-089',
      department: 'English & Social Sciences',
      title: 'Master Teacher II / SSLG & Journalism Adviser',
      specialization: 'Campus Journalism, Public Speaking, Youth Leadership',
    },
    {
      id: 'tch-02',
      user_id: 'usr-teacher-02',
      employee_id: 'CNHS-EMP-2017-104',
      department: 'MAPEH & Sports Department',
      title: 'Head Teacher I / Athletics Coordinator',
      specialization: 'Basketball Coaching, Tournament Officiating, Fitness',
    },
    {
      id: 'tch-03',
      user_id: 'usr-teacher-03',
      employee_id: 'CNHS-EMP-2019-142',
      department: 'Science & Technology (STEM)',
      title: 'Teacher III / Robotics Club Adviser',
      specialization: 'Robotics Engineering, IoT, Computer Science',
    },
  ];

  for (const t of teachers) {
    await db.run(
      `INSERT INTO teachers (id, user_id, employee_id, department, title, specialization)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [t.id, t.user_id, t.employee_id, t.department, t.title, t.specialization]
    );
  }

  // 4. STUDENT PROFILES
  const students = [
    {
      id: 'std-01',
      user_id: 'usr-student-01',
      student_id_number: '109823450012',
      grade_level: 'Grade 10',
      section: 'Rizal',
      track_strand: 'Junior High Special Program in Arts/Science',
      guardian_name: 'Elena Morales',
      guardian_phone: '+63 917 111 2233',
      bio: 'Grade 10 student passionate about youth leadership, civic volunteering, robotics, and creative problem solving. Aiming for STEM track in Senior High.',
      attendance_rate: 94.5,
      streak_count: 5,
      total_points: 380,
    },
    {
      id: 'std-02',
      user_id: 'usr-student-02',
      student_id_number: '109823450013',
      grade_level: 'Grade 11',
      section: 'STEM-A',
      track_strand: 'STEM',
      guardian_name: 'Corazon Alcantara',
      guardian_phone: '+63 918 222 3344',
      bio: 'Senior high STEM enthusiast exploring Arduino robotics and investigative science writing. Active participant in provincial science fairs.',
      attendance_rate: 98.0,
      streak_count: 8,
      total_points: 450,
    },
    {
      id: 'std-03',
      user_id: 'usr-student-03',
      student_id_number: '109823450014',
      grade_level: 'Grade 9',
      section: 'Bonifacio',
      track_strand: 'Junior High General',
      guardian_name: 'Arman Fernandez',
      guardian_phone: '+63 919 333 4455',
      bio: 'Aspiring athlete playing basketball and volleyball. Dedicated to school spirit and community cleanup drives.',
      attendance_rate: 88.0,
      streak_count: 3,
      total_points: 240,
    },
    {
      id: 'std-04',
      user_id: 'usr-student-04',
      student_id_number: '109823450015',
      grade_level: 'Grade 12',
      section: 'HUMSS-B',
      track_strand: 'HUMSS',
      guardian_name: 'Teresa Ramos',
      guardian_phone: '+63 920 444 5566',
      bio: 'Graduating HUMSS senior with focus on student advocacy, community outreach, and cultural performance arts.',
      attendance_rate: 96.0,
      streak_count: 6,
      total_points: 410,
    },
  ];

  for (const s of students) {
    await db.run(
      `INSERT INTO students (id, user_id, student_id_number, grade_level, section, track_strand, guardian_name, guardian_phone, bio, attendance_rate, streak_count, total_points)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.user_id, s.student_id_number, s.grade_level, s.section, s.track_strand, s.guardian_name, s.guardian_phone, s.bio, s.attendance_rate, s.streak_count, s.total_points]
    );
  }

  // 5. STUDENT INTERESTS & SKILLS
  const interestsData = [
    { student_id: 'std-01', interest: 'Youth Leadership' },
    { student_id: 'std-01', interest: 'Robotics & AI' },
    { student_id: 'std-01', interest: 'Community Service' },
    { student_id: 'std-01', interest: 'Campus Journalism' },
    { student_id: 'std-02', interest: 'STEM & Robotics' },
    { student_id: 'std-02', interest: 'Science Research' },
    { student_id: 'std-02', interest: 'Public Speaking' },
    { student_id: 'std-03', interest: 'Sports & Basketball' },
    { student_id: 'std-03', interest: 'Volleyball' },
    { student_id: 'std-03', interest: 'Eco Gardening' },
    { student_id: 'std-04', interest: 'Arts & Culture' },
    { student_id: 'std-04', interest: 'Social Advocacy' },
    { student_id: 'std-04', interest: 'Event Organizing' },
  ];

  for (const item of interestsData) {
    await db.run(
      `INSERT INTO student_interests (id, student_id, interest_name) VALUES (?, ?, ?)`,
      [uuidv4(), item.student_id, item.interest]
    );
  }

  const skillsData = [
    { student_id: 'std-01', skill: 'Public Speaking', level: 'Advanced' },
    { student_id: 'std-01', skill: 'Event Moderation', level: 'Intermediate' },
    { student_id: 'std-01', skill: 'Arduino C++', level: 'Intermediate' },
    { student_id: 'std-01', skill: 'First Aid Basic', level: 'Intermediate' },
    { student_id: 'std-02', skill: 'Python Programming', level: 'Advanced' },
    { student_id: 'std-02', skill: 'Circuit Soldering', level: 'Advanced' },
    { student_id: 'std-02', skill: 'Science Writing', level: 'Advanced' },
    { student_id: 'std-03', skill: 'Basketball Defense', level: 'Advanced' },
    { student_id: 'std-03', skill: 'Physical Fitness', level: 'Advanced' },
    { student_id: 'std-04', skill: 'Stage Directing', level: 'Advanced' },
    { student_id: 'std-04', skill: 'Folk Dance Performance', level: 'Expert' },
  ];

  for (const s of skillsData) {
    await db.run(
      `INSERT INTO student_skills (id, student_id, skill_name, proficiency_level) VALUES (?, ?, ?, ?)`,
      [uuidv4(), s.student_id, s.skill, s.level]
    );
  }

  // 6. CATEGORIES
  const categories = [
    {
      id: 'cat-01',
      name: 'Leadership & Governance',
      slug: 'leadership-governance',
      description: 'Student councils, parliamentary clubs, civic empowerment and diplomacy programs.',
      icon: 'Crown',
      color: '#4F46E5', // Indigo
      display_order: 1,
    },
    {
      id: 'cat-02',
      name: 'Sports & Athletics',
      slug: 'sports-athletics',
      description: 'Interschool athletic competitions, team sports, wellness and sportsmanship.',
      icon: 'Trophy',
      color: '#EA580C', // Orange
      display_order: 2,
    },
    {
      id: 'cat-03',
      name: 'STEM & Robotics',
      slug: 'stem-robotics',
      description: 'Science Olympiad, robotics engineering, software coding, and mathematics guilds.',
      icon: 'Cpu',
      color: '#0284C7', // Sky Blue
      display_order: 3,
    },
    {
      id: 'cat-04',
      name: 'Arts & Culture',
      slug: 'arts-culture',
      description: 'Performing arts, visual design, marching band, and Philippine traditional dance.',
      icon: 'Palette',
      color: '#D97706', // Amber
      display_order: 4,
    },
    {
      id: 'cat-05',
      name: 'Community & Red Cross',
      slug: 'community-red-cross',
      description: 'First aid rescue, environmental sustainability, Boy/Girl Scouts, disaster management.',
      icon: 'HeartHandshake',
      color: '#DC2626', // Red
      display_order: 5,
    },
    {
      id: 'cat-06',
      name: 'Campus Journalism',
      slug: 'campus-journalism',
      description: 'News writing, photojournalism, editorial cartooning, broadcasting and debate.',
      icon: 'Newspaper',
      color: '#059669', // Emerald
      display_order: 6,
    },
  ];

  for (const c of categories) {
    await db.run(
      `INSERT INTO categories (id, name, slug, description, icon, color, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.slug, c.description, c.icon, c.color, c.display_order]
    );
  }

  // 7. CLUBS & ORGANIZATIONS
  const clubs = [
    {
      id: 'club-01',
      name: 'CNHS Supreme Secondary Learner Government (SSLG)',
      code: 'CNHS-SSLG',
      description: 'The highest governing student representative council of Centrala National High School, fostering student democracy and leadership.',
      adviser_id: 'tch-01',
      category_id: 'cat-01',
      logo_url: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=256&q=80',
      banner_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
      meeting_schedule: 'Every Wednesday, 3:30 PM - 5:00 PM (SSLG Session Hall)',
      status: 'ACTIVE',
    },
    {
      id: 'club-02',
      name: 'CNHS Blue Knights Basketball & Athletics Club',
      code: 'CNHS-SPORTS',
      description: 'Official athletic varsity program dedicated to developing athletic excellence, discipline, and character across Palarong Pambansa divisions.',
      adviser_id: 'tch-02',
      category_id: 'cat-02',
      logo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=256&q=80',
      banner_url: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=1200&q=80',
      meeting_schedule: 'Mon / Wed / Fri 4:00 PM - 6:00 PM (CNHS Gymnasium)',
      status: 'ACTIVE',
    },
    {
      id: 'club-03',
      name: 'CNHS Innovators: Robotics and Applied Science Guild',
      code: 'CNHS-ROBO',
      description: 'Hub for young inventors creating autonomous robotics, micro-controllers, IoT green energy solutions, and competitive robotics prototypes.',
      adviser_id: 'tch-03',
      category_id: 'cat-03',
      logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=256&q=80',
      banner_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      meeting_schedule: 'Tuesday & Thursday 3:45 PM - 5:30 PM (STEM Innovation Lab)',
      status: 'ACTIVE',
    },
    {
      id: 'club-04',
      name: 'The Centralian Echo - Campus Journalism Guild',
      code: 'CNHS-ECHO',
      description: 'The award-winning official school publication of Centrala National High School delivering truthful stories, campus insights, and multimedia broadcast.',
      adviser_id: 'tch-01',
      category_id: 'cat-06',
      logo_url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=256&q=80',
      banner_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      meeting_schedule: 'Every Friday 3:30 PM - 5:00 PM (Audio Visual Room)',
      status: 'ACTIVE',
    },
    {
      id: 'club-05',
      name: 'CNHS Red Cross Youth & Disaster Preparedness Team',
      code: 'CNHS-RCY',
      description: 'Humanitarian volunteer youth movement equipping students with life-saving first aid skills, disaster risk reduction, and community blood services.',
      adviser_id: 'tch-02',
      category_id: 'cat-05',
      logo_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=256&q=80',
      banner_url: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=1200&q=80',
      meeting_schedule: 'Saturday 8:00 AM - 11:30 AM (School Clinic / Quadrangle)',
      status: 'ACTIVE',
    },
    {
      id: 'club-06',
      name: 'CNHS Sining Diwa Arts & Cultural Troupe',
      code: 'CNHS-ARTS',
      description: 'Celebrating Mindanao heritage through traditional folk dances, theatrical productions, choir performances, and visual art installations.',
      adviser_id: 'tch-01',
      category_id: 'cat-04',
      logo_url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=256&q=80',
      banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      meeting_schedule: 'Tue & Thu 4:00 PM - 6:00 PM (Performing Arts Center)',
      status: 'ACTIVE',
    },
  ];

  for (const cl of clubs) {
    await db.run(
      `INSERT INTO clubs_organizations (id, name, code, description, adviser_id, category_id, logo_url, banner_url, meeting_schedule, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cl.id, cl.name, cl.code, cl.description, cl.adviser_id, cl.category_id, cl.logo_url, cl.banner_url, cl.meeting_schedule, cl.status]
    );
  }

  // 8. ACTIVITIES
  const activities = [
    {
      id: 'act-01',
      title: 'Annual Youth Leadership Summit & Parliamentary Simulation 2026',
      slug: 'annual-youth-leadership-summit-2026',
      description: 'Intensive 2-day student leadership academy covering parliamentary procedures, resolution drafting, project management, and public speaking for future civic leaders of South Cotabato.',
      category_id: 'cat-01',
      organization_id: 'club-01',
      organizer_id: 'tch-01',
      location: 'CNHS Multi-Purpose Hall & Audio-Visual Center',
      date: '2026-10-14',
      start_time: '08:00 AM',
      end_time: '04:30 PM',
      registration_deadline: '2026-10-10 23:59:59',
      max_participants: 40,
      current_participants: 28,
      eligibility_grade_levels: JSON.stringify(['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
      required_skills: JSON.stringify(['Public Speaking', 'Leadership', 'Teamwork']),
      banner_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      status: 'Published',
      registration_status: 'Registration Open',
      points: 50,
      qr_code_hash: 'QR-CNHS-SUMMIT-2026-ALPHA',
    },
    {
      id: 'act-02',
      title: 'Division Interschool Basketball & Volleyball Selection Trials',
      slug: 'interschool-basketball-volleyball-trials',
      description: 'Comprehensive fitness, tactical conditioning, and competitive scrimmage trials to represent Centrala National High School in the Surallah Athletic Association Meet.',
      category_id: 'cat-02',
      organization_id: 'club-02',
      organizer_id: 'tch-02',
      location: 'CNHS Covered Court & Sports Complex',
      date: '2026-10-18',
      start_time: '03:30 PM',
      end_time: '06:00 PM',
      registration_deadline: '2026-10-16 17:00:00',
      max_participants: 50,
      current_participants: 36,
      eligibility_grade_levels: JSON.stringify(['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
      required_skills: JSON.stringify(['Basketball Defense', 'Physical Fitness', 'Sportsmanship']),
      banner_image: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=1200&q=80',
      status: 'Published',
      registration_status: 'Registration Open',
      points: 35,
      qr_code_hash: 'QR-CNHS-SPORTS-2026-BETA',
    },
    {
      id: 'act-03',
      title: 'Robotics Bootcamp: Arduino Microcontrollers & AI Prototyping',
      slug: 'robotics-bootcamp-arduino-ai-prototyping',
      description: 'Hands-on hardware lab where students assemble autonomous obstacle-avoiding rovers and learn sensor integration using Arduino C++ and microcontrollers.',
      category_id: 'cat-03',
      organization_id: 'club-03',
      organizer_id: 'tch-03',
      location: 'CNHS STEM Innovation & Computer Laboratory',
      date: '2026-10-22',
      start_time: '01:00 PM',
      end_time: '05:00 PM',
      registration_deadline: '2026-10-20 23:59:59',
      max_participants: 25,
      current_participants: 22,
      eligibility_grade_levels: JSON.stringify(['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
      required_skills: JSON.stringify(['Arduino C++', 'Problem Solving', 'Circuit Soldering']),
      banner_image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      status: 'Published',
      registration_status: 'Registration Open',
      points: 60,
      qr_code_hash: 'QR-CNHS-ROBOTICS-2026-GAMMA',
    },
    {
      id: 'act-04',
      title: 'Disaster Preparedness, Basic Life Support & First Aid Certification',
      slug: 'disaster-preparedness-first-aid-certification',
      description: 'Standard Red Cross CPR, wound care, and disaster evacuation drills designed to empower student responders during school emergencies.',
      category_id: 'cat-05',
      organization_id: 'club-05',
      organizer_id: 'tch-02',
      location: 'CNHS Gymnasium & Red Cross Station',
      date: '2026-10-25',
      start_time: '08:30 AM',
      end_time: '03:00 PM',
      registration_deadline: '2026-10-23 18:00:00',
      max_participants: 35,
      current_participants: 30,
      eligibility_grade_levels: JSON.stringify(['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
      required_skills: JSON.stringify(['First Aid Basic', 'Discipline']),
      banner_image: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=1200&q=80',
      status: 'Published',
      registration_status: 'Registration Open',
      points: 40,
      qr_code_hash: 'QR-CNHS-RCY-2026-DELTA',
    },
    {
      id: 'act-05',
      title: 'Campus Journalism Invitational: Feature Writing & Digital Publishing',
      slug: 'journalism-invitational-feature-writing-publishing',
      description: 'Masterclass with guest regional journalists focused on investigative reporting, ethics, fact-checking, and digital layout for school publications.',
      category_id: 'cat-06',
      organization_id: 'club-04',
      organizer_id: 'tch-01',
      location: 'CNHS Library & Media Center',
      date: '2026-10-28',
      start_time: '09:00 AM',
      end_time: '02:00 PM',
      registration_deadline: '2026-10-26 12:00:00',
      max_participants: 30,
      current_participants: 19,
      eligibility_grade_levels: JSON.stringify(['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
      required_skills: JSON.stringify(['News Writing', 'Creativity']),
      banner_image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      status: 'Published',
      registration_status: 'Registration Open',
      points: 30,
      qr_code_hash: 'QR-CNHS-ECHO-2026-EPSILON',
    },
    {
      id: 'act-06',
      title: 'Greener Surallah 2026: Community Tree Planting & Watershed Protection',
      slug: 'greener-surallah-tree-planting-watershed',
      description: 'School-wide environmental conservation outreach planting over 500 indigenous seedlings along the surrounding eco-corridor of Surallah.',
      category_id: 'cat-05',
      organization_id: 'club-01',
      organizer_id: 'tch-01',
      location: 'Surallah Eco-Reserve & Community Watershed',
      date: '2026-09-15',
      start_time: '06:30 AM',
      end_time: '12:00 PM',
      registration_deadline: '2026-09-12 17:00:00',
      max_participants: 60,
      current_participants: 58,
      eligibility_grade_levels: JSON.stringify(['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
      required_skills: JSON.stringify(['Community Service', 'Environmental Care']),
      banner_image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
      status: 'Completed',
      registration_status: 'Registration Closed',
      points: 45,
      qr_code_hash: 'QR-CNHS-TREE-2026-ZETA',
    },
    {
      id: 'act-07',
      title: 'Mindanao Heritage Folk Dance Workshop & Cultural Gala Preparation',
      slug: 'mindanao-heritage-folk-dance-workshop',
      description: 'Rehearsal and masterclass exploring traditional dances of Southern Mindanao for upcoming school foundation day and regional festivals.',
      category_id: 'cat-04',
      organization_id: 'club-06',
      organizer_id: 'tch-01',
      location: 'CNHS Performing Arts Center',
      date: '2026-11-04',
      start_time: '03:45 PM',
      end_time: '05:45 PM',
      registration_deadline: '2026-11-01 23:59:59',
      max_participants: 28,
      current_participants: 14,
      eligibility_grade_levels: JSON.stringify(['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
      required_skills: JSON.stringify(['Folk Dance', 'Stage Presence']),
      banner_image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      status: 'Published',
      registration_status: 'Registration Open',
      points: 35,
      qr_code_hash: 'QR-CNHS-ARTS-2026-ETA',
    },
  ];

  for (const a of activities) {
    await db.run(
      `INSERT INTO activities (id, title, slug, description, category_id, organization_id, organizer_id, location, date, start_time, end_time, registration_deadline, max_participants, current_participants, eligibility_grade_levels, required_skills, banner_image, status, registration_status, points, qr_code_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id,
        a.title,
        a.slug,
        a.description,
        a.category_id,
        a.organization_id,
        a.organizer_id,
        a.location,
        a.date,
        a.start_time,
        a.end_time,
        a.registration_deadline,
        a.max_participants,
        a.current_participants,
        a.eligibility_grade_levels,
        a.required_skills,
        a.banner_image,
        a.status,
        a.registration_status,
        a.points,
        a.qr_code_hash,
      ]
    );
  }

  // 9. REGISTRATIONS
  const registrations = [
    {
      id: 'reg-01',
      activity_id: 'act-01',
      student_id: 'std-01', // Angelo Morales
      status: 'Approved',
      registration_date: '2026-10-01 09:15:00',
      review_notes: 'Eligible student with verified leadership interest in SSLG.',
      reviewed_by: 'usr-teacher-01',
      reviewed_at: '2026-10-02 10:00:00',
    },
    {
      id: 'reg-02',
      activity_id: 'act-03',
      student_id: 'std-01', // Angelo Morales
      status: 'Approved',
      registration_date: '2026-10-03 14:20:00',
      review_notes: 'Completed prerequisite science modules.',
      reviewed_by: 'usr-teacher-03',
      reviewed_at: '2026-10-04 11:30:00',
    },
    {
      id: 'reg-03',
      activity_id: 'act-06',
      student_id: 'std-01', // Angelo Morales
      status: 'Completed',
      registration_date: '2026-09-05 08:30:00',
      review_notes: 'Completed full 5 hours tree planting community service.',
      reviewed_by: 'usr-teacher-01',
      reviewed_at: '2026-09-06 09:00:00',
    },
    {
      id: 'reg-04',
      activity_id: 'act-03',
      student_id: 'std-02', // Kristine Alcantara
      status: 'Approved',
      registration_date: '2026-10-02 11:00:00',
      review_notes: 'Advanced STEM student with Python background.',
      reviewed_by: 'usr-teacher-03',
      reviewed_at: '2026-10-03 09:15:00',
    },
    {
      id: 'reg-05',
      activity_id: 'act-05',
      student_id: 'std-02', // Kristine Alcantara
      status: 'Approved',
      registration_date: '2026-10-04 15:00:00',
      review_notes: 'Approved for science reporting section.',
      reviewed_by: 'usr-teacher-01',
      reviewed_at: '2026-10-05 10:30:00',
    },
    {
      id: 'reg-06',
      activity_id: 'act-02',
      student_id: 'std-03', // John Patrick Fernandez
      status: 'Approved',
      registration_date: '2026-10-01 16:00:00',
      review_notes: 'Varsity trainee candidate for basketball team.',
      reviewed_by: 'usr-teacher-02',
      reviewed_at: '2026-10-02 08:30:00',
    },
    {
      id: 'reg-07',
      activity_id: 'act-06',
      student_id: 'std-03', // John Patrick Fernandez
      status: 'Completed',
      registration_date: '2026-09-06 13:00:00',
      review_notes: 'Excellent volunteer effort on planting day.',
      reviewed_by: 'usr-teacher-01',
      reviewed_at: '2026-09-07 14:00:00',
    },
    {
      id: 'reg-08',
      activity_id: 'act-07',
      student_id: 'std-04', // Sofia Ramos
      status: 'Approved',
      registration_date: '2026-10-02 10:30:00',
      review_notes: 'Lead folk dancer for Foundation Day.',
      reviewed_by: 'usr-teacher-01',
      reviewed_at: '2026-10-03 14:00:00',
    },
    {
      id: 'reg-09',
      activity_id: 'act-04',
      student_id: 'std-01', // Angelo Morales
      status: 'Pending',
      registration_date: '2026-10-05 16:45:00',
      review_notes: null,
      reviewed_by: null,
      reviewed_at: null,
    },
  ];

  for (const r of registrations) {
    await db.run(
      `INSERT INTO registrations (id, activity_id, student_id, status, registration_date, review_notes, reviewed_by, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.activity_id, r.student_id, r.status, r.registration_date, r.review_notes, r.reviewed_by, r.reviewed_at]
    );
  }

  // 10. ATTENDANCE SESSIONS & RECORDS
  const sessions = [
    {
      id: 'ses-01',
      activity_id: 'act-06',
      session_title: 'Greener Surallah Morning Field Assembly',
      session_date: '2026-09-15',
      start_time: '06:30 AM',
      end_time: '12:00 PM',
      qr_code_token: 'SES-QR-TREE-001',
      qr_expires_at: '2026-09-15 13:00:00',
      created_by: 'usr-teacher-01',
    },
    {
      id: 'ses-02',
      activity_id: 'act-01',
      session_title: 'Day 1: Parliamentary Procedures & Keynote',
      session_date: '2026-10-14',
      start_time: '08:00 AM',
      end_time: '12:00 PM',
      qr_code_token: 'SES-QR-SUMMIT-DAY1',
      qr_expires_at: '2026-10-14 13:00:00',
      created_by: 'usr-teacher-01',
    },
  ];

  for (const ses of sessions) {
    await db.run(
      `INSERT INTO attendance_sessions (id, activity_id, session_title, session_date, start_time, end_time, qr_code_token, qr_expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ses.id, ses.activity_id, ses.session_title, ses.session_date, ses.start_time, ses.end_time, ses.qr_code_token, ses.qr_expires_at, ses.created_by]
    );
  }

  const attendanceRecords = [
    {
      id: 'att-01',
      session_id: 'ses-01',
      activity_id: 'act-06',
      student_id: 'std-01', // Angelo Morales
      status: 'Present',
      check_in_time: '2026-09-15 06:45:00',
      check_in_method: 'qr_scan',
      notes: 'Punctual, planted 12 hardwood saplings.',
      recorded_by: 'usr-teacher-01',
    },
    {
      id: 'att-02',
      session_id: 'ses-01',
      activity_id: 'act-06',
      student_id: 'std-03', // John Patrick Fernandez
      status: 'Present',
      check_in_time: '2026-09-15 06:50:00',
      check_in_method: 'manual',
      notes: 'Assisted with logistics and tool transport.',
      recorded_by: 'usr-teacher-01',
    },
  ];

  for (const ar of attendanceRecords) {
    await db.run(
      `INSERT INTO attendance_records (id, session_id, activity_id, student_id, status, check_in_time, check_in_method, notes, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ar.id, ar.session_id, ar.activity_id, ar.student_id, ar.status, ar.check_in_time, ar.check_in_method, ar.notes, ar.recorded_by]
    );
  }

  // 11. PARTICIPATION RECORDS
  const participationRecords = [
    {
      id: 'pr-01',
      student_id: 'std-01',
      activity_id: 'act-06',
      role: 'Student Volunteer Group Leader',
      hours_spent: 5.5,
      performance_rating: 4.9,
      feedback: 'Angelo exhibited outstanding leadership organizing Section Rizal participants during the tree planting drive.',
      completion_status: 'Completed',
    },
    {
      id: 'pr-02',
      student_id: 'std-03',
      activity_id: 'act-06',
      role: 'Logistics Volunteer',
      hours_spent: 5.0,
      performance_rating: 4.6,
      feedback: 'Very dependable during equipment staging and water distribution.',
      completion_status: 'Completed',
    },
  ];

  for (const pr of participationRecords) {
    await db.run(
      `INSERT INTO participation_records (id, student_id, activity_id, role, hours_spent, performance_rating, feedback, completion_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pr.id, pr.student_id, pr.activity_id, pr.role, pr.hours_spent, pr.performance_rating, pr.feedback, pr.completion_status]
    );
  }

  // 12. BADGES
  const badges = [
    {
      id: 'bdg-01',
      name: 'Active Participant',
      slug: 'active-participant',
      description: 'Actively registered, participated, and completed at least 3 school extracurricular activities.',
      icon_name: 'Medal',
      color: '#CD7F32', // Bronze
      tier: 'Bronze',
      criteria: 'Complete 3 sanctioned extracurricular activities.',
    },
    {
      id: 'bdg-02',
      name: 'Outstanding Leader',
      slug: 'outstanding-leader',
      description: 'Demonstrated exemplary servant leadership in student governance or activity facilitation.',
      icon_name: 'Trophy',
      color: '#F59E0B', // Gold
      tier: 'Gold',
      criteria: 'Lead an organization project or receive teacher leadership commendation.',
    },
    {
      id: 'bdg-03',
      name: 'Consistent Participant',
      slug: 'consistent-participant',
      description: 'Maintained 90% or higher attendance across all activity sessions.',
      icon_name: 'Star',
      color: '#94A3B8', // Silver
      tier: 'Silver',
      criteria: 'Maintain 90% attendance across extracurricular activities.',
    },
    {
      id: 'bdg-04',
      name: 'Goal Achiever',
      slug: 'goal-achiever',
      description: 'Successfully reached 5 milestones and collected official skill validations.',
      icon_name: 'Target',
      color: '#10B981', // Emerald / Platinum
      tier: 'Platinum',
      criteria: 'Complete 5 student development milestones.',
    },
    {
      id: 'bdg-05',
      name: 'Team Player',
      slug: 'team-player',
      description: 'Exemplified cooperation, mutual respect, and collaborative spirit in group events.',
      icon_name: 'Handshake',
      color: '#3B82F6', // Blue
      tier: 'Bronze',
      criteria: 'Contribute positively in team athletics or collaborative projects.',
    },
    {
      id: 'bdg-06',
      name: 'Innovation & Tech Pioneer',
      slug: 'innovation-pioneer',
      description: 'Created or contributed to innovative technological solutions, robotics, or STEM research.',
      icon_name: 'Lightbulb',
      color: '#8B5CF6', // Purple / Gold
      tier: 'Gold',
      criteria: 'Present a working project in the STEM & Robotics exhibition.',
    },
    {
      id: 'bdg-07',
      name: 'Community Builder',
      slug: 'community-builder',
      description: 'Completed 15+ hours of community service and civic outreach in Surallah.',
      icon_name: 'Sprout',
      color: '#059669', // Green / Silver
      tier: 'Silver',
      criteria: 'Accumulate at least 15 verified community service hours.',
    },
    {
      id: 'bdg-08',
      name: 'First Step Pioneer',
      slug: 'first-step-pioneer',
      description: 'Took the initiative to register and attend your first high school extracurricular activity.',
      icon_name: 'Compass',
      color: '#EC4899', // Pink
      tier: 'Bronze',
      criteria: 'Register and check in to your first extracurricular activity.',
    },
  ];

  for (const b of badges) {
    await db.run(
      `INSERT INTO badges (id, name, slug, description, icon_name, color, tier, criteria)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.id, b.name, b.slug, b.description, b.icon_name, b.color, b.tier, b.criteria]
    );
  }

  // 13. STUDENT BADGES
  const studentBadges = [
    {
      id: 'sb-01',
      student_id: 'std-01', // Angelo Morales
      badge_id: 'bdg-08', // First Step Pioneer
      activity_id: 'act-06',
      earned_at: '2026-09-15 12:30:00',
      awarded_by: 'usr-teacher-01',
      is_celebrated: 1,
    },
    {
      id: 'sb-02',
      student_id: 'std-01', // Angelo Morales
      badge_id: 'bdg-07', // Community Builder
      activity_id: 'act-06',
      earned_at: '2026-09-16 10:00:00',
      awarded_by: 'usr-teacher-01',
      is_celebrated: 1,
    },
    {
      id: 'sb-03',
      student_id: 'std-01', // Angelo Morales
      badge_id: 'bdg-03', // Consistent Participant
      activity_id: null,
      earned_at: '2026-09-20 14:00:00',
      awarded_by: 'usr-admin-01',
      is_celebrated: 0, // Pending celebration animation in student portal!
    },
    {
      id: 'sb-04',
      student_id: 'std-02', // Kristine Alcantara
      badge_id: 'bdg-06', // Innovation Pioneer
      activity_id: 'act-03',
      earned_at: '2026-09-18 16:00:00',
      awarded_by: 'usr-teacher-03',
      is_celebrated: 1,
    },
    {
      id: 'sb-05',
      student_id: 'std-03', // John Patrick Fernandez
      badge_id: 'bdg-08', // First Step Pioneer
      activity_id: 'act-06',
      earned_at: '2026-09-15 12:30:00',
      awarded_by: 'usr-teacher-01',
      is_celebrated: 1,
    },
  ];

  for (const sb of studentBadges) {
    await db.run(
      `INSERT INTO student_badges (id, student_id, badge_id, activity_id, earned_at, awarded_by, is_celebrated)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sb.id, sb.student_id, sb.badge_id, sb.activity_id, sb.earned_at, sb.awarded_by, sb.is_celebrated]
    );
  }

  // 14. ACHIEVEMENTS
  const achievements = [
    {
      id: 'ach-01',
      title: 'First Activity Joined',
      description: 'Successfully enrolled and engaged in a Centrala National High School extracurricular event.',
      category: 'Milestone',
      icon: 'Flag',
      criteria: 'Register for 1 extracurricular activity.',
      points: 25,
      badge_id: 'bdg-08',
    },
    {
      id: 'ach-02',
      title: 'Green Surallah Eco Champion',
      description: 'Contributed directly to environmental sustainability by planting native trees in Surallah.',
      category: 'Community Service',
      icon: 'TreePine',
      criteria: 'Participate in the Surallah Watershed Clean-up and Tree Planting drive.',
      points: 50,
      badge_id: 'bdg-07',
    },
    {
      id: 'ach-03',
      title: 'SSLG Leadership Honor',
      description: 'Recognized for proactive initiative in student parliamentary simulations.',
      category: 'Leadership',
      icon: 'Award',
      criteria: 'Complete the Annual Youth Leadership Summit.',
      points: 75,
      badge_id: 'bdg-02',
    },
    {
      id: 'ach-04',
      title: 'Robotics Innovator of the Term',
      description: 'Engineered an operational sensor-guided prototype at the STEM Innovation Lab.',
      category: 'STEM',
      icon: 'Sparkles',
      criteria: 'Successfully program and test an Arduino microcontroller module.',
      points: 100,
      badge_id: 'bdg-06',
    },
    {
      id: 'ach-05',
      title: 'Perfect Attendance Commendation',
      description: 'Achieved 100% attendance across four consecutive activity sessions without absence or tardiness.',
      category: 'Dedication',
      icon: 'CheckCircle2',
      criteria: 'Zero absences across scheduled sessions.',
      points: 60,
      badge_id: 'bdg-03',
    },
  ];

  for (const ach of achievements) {
    await db.run(
      `INSERT INTO achievements (id, title, description, category, icon, criteria, points, badge_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ach.id, ach.title, ach.description, ach.category, ach.icon, ach.criteria, ach.points, ach.badge_id]
    );
  }

  // 15. STUDENT ACHIEVEMENTS
  const studentAchievements = [
    {
      id: 'sa-01',
      student_id: 'std-01', // Angelo Morales
      achievement_id: 'ach-01',
      activity_id: 'act-06',
      awarded_by: 'usr-teacher-01',
      awarded_at: '2026-09-15 12:45:00',
      notes: 'Initial extracurricular activity completed with distinction.',
      is_celebrated: 1,
    },
    {
      id: 'sa-02',
      student_id: 'std-01', // Angelo Morales
      achievement_id: 'ach-02',
      activity_id: 'act-06',
      awarded_by: 'usr-teacher-01',
      awarded_at: '2026-09-16 11:00:00',
      notes: 'Planted 12 trees with Grade 10 team.',
      is_celebrated: 1,
    },
    {
      id: 'sa-03',
      student_id: 'std-02', // Kristine Alcantara
      achievement_id: 'ach-04',
      activity_id: 'act-03',
      awarded_by: 'usr-teacher-03',
      awarded_at: '2026-09-18 16:30:00',
      notes: 'Built line-following robot demonstration.',
      is_celebrated: 1,
    },
  ];

  for (const sa of studentAchievements) {
    await db.run(
      `INSERT INTO student_achievements (id, student_id, achievement_id, activity_id, awarded_by, awarded_at, notes, is_celebrated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [sa.id, sa.student_id, sa.achievement_id, sa.activity_id, sa.awarded_by, sa.awarded_at, sa.notes, sa.is_celebrated]
    );
  }

  // 16. MILESTONES
  const milestones = [
    {
      id: 'mls-01',
      title: 'Joined First Activity',
      description: 'Begin your high school extracurricular journey at Centrala National High School.',
      category: 'Participation',
      target_value: 1,
      target_metric: 'activities_joined',
      badge_id: 'bdg-08',
      order_index: 1,
    },
    {
      id: 'mls-02',
      title: 'Completed 3 Activities',
      description: 'Expand your experience across multiple clubs and school societies.',
      category: 'Participation',
      target_value: 3,
      target_metric: 'activities_joined',
      badge_id: 'bdg-01',
      order_index: 2,
    },
    {
      id: 'mls-03',
      title: 'Reached 90% Attendance Rate',
      description: 'Demonstrate reliability, punctuality, and commitment in every session.',
      category: 'Attendance',
      target_value: 90,
      target_metric: 'attendance_rate',
      badge_id: 'bdg-03',
      order_index: 3,
    },
    {
      id: 'mls-04',
      title: 'Earned First Official Certificate',
      description: 'Receive verified digital credentials recognized by CNHS administration.',
      category: 'Accreditation',
      target_value: 1,
      target_metric: 'certificates_earned',
      badge_id: 'bdg-04',
      order_index: 4,
    },
    {
      id: 'mls-05',
      title: 'Earned 5 Badges Collection',
      description: 'Achieve versatile excellence spanning leadership, academics, sports, and culture.',
      category: 'Honor',
      target_value: 5,
      target_metric: 'badges_earned',
      badge_id: 'bdg-04',
      order_index: 5,
    },
  ];

  for (const m of milestones) {
    await db.run(
      `INSERT INTO milestones (id, title, description, category, target_value, target_metric, badge_id, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.title, m.description, m.category, m.target_value, m.target_metric, m.badge_id, m.order_index]
    );
  }

  // 17. STUDENT MILESTONES
  const studentMilestones = [
    {
      id: 'sm-01',
      student_id: 'std-01', // Angelo Morales
      milestone_id: 'mls-01',
      current_value: 1,
      is_completed: 1,
      completed_at: '2026-09-15 12:00:00',
    },
    {
      id: 'sm-02',
      student_id: 'std-01',
      milestone_id: 'mls-02',
      current_value: 2, // 2 completed / registered
      is_completed: 0,
      completed_at: null,
    },
    {
      id: 'sm-03',
      student_id: 'std-01',
      milestone_id: 'mls-03',
      current_value: 94,
      is_completed: 1,
      completed_at: '2026-09-20 14:00:00',
    },
    {
      id: 'sm-04',
      student_id: 'std-01',
      milestone_id: 'mls-04',
      current_value: 1,
      is_completed: 1,
      completed_at: '2026-09-16 15:00:00',
    },
    {
      id: 'sm-05',
      student_id: 'std-01',
      milestone_id: 'mls-05',
      current_value: 3,
      is_completed: 0,
      completed_at: null,
    },
  ];

  for (const sm of studentMilestones) {
    await db.run(
      `INSERT INTO student_milestones (id, student_id, milestone_id, current_value, is_completed, completed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sm.id, sm.student_id, sm.milestone_id, sm.current_value, sm.is_completed, sm.completed_at]
    );
  }

  // 18. CERTIFICATES
  const certificates = [
    {
      id: 'cert-01',
      student_id: 'std-01', // Angelo Morales
      activity_id: 'act-06',
      title: 'Certificate of Environmental Commendation - Greener Surallah 2026',
      description: 'Awarded for meritorious volunteer service planting over 500 indigenous seedlings at the Surallah Watershed Eco-Reserve.',
      certificate_number: 'CNHS-ECO-2026-0042',
      file_url: 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?auto=format&fit=crop&w=1200&q=80',
      file_size: '1.2 MB',
      issue_date: '2026-09-16',
      issued_by: 'usr-teacher-01',
      template_id: 'cnhs-gold-standard-v1',
      status: 'VERIFIED',
    },
    {
      id: 'cert-02',
      student_id: 'std-02', // Kristine Alcantara
      activity_id: 'act-03',
      title: 'Certificate of Technological Merit - STEM Robotics Pioneer',
      description: 'Conferred for successfully programming and exhibiting an autonomous microcontroller obstacle rover during the CNHS Science Fair.',
      certificate_number: 'CNHS-STEM-2026-0089',
      file_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
      file_size: '1.4 MB',
      issue_date: '2026-09-19',
      issued_by: 'usr-teacher-03',
      template_id: 'cnhs-gold-standard-v1',
      status: 'VERIFIED',
    },
    {
      id: 'cert-03',
      student_id: 'std-03', // John Patrick Fernandez
      activity_id: 'act-06',
      title: 'Certificate of Environmental Commendation - Greener Surallah 2026',
      description: 'Awarded for volunteer assistance and dedication during the 2026 community watershed preservation campaign.',
      certificate_number: 'CNHS-ECO-2026-0043',
      file_url: 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?auto=format&fit=crop&w=1200&q=80',
      file_size: '1.1 MB',
      issue_date: '2026-09-16',
      issued_by: 'usr-teacher-01',
      template_id: 'cnhs-gold-standard-v1',
      status: 'VERIFIED',
    },
  ];

  for (const cr of certificates) {
    await db.run(
      `INSERT INTO certificates (id, student_id, activity_id, title, description, certificate_number, file_url, file_size, issue_date, issued_by, template_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cr.id, cr.student_id, cr.activity_id, cr.title, cr.description, cr.certificate_number, cr.file_url, cr.file_size, cr.issue_date, cr.issued_by, cr.template_id, cr.status]
    );
  }

  // 19. ANNOUNCEMENTS
  const announcements = [
    {
      id: 'anc-01',
      title: 'Welcome to Centrala National High School Extracurricular Season 2026-2027!',
      content: 'We warmly welcome all Junior and Senior High School students of Centrala National High School to explore our newly upgraded digital extracurricular platform. Discover clubs, join activities, build your digital portfolio, and represent Surallah with pride!',
      image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
      activity_id: null,
      author_id: 'usr-admin-01',
      target_audience: 'All',
      target_grade_level: null,
      is_pinned: 1,
      publish_date: '2026-09-28 08:00:00',
    },
    {
      id: 'anc-02',
      title: 'Official Call for Delegates: Annual Youth Leadership Summit 2026',
      content: 'SSLG is accepting delegate applications for Grade 8 to Grade 12 students. Enhance your debate, resolution formulation, and community organizing skills. Limited slots available.',
      image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      activity_id: 'act-01',
      author_id: 'usr-teacher-01',
      target_audience: 'Students',
      target_grade_level: null,
      is_pinned: 1,
      publish_date: '2026-10-01 09:00:00',
    },
    {
      id: 'anc-03',
      title: 'Robotics Bootcamp Orientation & Kit Distribution Reminder',
      content: 'All confirmed participants for the Arduino & AI Prototyping Workshop are requested to attend the pre-bootcamp briefing this Friday at the STEM Innovation Lab. Bring your personal laptops if available.',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      activity_id: 'act-03',
      author_id: 'usr-teacher-03',
      target_audience: 'Students',
      target_grade_level: null,
      is_pinned: 0,
      publish_date: '2026-10-03 14:00:00',
    },
  ];

  for (const an of announcements) {
    await db.run(
      `INSERT INTO announcements (id, title, content, image_url, activity_id, author_id, target_audience, target_grade_level, is_pinned, publish_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [an.id, an.title, an.content, an.image_url, an.activity_id, an.author_id, an.target_audience, an.target_grade_level, an.is_pinned, an.publish_date]
    );
  }

  // 20. NOTIFICATIONS
  const notifications = [
    {
      id: 'notif-01',
      user_id: 'usr-student-01', // Angelo Morales
      title: 'Registration Approved 🎉',
      message: 'Your registration for "Annual Youth Leadership Summit & Parliamentary Simulation 2026" has been approved by Adviser Maria Santos.',
      type: 'registration',
      link: '/student/my-activities',
      is_read: 0,
    },
    {
      id: 'notif-02',
      user_id: 'usr-student-01',
      title: 'New Badge Commendation ⭐',
      message: 'Congratulations! You unlocked the "Consistent Participant" badge for maintaining a 94.5% extracurricular attendance rate.',
      type: 'badge',
      link: '/student/badges',
      is_read: 0,
    },
    {
      id: 'notif-03',
      user_id: 'usr-student-01',
      title: 'Verified Certificate Uploaded 📜',
      message: 'Your official certificate for "Greener Surallah 2026" has been verified and added to your Digital Portfolio.',
      type: 'certificate',
      link: '/student/certificates',
      is_read: 1,
    },
    {
      id: 'notif-04',
      user_id: 'usr-teacher-01', // Maria Santos
      title: 'New Activity Registration',
      message: 'Angelo Morales submitted a registration request for "Disaster Preparedness & First Aid Certification".',
      type: 'registration',
      link: '/teacher/registrations',
      is_read: 0,
    },
    {
      id: 'notif-05',
      user_id: 'usr-admin-01',
      title: 'System Security & Activity Health Good',
      message: 'All system services and automated backup checks for CNHS Extracurricular platform completed successfully.',
      type: 'system',
      link: '/admin/audit-logs',
      is_read: 1,
    },
  ];

  for (const n of notifications) {
    await db.run(
      `INSERT INTO notifications (id, user_id, title, message, type, link, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [n.id, n.user_id, n.title, n.message, n.type, n.link, n.is_read]
    );
  }

  // 21. AUDIT LOGS
  const auditLogs = [
    {
      id: 'aud-01',
      user_id: 'usr-admin-01',
      action: 'SYSTEM_INITIALIZATION',
      entity_type: 'SYSTEM',
      entity_id: 'cnhs-system',
      old_data: null,
      new_data: JSON.stringify({ version: '1.0.0', institution: 'Centrala National High School, Surallah' }),
      ip_address: '127.0.0.1',
      user_agent: 'CNHS Admin Console v1',
    },
    {
      id: 'aud-02',
      user_id: 'usr-teacher-01',
      action: 'ACTIVITY_PUBLISHED',
      entity_type: 'ACTIVITY',
      entity_id: 'act-01',
      old_data: null,
      new_data: JSON.stringify({ title: 'Annual Youth Leadership Summit 2026', capacity: 40 }),
      ip_address: '192.168.1.45',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      id: 'aud-03',
      user_id: 'usr-teacher-01',
      action: 'REGISTRATION_APPROVED',
      entity_type: 'REGISTRATION',
      entity_id: 'reg-01',
      old_data: JSON.stringify({ status: 'Pending' }),
      new_data: JSON.stringify({ status: 'Approved', student: 'Angelo Morales' }),
      ip_address: '192.168.1.45',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      id: 'aud-04',
      user_id: 'usr-teacher-01',
      action: 'CERTIFICATE_ISSUED',
      entity_type: 'CERTIFICATE',
      entity_id: 'cert-01',
      old_data: null,
      new_data: JSON.stringify({ certificate_number: 'CNHS-ECO-2026-0042', recipient: 'Angelo Morales' }),
      ip_address: '192.168.1.45',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  ];

  for (const al of auditLogs) {
    await db.run(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [al.id, al.user_id, al.action, al.entity_type, al.entity_id, al.old_data, al.new_data, al.ip_address, al.user_agent]
    );
  }

  // 22. SYSTEM SETTINGS
  const settings = [
    { key: 'school_name', value: 'Centrala National High School', desc: 'Official institution name' },
    { key: 'school_location', value: 'Surallah, South Cotabato, Region XII', desc: 'Geographic location and school division' },
    { key: 'academic_year', value: '2026-2027', desc: 'Active school academic year' },
    { key: 'current_semester', value: 'First Semester', desc: 'Active semester term' },
    { key: 'max_activities_per_student', value: '5', desc: 'Maximum concurrent active registrations allowed per student' },
    { key: 'attendance_min_percentage', value: '80', desc: 'Minimum attendance percentage required for certificate issuance' },
    { key: 'qr_attendance_window_minutes', value: '45', desc: 'Time window allowed for student QR check-in scan' },
  ];

  for (const st of settings) {
    await db.run(
      `INSERT INTO system_settings (id, setting_key, setting_value, description, updated_by)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), st.key, st.value, st.desc, 'usr-admin-01']
    );
  }

  console.log('✅ [Seeder] Database seeding completed successfully with authentic CNHS data!');
}

// Allow direct execution via CLI `tsx src/database/seed.ts`
if (require.main === module) {
  runSeeder()
    .then(() => {
      console.log('Seed finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
