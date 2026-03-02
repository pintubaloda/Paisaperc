# PaisaPerc Monorepo

This repository now contains:

- `backend`: Node.js backend (NestJS)
- `frontend`: Imported Vuexy Next.js TypeScript theme (primary frontend)
- `frontend-legacy`: Previous React frontend (kept as backup)

## Run Backend

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

Default backend URL: `http://localhost:8001/api`

## Run New Frontend (Vuexy Next.js)

```bash
cd frontend
pnpm install
cp .env.local.example .env.local
pnpm dev
```

Open: `http://localhost:3000`

## Integration Notes

- `frontend` is the new frontend implementation imported from your Vuexy theme.
- `frontend-legacy` is retained only for reference/migration fallback.
- `API_URL` is set for auth calls (`http://localhost:8001/api/auth`).
- `NEXT_PUBLIC_API_URL` is set for general backend routes (`http://localhost:8001/api`).
- Backend is fully migrated to PostgreSQL (Prisma). MongoDB is no longer required at runtime.
- Migration guide: `backend/POSTGRES_MIGRATION.md`.
- Railway deploy guide: `DEPLOY_RAILWAY.md`.
