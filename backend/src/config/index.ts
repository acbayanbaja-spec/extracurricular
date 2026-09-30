import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'cnhs_dev_jwt_secret_surallah_2026_super_secure_key_128',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'cnhs_dev_jwt_refresh_secret_surallah_2026_super_secure_key_256',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  institution: {
    name: 'Centrala National High School',
    location: 'Surallah, South Cotabato',
    systemName: 'Extracurricular Activities and Student Development System',
    acronym: 'CNHS-EASDS',
  },
};
