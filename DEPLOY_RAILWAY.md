# Railway Deployment (Fresh Install, PostgreSQL Only)

This project is prepared for Railway with PostgreSQL and no MongoDB.

## 1. Create Railway Services

Create three services in one Railway project:

1. `postgres` (Railway PostgreSQL)
2. `backend` (root directory: `backend`)
3. `frontend` (root directory: `frontend`)

## 2. Backend Service Setup

- Root directory: `backend`
- Uses `backend/nixpacks.toml`
- Start command runs Prisma migrations automatically.

### Required Environment Variables (backend)

- `DATABASE_URL` (from Railway PostgreSQL service)
- `JWT_SECRET` (strong random string)
- `JWT_EXPIRES_IN` (example: `7d`)
- `CORS_ORIGINS` (comma-separated frontend URLs)

Optional:
- `PORT` (Railway injects this automatically)

## 3. Frontend Service Setup

- Root directory: `frontend`
- Uses `frontend/nixpacks.toml`

Use this as base: `frontend/.env.railway.example`

### Required Environment Variables (frontend)

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` = frontend public URL + `/api/auth`
- `API_URL` = backend public URL + `/api/auth`
- `NEXT_PUBLIC_API_URL` = backend public URL + `/api`
- `NEXT_PUBLIC_APP_URL` = frontend public URL

Frontend does not require its own database for auth in this setup.

## 4. First Deploy Flow

1. Deploy `postgres`
2. Deploy `backend`
   - Backend will run `prisma migrate deploy` on startup
3. Deploy `frontend`
4. Set `CORS_ORIGINS` on backend to frontend URL
5. Redeploy backend once after CORS update

## 5. Optional Seed Data (after backend deploy)

Run in backend shell:

```bash
npm run seed
```

This seeds operators and demo users into PostgreSQL.

## Notes

- MongoDB is not required.
- Legacy `*.schema.ts` files are reference-only and excluded from build.
