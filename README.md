# Nexus RWA

Nexus RWA is an institutional-grade Real World Asset analytics and grading project.

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
```

For Neon, the connection string should usually include:

```txt
sslmode=require
```

Do not commit real database passwords or secrets to GitHub.

### 3. Sync Prisma with the database

Run this whenever the local Prisma client/schema is not synchronized with the Neon database, or after pulling fresh changes.

```bash
npx prisma db pull
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
6. Run Prisma sync again:

```bash
npx prisma db pull
npx prisma generate
npm run dev
```

### When to run Prisma commands

Use this after pulling repo changes or after database/schema changes:

```bash
npx prisma db pull
npx prisma generate
```

Use this after changing only TypeScript/API code:

```bash
npm run dev
```

Use this after changing `schema.prisma` locally:

```bash
npx prisma generate
npm run dev
```

## Notes

The API currently connects to the database during startup. If the database is unreachable, the API will fail before serving requests.
