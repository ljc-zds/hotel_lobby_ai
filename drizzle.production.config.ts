import { defineConfig } from 'drizzle-kit';

import { loadEnvFiles } from './src/lib/env';

loadEnvFiles();

export default defineConfig({
  schema: './src/config/db/schema.postgres.ts',
  out: './migrations/postgres',
  dialect: 'postgresql',
  migrations: { schema: 'hotellobby_migrations' },
  dbCredentials: { url: process.env.DATABASE_URL || '' },
});
