import { Pool } from 'pg';
import { createClient, Client as LibsqlClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

class DatabaseManager {
  private pgPool: Pool | null = null;
  private libsqlClient: LibsqlClient | null = null;
  public isPostgres = false;
  private initialized = false;

  constructor() {
    const dbUrl = config.databaseUrl.trim();
    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
      this.isPostgres = true;
      this.pgPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('supabase') || dbUrl.includes('render') ? { rejectUnauthorized: false } : undefined,
      });
      console.log('✅ [DatabaseManager] Using PostgreSQL database connection');
    } else {
      this.isPostgres = false;
      const dbPath = path.resolve(__dirname, '../../cnhs_extracurricular.db');
      this.libsqlClient = createClient({
        url: `file:${dbPath}`,
      });
      console.log(`✅ [DatabaseManager] Using embedded relational database (LibSQL/SQLite): ${dbPath}`);
    }
  }

  public async initSchema(): Promise<void> {
    if (this.initialized) return;

    try {
      const schemaPath = path.resolve(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        if (this.isPostgres && this.pgPool) {
          await this.pgPool.query(schemaSql);
        } else if (this.libsqlClient) {
          await this.libsqlClient.executeMultiple(schemaSql);
        }
      }
      this.initialized = true;
      console.log('✅ [DatabaseManager] Relational schema initialized successfully');
    } catch (error) {
      console.error('❌ [DatabaseManager] Failed to initialize schema:', error);
      throw error;
    }
  }

  private convertPlaceholders(sql: string, toPostgres: boolean): string {
    if (toPostgres) {
      let index = 1;
      return sql.replace(/\?/g, () => `$${index++}`);
    } else {
      return sql.replace(/\$\d+/g, '?');
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.isPostgres && this.pgPool) {
      const pgSql = this.convertPlaceholders(sql, true);
      const res = await this.pgPool.query(pgSql, params);
      return res.rows as T[];
    } else if (this.libsqlClient) {
      const sqliteSql = this.convertPlaceholders(sql, false);
      const res = await this.libsqlClient.execute({
        sql: sqliteSql,
        args: params,
      });
      return res.rows as unknown as T[];
    }
    throw new Error('No active database client');
  }

  public async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  public async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
    if (this.isPostgres && this.pgPool) {
      const pgSql = this.convertPlaceholders(sql, true);
      const res = await this.pgPool.query(pgSql, params);
      return { changes: res.rowCount || 0 };
    } else if (this.libsqlClient) {
      const sqliteSql = this.convertPlaceholders(sql, false);
      const res = await this.libsqlClient.execute({
        sql: sqliteSql,
        args: params,
      });
      return { changes: res.rowsAffected || 0 };
    }
    throw new Error('No active database client');
  }

  public async rawExecute(sql: string): Promise<void> {
    if (this.isPostgres && this.pgPool) {
      await this.pgPool.query(sql);
    } else if (this.libsqlClient) {
      await this.libsqlClient.execute(sql);
    }
  }

  public async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.libsqlClient) {
      this.libsqlClient.close();
    }
  }
}

export const db = new DatabaseManager();
