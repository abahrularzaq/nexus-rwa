# Nexus RWA

[![CI](actions/workflows/ci.yml/badge.svg)](actions/workflows/ci.yml)

Nexus RWA is an institutional-grade Real World Asset analytics and grading project.

## Before opening a PR

Run the same checks locally that CI enforces before opening a pull request:

```bash
npm ci
npm run lint
npm run typecheck
npm run db:migrate:status --workspace=api
npm run test:backend
npm run build
npm run validate:openapi -- docs/openapi.yaml
```

The OpenAPI validation command is required when an OpenAPI spec is present, such as `docs/openapi.yaml`. Each command should exit successfully; CI is configured to fail the pull request if any step fails.

## API Local Development

Use this checklist when running the API locally.

### 1. Go to the API workspace

```bash
cd api
```

Or from Windows absolute path:

```bash
cd "D:\NEXUS RWA\nexus-rwa\api"
```

### 2. Check environment variables

Make sure `api/.env` exists and contains a valid Neon PostgreSQL connection string.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
LOG_RETENTION_DAYS="60"
USAGE_ANALYTICS_RETENTION_MONTHS="18"
IP_HASH_SALT="replace-with-strong-random-secret"
```

`LOG_RETENTION_DAYS` controls raw `ApiRequest` and `UsageLog` cleanup. `USAGE_ANALYTICS_RETENTION_MONTHS` controls daily aggregate analytics retention, and `IP_HASH_SALT` salts stored IP-address hashes.

For Neon, the connection string should usually include:

```txt
sslmode=require
```

Do not commit real database passwords or secrets to GitHub.

### 3. Apply Prisma migrations locally

Run this whenever the local database needs the checked-in Prisma migrations, or after pulling fresh changes. For local development, use Prisma Migrate instead of `prisma db push` so schema changes are captured as migration files.

```bash
npm run db:migrate:dev
npx prisma generate
```

### 4. Start the API

```bash
npm run dev
```


## API Quickstart

For common API calls, base URL setup, curl examples, and compact response examples, see [`docs/api-quickstart.md`](docs/api-quickstart.md).

## Troubleshooting

### Prisma `P1001`: Can't reach database server

Example error:

```txt
PrismaClientInitializationError: Can't reach database server
Error code: P1001
```

This usually means the API cannot connect to the Neon PostgreSQL database.

Check these items:

1. `api/.env` exists.
2. `DATABASE_URL` is correct.
3. The Neon project, branch, database, user, and endpoint are still active.
4. The connection string includes `sslmode=require`.
5. Your internet connection, VPN, or firewall is not blocking PostgreSQL port `5432`.
6. Check and apply migrations again:

```bash
npm run db:migrate:status
npm run db:migrate:dev
npx prisma generate
npm run dev
```

### When to run Prisma commands

Use this after pulling repo changes or after database/schema changes in development:

```bash
npm run db:migrate:status
npm run db:migrate:dev
npx prisma generate
```

Use this after changing only TypeScript/API code:

```bash
npm run dev
```

Use this after changing `schema.prisma` locally:

```bash
npm run db:migrate:dev -- --name <migration_name>
npx prisma generate
npm run dev
```

## Production deployment

Production deploys must run checked-in Prisma migrations with `prisma migrate deploy` before starting the API. Do **not** use `prisma db push` in production because it bypasses migration history and review.

From the API workspace, run:

```bash
npm run db:migrate:deploy
npm run start
```

In hosted environments such as Railway, add `npm run db:migrate:deploy` as a pre-start or release command so each deployment applies pending migrations safely.

## Notes

The API currently connects to the database during startup. If the database is unreachable, the API will fail before serving requests.
