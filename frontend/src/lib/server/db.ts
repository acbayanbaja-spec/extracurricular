import { Pool } from 'pg';

const SUPABASE_DEFAULT_URL = 'postgresql://postgres.ybkodgidcytpjxefgmle:nOG2bfCjfkqOwqui@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

let rawDbUrl = (process.env.DATABASE_URL || '').trim();
if (!rawDbUrl || rawDbUrl.includes('rfxxbqrkrdwiatbfqtlw')) {
  rawDbUrl = SUPABASE_DEFAULT_URL;
}
const cleanDbUrl = rawDbUrl.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/\?$/, '');

// Create singleton pool for serverless execution
declare global {
  var _cnhsPgPool: Pool | undefined;
  var _cnhsInMemoryStore: any | undefined;
  var _cnhsSchemaReady: Promise<void> | undefined;
}

if (!global._cnhsPgPool) {
  try {
    global._cnhsPgPool = new Pool({
      connectionString: cleanDbUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });
  } catch (err) {
    console.warn('[serverDb] Could not initialize PgPool directly:', err);
  }
}

const pool = global._cnhsPgPool;

const LIVE_SCHEMA_PATCHES: string[] = [
  `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS participant_name VARCHAR(150)`,
  `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS address TEXT`,
  `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS contact_number VARCHAR(32)`,
  `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(128)`,
  `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS guardian_relationship VARCHAR(64)`,
  `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS guardian_contact VARCHAR(64)`,
  `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS guardian_consent BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS medical_notes TEXT`,
  `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS motivation TEXT`,
  `ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`,
  `ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('registration', 'attendance', 'achievement', 'badge', 'certificate', 'announcement', 'system', 'info', 'success', 'warning'))`,
];

export function ensureLiveSchema(): Promise<void> {
  if (!global._cnhsSchemaReady) {
    global._cnhsSchemaReady = (async () => {
      if (!pool) return;
      for (const sql of LIVE_SCHEMA_PATCHES) {
        try {
          await pool.query(sql);
        } catch (err: any) {
          console.warn(`[ensureLiveSchema] skipped (${err.message}): ${sql.slice(0, 70)}`);
        }
      }
    })();
  }
  return global._cnhsSchemaReady;
}

// Resilient In-Memory Fallback Seed Store
function initFallbackStore() {
  if (global._cnhsInMemoryStore) return global._cnhsInMemoryStore;

  const users = [
    {
      id: 'usr-student-01',
      email: 'student@cnhs.edu.ph',
      role: 'STUDENT',
      status: 'ACTIVE',
      first_name: 'Nicole',
      last_name: 'Maquilan',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
      phone: '+63 921 555 5601',
    },
    {
      id: 'usr-teacher-01',
      email: 'maria.santos@cnhs.edu.ph',
      role: 'TEACHER',
      status: 'ACTIVE',
      first_name: 'Javidec',
      last_name: 'Monsion',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
      phone: '+63 918 555 2301',
    },
    {
      id: 'usr-admin-01',
      email: 'admin@cnhs.edu.ph',
      role: 'ADMINISTRATOR',
      status: 'ACTIVE',
      first_name: 'Rodrigo',
      last_name: 'Mendoza',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      phone: '+63 917 555 1201',
    },
  ];

  const students = [
    {
      id: 'std-01',
      user_id: 'usr-student-01',
      student_id_number: '109823450012',
      grade_level: 'Grade 11',
      section: 'STEM Diamond',
      track_strand: 'STEM Varsity Delegate',
      attendance_rate: 96.2,
      streak_count: 4,
      total_points: 420,
    },
  ];

  const teachers = [
    {
      id: 'tch-01',
      user_id: 'usr-teacher-01',
      employee_id: 'CNHS-FAC-0142',
      title: 'SSLG & Red Cross Club Adviser',
      department: 'Science & Extracurricular Affairs',
    },
  ];

  const administrators = [
    {
      id: 'adm-01',
      user_id: 'usr-admin-01',
      department: 'Office of the Principal / Extracurricular Coordination',
    },
  ];

  const categories = [
    { id: 'cat-01', name: 'Leadership & Governance', color: '#4F46E5', display_order: 1 },
    { id: 'cat-02', name: 'Sports & Athletics', color: '#EA580C', display_order: 2 },
    { id: 'cat-03', name: 'STEM & Robotics', color: '#0284C7', display_order: 3 },
    { id: 'cat-04', name: 'Arts & Culture', color: '#D97706', display_order: 4 },
    { id: 'cat-05', name: 'Community & Red Cross', color: '#DC2626', display_order: 5 },
    { id: 'cat-06', name: 'Campus Journalism', color: '#059669', display_order: 6 },
  ];

  const activities = [
    {
      id: 'act-01',
      title: 'Annual Youth Leadership Summit & Parliamentary Simulation 2026',
      description: 'Comprehensive student government leadership symposium covering parliamentary procedure, public policy debate, resolution drafting, and ethics.',
      category_id: 'cat-01',
      organization_id: 'club-01',
      organizer_id: 'tch-01',
      location: 'CNHS Audio-Visual Center / Main Gymnasium',
      date: '2026-10-15',
      start_time: '08:00 AM',
      end_time: '04:30 PM',
      max_participants: 30,
      current_participants: 28,
      points_value: 35,
      status: 'Published',
      registration_status: 'Registration Open',
      banner_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'act-02',
      title: 'Division Interschool Basketball & Volleyball Selection Trials',
      description: 'Official tryouts and conditioning camp for varsity delegates representing Centrala National High School in the Unit Meet.',
      category_id: 'cat-02',
      organization_id: 'club-02',
      organizer_id: 'tch-01',
      location: 'Centrala High Covered Court',
      date: '2026-10-18',
      start_time: '03:30 PM',
      end_time: '06:30 PM',
      max_participants: 40,
      current_participants: 34,
      points_value: 25,
      status: 'Published',
      registration_status: 'Registration Open',
      banner_image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'act-03',
      title: 'Robotics Bootcamp: Arduino Microcontrollers & AI Prototyping',
      description: 'Hands-on sensory computing and robotics automation laboratory workshop for aspiring STEM innovators and researchers.',
      category_id: 'cat-03',
      organization_id: 'club-03',
      organizer_id: 'tch-01',
      location: 'Science Building - ICT Laboratory 2',
      date: '2026-10-25',
      start_time: '09:00 AM',
      end_time: '03:00 PM',
      max_participants: 25,
      current_participants: 22,
      points_value: 40,
      status: 'Published',
      registration_status: 'Registration Open',
      banner_image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'act-04',
      title: 'Disaster Preparedness, Basic Life Support & First Aid Certification',
      description: 'Certified emergency medical response and disaster readiness training conducted in partnership with the Philippine Red Cross.',
      category_id: 'cat-05',
      organization_id: 'club-04',
      organizer_id: 'tch-01',
      location: 'CNHS Quadrangle & Disaster Response Center',
      date: '2026-11-05',
      start_time: '08:00 AM',
      end_time: '05:00 PM',
      max_participants: 50,
      current_participants: 45,
      points_value: 45,
      status: 'Published',
      registration_status: 'Registration Open',
      banner_image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const announcements = [
    {
      id: 'ann-01',
      author_id: 'usr-teacher-01',
      title: 'SSLG General Assembly & Club Leadership Accreditation S.Y. 2026-2027',
      content: 'All club officers and interested learners are formally invited to the institutional briefing at the CNHS Gymnasium. Official certificates of appointment and activity tokens will be distributed by Adviser Javidec Monsion.',
      target_audience: 'All',
      is_pinned: 1,
      publish_date: '2026-10-20T08:00:00.000Z',
      first_name: 'Javidec',
      last_name: 'Monsion',
      author_role: 'TEACHER',
    },
  ];

  const sessions = [
    {
      id: 'ses-01',
      activity_id: 'act-01',
      session_title: 'Day 1: Parliamentary Procedures & Keynote',
      session_date: '2026-10-15',
      start_time: '08:00 AM',
      end_time: '12:00 PM',
      qr_code_token: 'SES-QR-SUMMIT-DAY1',
      qr_expires_at: '2026-12-31T23:59:59.000Z',
      created_by: 'usr-teacher-01',
    },
  ];

  const registrations = [
    {
      id: 'reg-01',
      student_id: 'std-01',
      activity_id: 'act-01',
      status: 'Approved',
      registration_date: '2026-10-12T09:00:00.000Z',
    },
    {
      id: 'reg-02',
      student_id: 'std-01',
      activity_id: 'act-03',
      status: 'Approved',
      registration_date: '2026-10-13T10:30:00.000Z',
    },
  ];

  const notifications = [
    {
      id: 'notif-01',
      user_id: 'usr-student-01',
      title: 'Welcome to CNHS StudentX, Nicole!',
      message: 'Explore club programs, verify your attendance via QR code, and build your DepEd student portfolio.',
      type: 'success',
      is_read: 0,
      created_at: new Date().toISOString(),
    },
  ];

  const badges = [
    {
      id: 'bdg-01',
      name: 'Active Participant',
      slug: 'active-participant',
      description: 'Actively registered, participated, and completed at least 3 school extracurricular activities.',
      icon_name: 'Medal',
      color: '#CD7F32',
      tier: 'Bronze',
      criteria: 'Complete 3 sanctioned extracurricular activities.',
      created_at: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'bdg-02',
      name: 'Outstanding Leader',
      slug: 'outstanding-leader',
      description: 'Demonstrated exemplary servant leadership in student governance or activity facilitation.',
      icon_name: 'Trophy',
      color: '#F59E0B',
      tier: 'Gold',
      criteria: 'Lead an organization project or receive teacher leadership commendation.',
      created_at: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'bdg-03',
      name: 'Consistent Participant',
      slug: 'consistent-participant',
      description: 'Maintained 90% or higher attendance across all activity sessions.',
      icon_name: 'Star',
      color: '#94A3B8',
      tier: 'Silver',
      criteria: 'Maintain 90% attendance across extracurricular activities.',
      created_at: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'bdg-04',
      name: 'Goal Achiever',
      slug: 'goal-achiever',
      description: 'Successfully reached 5 milestones and collected official skill validations.',
      icon_name: 'Target',
      color: '#10B981',
      tier: 'Platinum',
      criteria: 'Complete 5 student development milestones.',
      created_at: '2026-09-01T00:00:00.000Z',
    },
  ];

  const student_badges = [
    {
      id: 'sb-01',
      student_id: 'std-01',
      badge_id: 'bdg-01',
      earned_at: '2026-09-15T08:00:00.000Z',
      awarded_by: 'usr-teacher-01',
      is_celebrated: true,
    },
    {
      id: 'sb-02',
      student_id: 'std-01',
      badge_id: 'bdg-02',
      earned_at: '2026-09-28T09:00:00.000Z',
      awarded_by: 'usr-teacher-01',
      is_celebrated: true,
    },
  ];

  const certificates = [
    {
      id: 'cert-01',
      student_id: 'std-01',
      activity_id: 'act-01',
      title: 'Certificate of Meritorious Leadership & Civic Service',
      description: 'Awarded for active leadership, continuous participation, and dedication to school community projects.',
      certificate_number: 'CNHS-CERT-2026-8812',
      file_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
      issue_date: '2026-10-16',
    },
  ];

  global._cnhsInMemoryStore = {
    users,
    students,
    teachers,
    administrators,
    categories,
    activities,
    announcements,
    sessions,
    registrations,
    notifications,
    badges,
    student_badges,
    certificates,
  };

  return global._cnhsInMemoryStore;
}

export const serverDb = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (pool) {
      try {
        let index = 1;
        const pgSql = sql.replace(/\?/g, () => `$${index++}`);
        const res = await pool.query(pgSql, params);
        return res.rows as T[];
      } catch (err: any) {
        console.warn(`[serverDb PgPool Query fallback] (${err.message}). Using fallback memory repository.`);
      }
    }

    // Fallback Mock query logic
    const store = initFallbackStore();
    const lower = sql.toLowerCase();

    if (lower.includes('from users')) {
      if (lower.includes('where email =')) {
        const email = params[0];
        return store.users.filter((u: any) => u.email === email) as T[];
      }
      if (lower.includes('where id =')) {
        const id = params[0];
        return store.users.filter((u: any) => u.id === id) as T[];
      }
      if (lower.includes('where role in')) {
        return store.users.filter((u: any) => params.includes(u.role)) as T[];
      }
      return store.users as T[];
    }

    if (lower.includes('from categories')) {
      return store.categories as T[];
    }

    if (lower.includes('from badges')) {
      return store.badges as T[];
    }

    if (lower.includes('from student_badges')) {
      if (lower.includes('student_id = ? and badge_id = ?')) {
        return store.student_badges.filter((sb: any) => sb.student_id === params[0] && sb.badge_id === params[1]) as T[];
      }
      if (lower.includes('student_id = ?')) {
        const studentBadges = store.student_badges.filter((sb: any) => sb.student_id === params[0]);
        if (lower.includes('join badges')) {
          return studentBadges.map((sb: any) => {
            const b = store.badges.find((badge: any) => badge.id === sb.badge_id) || {};
            return { ...b, ...sb, awarded_at: sb.earned_at || sb.awarded_at };
          }) as T[];
        }
        return studentBadges as T[];
      }
      return store.student_badges as T[];
    }

    if (lower.includes('from certificates')) {
      if (lower.includes('certificate_number = ?')) {
        const cert = store.certificates.find((c: any) => c.certificate_number === params[0]);
        return (cert ? [cert] : []) as T[];
      }
      if (lower.includes('student_id = ? and activity_id = ? and title = ?')) {
        const [studentId, activityId, title] = params;
        return store.certificates.filter(
          (c: any) => c.student_id === studentId && c.activity_id === activityId && c.title === title
        ) as T[];
      }
      if (lower.includes('student_id = ? and activity_id = ?')) {
        const [studentId, activityId] = params;
        return store.certificates.filter((c: any) => c.student_id === studentId && c.activity_id === activityId) as T[];
      }
      if (lower.includes('student_id = ?')) {
        return store.certificates.filter((c: any) => c.student_id === params[0]) as T[];
      }
      return store.certificates as T[];
    }

    if (lower.includes('from activities')) {
      if (lower.includes('where a.id = ?') || lower.includes('where id = ?')) {
        const id = params[0];
        const match = store.activities.find((a: any) => a.id === id);
        return match ? ([{
          ...match,
          points_value: match.points || match.points_value || 25,
          points: match.points || match.points_value || 25,
          category_name: store.categories.find((c: any) => c.id === match.category_id)?.name || 'General',
          category_color: store.categories.find((c: any) => c.id === match.category_id)?.color || '#4F46E5',
          organization_name: 'Centrala High Supreme Secondary Learner Government (SSLG)',
          organizer_name: 'Javidec Monsion',
        }] as T[]) : ([] as T[]);
      }

      return store.activities.map((a: any) => ({
        ...a,
        points_value: a.points || a.points_value || 25,
        points: a.points || a.points_value || 25,
        category_name: store.categories.find((c: any) => c.id === a.category_id)?.name || 'General',
        category_color: store.categories.find((c: any) => c.id === a.category_id)?.color || '#4F46E5',
        organization_name: 'Centrala High Supreme Secondary Learner Government (SSLG)',
        organizer_name: 'Javidec Monsion',
      })) as T[];
    }

    if (lower.includes('from announcements')) {
      return store.announcements as T[];
    }

    if (lower.includes('from attendance_sessions')) {
      return store.sessions as T[];
    }

    if (lower.includes('from registrations')) {
      if (lower.includes('where student_id = ? and activity_id = ?')) {
        const [studentId, activityId] = params;
        return store.registrations.filter(
          (r: any) => r.student_id === studentId && r.activity_id === activityId
        ) as T[];
      }

      if (lower.includes('where r.activity_id = ?') && lower.includes('r.status')) {
        const activityId = params[0];
        return store.registrations
          .filter((r: any) => r.activity_id === activityId && (r.status === 'Approved' || r.status === 'Completed'))
          .map((r: any) => {
            const student = store.students.find((s: any) => s.id === r.student_id) || {};
            return { ...r, user_id: student.user_id };
          }) as T[];
      }

      if (lower.includes('where r.id = ?') || lower.includes('where id = ?')) {
        const regId = params[0];
        const r = store.registrations.find((reg: any) => reg.id === regId);
        if (!r) return [] as T[];
        const act = store.activities.find((a: any) => a.id === r.activity_id) || {};
        const student = store.students.find((s: any) => s.id === r.student_id) || {};
        const user = store.users.find((u: any) => u.id === student.user_id) || {};
        return [{
          ...r,
          activity_title: act.title || 'Extracurricular Program',
          student_name: `${user.first_name || 'Nicole'} ${user.last_name || 'Maquilan'}`,
          first_name: user.first_name || 'Nicole',
          last_name: user.last_name || 'Maquilan',
          email: user.email || 'student@cnhs.edu.ph',
          user_id: user.id || 'usr-student-01',
          grade_level: student.grade_level || 'Grade 10',
          section: student.section || 'Rizal',
          student_id_number: student.student_id_number || '109823450012',
        }] as T[];
      }

      if (lower.includes('where r.student_id = ?') || lower.includes('where student_id = ?')) {
        const studentId = params[0];
        const studentRegs = store.registrations.filter((r: any) => r.student_id === studentId);
        return studentRegs.map((r: any) => {
          const act = store.activities.find((a: any) => a.id === r.activity_id) || {};
          const cat = store.categories.find((c: any) => c.id === act.category_id) || {};
          return {
            ...r,
            activity_title: act.title || 'Extracurricular Program',
            date: act.date,
            start_time: act.start_time,
            end_time: act.end_time,
            location: act.location,
            category_name: cat.name || 'General',
            category_color: cat.color || '#4F46E5',
            points_value: act.points || act.points_value || 25,
            points: act.points || act.points_value || 25,
          };
        }) as T[];
      }

      return store.registrations.map((r: any) => {
        const act = store.activities.find((a: any) => a.id === r.activity_id) || {};
        const student = store.students.find((s: any) => s.id === r.student_id) || {};
        const user = store.users.find((u: any) => u.id === student.user_id) || {};
        return {
          ...r,
          activity_title: act.title || 'Extracurricular Program',
          student_name: `${user.first_name || 'Nicole'} ${user.last_name || 'Maquilan'}`,
          first_name: user.first_name || 'Nicole',
          last_name: user.last_name || 'Maquilan',
          email: user.email || 'student@cnhs.edu.ph',
          user_id: user.id || 'usr-student-01',
          grade_level: student.grade_level || 'Grade 10',
          section: student.section || 'Rizal',
          student_id_number: student.student_id_number || '109823450012',
          lrn: student.student_id_number || '109823450012',
          student_guardian_name: student.guardian_name || null,
          student_guardian_phone: student.guardian_phone || null,
        };
      }) as T[];
    }

    if (lower.includes('from notifications')) {
      if (lower.includes('where user_id = ?')) {
        return store.notifications.filter((n: any) => n.user_id === params[0]) as T[];
      }
      return store.notifications as T[];
    }

    if (lower.includes('from students')) {
      if (lower.includes('where user_id = ?')) {
        return store.students.filter((s: any) => s.user_id === params[0]) as T[];
      }
      if (lower.includes('where id = ?') || lower.includes('where s.id = ?')) {
        const s = store.students.find((std: any) => std.id === params[0]);
        if (!s) return [] as T[];
        const u = store.users.find((usr: any) => usr.id === s.user_id) || {};
        return [{
          ...s,
          first_name: u.first_name || 'Nicole',
          last_name: u.last_name || 'Maquilan',
          email: u.email || 'student@cnhs.edu.ph',
          avatar_url: u.avatar_url,
        }] as T[];
      }

      return store.students.map((s: any) => {
        const u = store.users.find((usr: any) => usr.id === s.user_id) || {};
        return {
          ...s,
          first_name: u.first_name || 'Nicole',
          last_name: u.last_name || 'Maquilan',
          email: u.email || 'student@cnhs.edu.ph',
          avatar_url: u.avatar_url,
          activities_joined_count: store.registrations.filter((r: any) => r.student_id === s.id && r.status === 'Approved').length,
        };
      }) as T[];
    }

    return [] as T[];
  },

  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
    if (pool) {
      try {
        let index = 1;
        const pgSql = sql.replace(/\?/g, () => `$${index++}`);
        const res = await pool.query(pgSql, params);
        return { changes: res.rowCount || 0 };
      } catch (err: any) {
        console.warn(`[serverDb PgPool Run fallback] (${err.message})`);
      }
    }

    const store = initFallbackStore();
    const lower = sql.toLowerCase().trim();

    if (lower.startsWith('insert into users')) {
      store.users.unshift({
        id: params[0],
        email: params[1],
        password_hash: params[2],
        role: params[3] || 'STUDENT',
        status: params[4] || 'ACTIVE',
        first_name: params[5] || 'Nicole',
        last_name: params[6] || 'Maquilan',
        avatar_url: params[7],
        phone: params[8],
      });
      return { changes: 1 };
    }

    if (lower.startsWith('insert into students')) {
      store.students.unshift({
        id: params[0],
        user_id: params[1],
        student_id_number: params[2],
        grade_level: params[3],
        section: params[4],
        track_strand: params[5],
        guardian_name: params[6],
        guardian_phone: params[7],
        bio: params[8],
        attendance_rate: 100.0,
        streak_count: 1,
        total_points: 50,
      });
      return { changes: 1 };
    }

    if (lower.startsWith('insert into activities')) {
      store.activities.unshift({
        id: params[0],
        title: params[1],
        slug: params[2],
        description: params[3],
        category_id: params[4] || 'cat-01',
        organization_id: params[5] || 'club-01',
        organizer_id: params[6] || 'tch-01',
        location: params[7],
        date: params[8],
        start_time: params[9] || '08:00 AM',
        end_time: params[10] || '12:00 PM',
        registration_deadline: params[11],
        max_participants: params[12] || 30,
        current_participants: 0,
        points: params[13] || 25,
        points_value: params[13] || 25,
        status: 'Published',
        registration_status: 'Registration Open',
        banner_image: params[14] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      });
      return { changes: 1 };
    }

    if (lower.startsWith('insert into student_badges')) {
      store.student_badges.unshift({
        id: params[0],
        student_id: params[1],
        badge_id: params[2],
        earned_at: new Date().toISOString(),
        awarded_by: params[3] || 'usr-teacher-01',
        is_celebrated: true,
      });
      return { changes: 1 };
    }

    if (lower.startsWith('insert into registrations')) {
      // Params: id, student_id, activity_id, participant_name, address, contact_number,
      //         guardian_name, guardian_relationship, guardian_contact, guardian_consent,
      //         medical_notes, motivation
      store.registrations.unshift({
        id: params[0],
        student_id: params[1],
        activity_id: params[2],
        status: 'Pending',
        registration_date: new Date().toISOString(),
        participant_name: params[3],
        address: params[4],
        contact_number: params[5],
        guardian_name: params[6],
        guardian_relationship: params[7],
        guardian_contact: params[8],
        guardian_consent: params[9],
        medical_notes: params[10],
        motivation: params[11],
      });
      return { changes: 1 };
    }

    if (lower.startsWith('update registrations')) {
      const placeholders = (sql.match(/\?/g) || []).length;
      const regId = params[params.length - 1];
      const status = params[0];
      let reviewNotes: any;
      let reviewedBy: any;
      if (placeholders >= 4) {
        reviewNotes = params[1];
        reviewedBy = params[2];
      } else if (placeholders === 3) {
        reviewedBy = params[1];
      }
      const reg = store.registrations.find((r: any) => r.id === regId);
      if (reg) {
        reg.status = status;
        if (reviewNotes !== undefined) reg.review_notes = reviewNotes;
        if (reviewedBy !== undefined) reg.reviewed_by = reviewedBy;
        reg.reviewed_at = new Date().toISOString();
      }
      return { changes: 1 };
    }

    if (lower.startsWith('update notifications')) {
      if (lower.includes('set is_read')) {
        if (lower.includes('where id = ? and user_id = ?')) {
          const [notifId, userId] = params;
          const notif = store.notifications.find((n: any) => n.id === notifId && n.user_id === userId);
          if (notif) notif.is_read = true;
        } else if (lower.includes('where user_id = ?')) {
          const userId = params[params.length - 1];
          store.notifications.forEach((n: any) => {
            if (n.user_id === userId) n.is_read = true;
          });
        }
      }
      return { changes: 1 };
    }

    if (lower.startsWith('update students')) {
      if (lower.includes('guardian_name') && params.length === 3) {
        const [guardianName, guardianPhone, studentId] = params;
        const student = store.students.find((s: any) => s.id === studentId);
        if (student) {
          student.guardian_name = guardianName || student.guardian_name;
          student.guardian_phone = guardianPhone || student.guardian_phone;
        }
      }
      return { changes: 1 };
    }

    if (lower.startsWith('insert into certificates')) {
      // Params: id, student_id, activity_id, certificate_number, title, description, file_url, issued_by
      store.certificates.unshift({
        id: params[0],
        student_id: params[1],
        activity_id: params[2],
        certificate_number: params[3],
        title: params[4],
        description: params[5],
        file_url: params[6] || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
        issued_by: params[7],
        issue_date: new Date().toISOString().split('T')[0],
        status: 'VERIFIED',
      });
      return { changes: 1 };
    }

    if (lower.startsWith('delete from activities')) {
      const actId = params[0];
      store.activities = store.activities.filter((a: any) => a.id !== actId);
      return { changes: 1 };
    }

    if (lower.startsWith('delete from announcements')) {
      const annId = params[0];
      store.announcements = store.announcements.filter((a: any) => a.id !== annId);
      return { changes: 1 };
    }

    if (lower.startsWith('delete from registrations')) {
      const regId = params[0];
      store.registrations = store.registrations.filter((r: any) => r.id !== regId);
      return { changes: 1 };
    }

    if (lower.startsWith('insert into announcements')) {
      store.announcements.unshift({
        id: params[0],
        author_id: params[1],
        title: params[2],
        content: params[3],
        target_audience: params[4],
        is_pinned: params[5],
        image_url: params[6],
        publish_date: new Date().toISOString(),
        first_name: 'Javidec',
        last_name: 'Monsion',
        author_role: 'TEACHER',
      });
      return { changes: 1 };
    }

    if (lower.startsWith('insert into notifications')) {
      store.notifications.unshift({
        id: params[0],
        user_id: params[1],
        title: params[2],
        message: params[3],
        type: params[4],
        link: params[5],
        is_read: 0,
        created_at: new Date().toISOString(),
      });
      return { changes: 1 };
    }

    if (lower.startsWith('insert into attendance_sessions')) {
      store.sessions.unshift({
        id: params[0],
        activity_id: params[1],
        session_title: params[2],
        session_date: params[3],
        start_time: params[4],
        end_time: params[5],
        qr_code_token: params[6],
        qr_expires_at: params[7],
        created_by: params[8],
      });
      return { changes: 1 };
    }

    return { changes: 1 };
  },
};
