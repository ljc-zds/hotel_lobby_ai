# Production deployment

- Site: https://hotellobby-ai.site
- Host: Vercel, project `hotellobby-ai`, team `ljc-s-projects1`
- DNS: Spaceship nameservers, apex A `216.198.79.1`, www CNAME `f29f034421c02a6d.vercel-dns-017.com`; www redirects to apex.
- Database: Neon PostgreSQL, isolated `hotellobby` schema. The reviewed initial migration and RBAC setup have been applied. Existing schemas are not modified.

## Build and configuration

Vercel uses `pnpm install --frozen-lockfile` and `pnpm build`, with `NITRO_PRESET=vercel`. The prebuild script copies the PostgreSQL schema template. Vercel builds exclude unused native SQLite/MySQL drivers. Neon pooled connections use schema-qualified queries rather than a startup `search_path` option.

Production variables: `VITE_APP_URL`, `VITE_APP_NAME`, `VITE_APP_DESCRIPTION`, `DATABASE_PROVIDER=postgresql`, `DATABASE_URL`, `DB_SCHEMA=hotellobby`, `AUTH_URL`, `AUTH_SECRET`, `CONFIG_ENCRYPTION_KEY`, `DB_SINGLETON_ENABLED=true`, `DB_MAX_CONNECTIONS=1`, `NITRO_PRESET=vercel`. Secrets live in encrypted Vercel environment variables; `.env.production` is ignored by Git.

Google and GitHub OAuth credentials are encrypted in `hotellobby.config`. Callbacks:

- https://hotellobby-ai.site/api/auth/callback/google
- https://hotellobby-ai.site/api/auth/callback/github

Google is published for external users. GitHub also retains its localhost callback. No default production admin/password is created.

## Future migrations

Generate with `NODE_ENV=production pnpm exec drizzle-kit generate --config=drizzle.production.config.ts`. Review SQL before running `NODE_ENV=production pnpm exec drizzle-kit migrate --config=drizzle.production.config.ts`. Do not use `db:push` on production.

## Product status

The video generator, credits and orders currently demonstrate the template flow. Photos preview locally; this UI does not generate real AI video or charge money. Authentication uses the production database. AI provider and payment integration require separate configuration and implementation.
