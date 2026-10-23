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
      return store.users as T[];
    }

    if (lower.includes('from categories')) {
      return store.categories as T[];
    }

    if (lower.includes('from activities')) {
      return store.activities.map((a: any) => ({
        ...a,
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
      return store.registrations as T[];
    }

    if (lower.includes('from notifications')) {
      return store.notifications as T[];
    }

    if (lower.includes('from students')) {
      return store.students as T[];
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
    const lower = sql.toLowerCase();

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
