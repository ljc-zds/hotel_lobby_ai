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

The generator uses MiniMax-H3 (768P, 4 seconds). Waffo Pancake is integrated for checkout and payment webhooks. Provider credentials are configured separately from the source code.

## Video archival to private R2

Configure the existing admin Settings → Storage → R2 fields: account ID, bucket name, Access Key ID, Secret Access Key, and optionally upload path. Use credentials with object read/write access to this bucket. Alternatively, the server supports `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, and `STORAGE_BUCKET`. Encrypted database settings take precedence. Keep these credentials server-only. A public bucket or public domain is unnecessary.

New generation requests check storage configuration before reserving quota or calling MiniMax. Production HTTPS requests include a per-task authenticated callback at `/api/video/callback`. The callback validates its token and queries MiniMax directly; supplied callback URLs are never downloaded. Browser polling provides the same completion path. Confirm the provider's challenge handshake in a live generation test after deployment.

Successful output is validated and copied into `uploads/videos/<task-uuid>.mp4` (or the configured upload path). The database records the R2 object key and marks success only after upload. A three-minute persisted lease prevents duplicate transfers; interrupted transfers can be retried. Storage failures leave the task processing and retry after 30 seconds on polling or callback redelivery. Callback retries depend on MiniMax's delivery policy; reopening an unfinished task resumes polling.

Playback and downloads use `/api/video/file?id=<task-uuid>` on the website domain. This endpoint checks the signed-in user owns the task, reads the private object, and supports HTTP Range/HEAD requests for seeking. Video history comes from the account's database records, including records older than seven days, rather than browser demo storage. No automatic R2 expiration is added; existing bucket lifecycle rules still apply.

Existing successful tasks are archived when queried again while MiniMax can still return their output. Older browser-only history cannot be recovered automatically.
