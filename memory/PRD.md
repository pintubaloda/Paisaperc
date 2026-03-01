# PaisaPe - Multi Recharge & Bill Payment Platform

## Original Problem Statement
Build a "PaisaPe" multi-mobile/DTH recharge and bill payment software with:
- Admin panel for managing APIs, users, commissions, routing
- User management with roles (Retailer, Distributor, Super Distributor, API User)
- Double-entry wallet/ledger system
- Intelligent routing engine with API failover
- Commission settings by User Type + Operator + Service

## Tech Stack
- **Backend**: NestJS (TypeScript) on port 8001
- **Frontend**: React with Shadcn UI, TailwindCSS
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT-based authentication

## Demo Credentials
- Admin: `admin@paisape.com` / `admin123`
- Retailer: `retailer@demo.com` / `retailer123`
- Distributor: `distributor@demo.com` / `distributor123`
- API User: `api@demo.com` / `apiuser123`

## What's Implemented (as of March 2026)

### Backend
- Auth module (JWT login/register)
- Users module (CRUD, edit, toggle status, manual wallet adjust)
- Wallet module (double-entry ledger, credit/debit)
- Operators module (CRUD for mobile/DTH/bill payment operators)
- API Config module (CRUD, operator codes, response mappings, callback URLs)
- Commission module (CRUD by User Type + Operator + Service)
- Routing module (CRUD with API priority list for failover)
- Recharge module (with API failover logic, retry, stats)
- Reports module (dashboard stats, admin dashboard)
- Payment Requests module
- Customer API module
- Two-Factor module (schema only)

### Frontend Admin Panel
- Dashboard with stats cards
- User Management with Edit modal + Manual Wallet modal
- Operators Management (CRUD)
- API Configuration with Test API, Operator Codes, Response Mappings
- Commission Settings (User Type + Operator + Service based)
- Routing Rules (API priority list with failover order)
- Advanced Reports with tabs (All/Failed/Pending), CSV export

### Frontend User Panel
- Dashboard, Recharge page, Wallet page

## P1 - Next Up
- KYC Management (PAN/Aadhaar/GST upload & verification)
- Enhanced Reports (date filters, operator-wise profit analysis)
- Fix routing error (test routing with actual recharge flow)

## P2 - Future/Backlog
- 2FA Implementation
- Real-time notifications (WebSockets)
- Reconciliation system (cron job for mismatch detection)
- Message queue for high load (Kafka/RabbitMQ)
- Customer-facing reseller API with HMAC validation
- IP Whitelisting, Rate Limiting

## Architecture
```
/app/backend/src/  - NestJS modules (auth, users, wallet, operators, api-config, commission, routing, recharge, reports, payment-requests, customer-api, two-factor)
/app/frontend/src/ - React pages (landing, auth, admin/*, user dashboard)
```

## Notes
- Recharge API calls are MOCKED (simulated with random success/failure)
- Backend must be compiled (`npx tsc` in /app/backend) before restart
- Supervisor config: `/etc/supervisor/conf.d/supervisord.conf`
