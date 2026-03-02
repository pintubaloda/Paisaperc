# Frontend (Next.js + Vuexy)

This folder contains the imported Vuexy Next.js TypeScript theme for your frontend implementation.

## Stack

- Next.js (App Router)
- TypeScript
- MUI + Tailwind

## Run Locally

1. Install dependencies:

```bash
pnpm install
```

2. Create env file:

```bash
cp .env.local.example .env.local
```

3. Start dev server:

```bash
pnpm dev
```

Open `http://localhost:3000`

## Backend Integration (Node.js)

- Your backend runs separately as Node.js (NestJS in this repository).
- Frontend should call backend using `API_URL` / `NEXT_PUBLIC_API_URL`.
- Set these in `.env.local`.

Example:

```env
API_URL=http://localhost:8001/api/auth
NEXT_PUBLIC_API_URL=http://localhost:8001/api
DATABASE_URL=postgresql://postgres:password@localhost:5432/paisape
```

## Notes

- Theme includes sample local APIs and Prisma auth setup. You can keep or replace these as you integrate your real backend.
- Main frontend code location: `src/app` and `src/views`.
- Backend login route in this repo is `POST /api/auth/login`, which matches `API_URL=http://localhost:8001/api/auth`.
