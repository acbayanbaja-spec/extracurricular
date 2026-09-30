import { Pool } from 'pg';

const SUPABASE_DEFAULT_URL = 'postgresql://postgres.rfxxbqrkrdwiatbfqtlw:extramandaw221@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';

const rawDbUrl = (process.env.DATABASE_URL || SUPABASE_DEFAULT_URL).trim();
const cleanDbUrl = rawDbUrl.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/\?$/, '');

// Create singleton pool for serverless execution
let pool: Pool;

declare global {
  var _cnhsPgPool: Pool | undefined;
}

if (!global._cnhsPgPool) {
  global._cnhsPgPool = new Pool({
    connectionString: cleanDbUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

pool = global._cnhsPgPool;

export const serverDb = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    // Convert ? to $1, $2, etc. for PostgreSQL
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgSql, params);
    return res.rows as T[];
  },

  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgSql, params);
    return { changes: res.rowCount || 0 };
  },
};
