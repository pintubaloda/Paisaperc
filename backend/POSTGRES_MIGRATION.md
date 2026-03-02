# PostgreSQL Migration (Complete)

The backend has been fully migrated from MongoDB/Mongoose to PostgreSQL using Prisma.

## Migrated Modules

- auth
- users
- wallet + ledger
- operators
- api-config
- commission
- routing
- recharge + txn events
- webhook
- dispute
- kyc
- operator-api-mapping
- payment-requests
- queue
- reconciliation
- reports dependencies

## Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Create/migrate PostgreSQL schema:

```bash
npm run prisma:migrate -- --name init_full_postgres
```

5. Start backend:

```bash
npm run dev
```

## Notes

- Prisma schema: `prisma/schema.prisma`
- Legacy Mongoose schema files are kept only for reference and excluded from build.
