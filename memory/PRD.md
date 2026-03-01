# PaisaPe - Multi Recharge & Bill Payment Platform

## Original Problem Statement
Build a "PaisaPe" multi-mobile/DTH recharge and bill payment software with admin panel, user management, double-entry wallet, intelligent routing with API failover, commission settings, and support for third-party recharge APIs.

## Tech Stack
- **Backend**: NestJS (TypeScript) on port 8001
- **Frontend**: React with Shadcn UI, TailwindCSS
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT-based authentication
- **WebSocket**: Socket.IO for real-time notifications
- **Queue**: MongoDB-based message queue
- **Security**: Helmet, nest-throttler, bcrypt, HMAC, AES-256 encryption

## Demo Credentials
- Admin: `admin@test.com` / `password123`
- Retailer: `retailer@test.com` / `password123`

## What's Implemented (as of March 1, 2026)

### Core Backend Modules
- **Auth** - JWT login/register with role-based access
- **Users** - CRUD, edit, toggle, manual wallet credit/debit, KYC fields, API key, IP whitelist
- **Wallet** - Double-entry ledger, consolidated ledger report, all wallets view
- **Operators** - CRUD with name, service type, auto-generated opCode (PMJ pattern)
- **API Config** - Full provider setup with dynamic variables, response mapping, test API, operator code mapping, status check config
- **Commission** - By User Type + Operator + Service
- **Routing** - API priority list with failover
- **Reports** - Admin dashboard stats, user dashboard stats, transaction reports, ledger reports
- **Payment Requests** - User wallet top-up requests with admin approval

### Transaction System
- **Atomic debit-first flow** (debit -> API call -> refund on fail OR commission on success)
- **Dynamic Variable Substitution** - `[number]`, `[op_code]`, `[amount]`, `[txn_id]`, `[token]`, `[circle]`, `[provider_ref]`
- **Request Format Support** - GET, POST, POST_JSON, POSTDATA
- **Transaction Status Check** - via provider's status check API
- **Bulk Status Resolver** - resolves all pending transactions at once
- **Admin Manual Status Change** - admin can change any txn status with wallet handling
- **Retry with API selection** - retry failed txn with specific API
- **API Request/Response logging** - stored per transaction for audit

### Two-Factor Authentication (Real TOTP)
- **speakeasy** TOTP verification (not mock)
- **QR code generation** via qrcode library (data URL)
- **Backup codes** - 10 single-use recovery codes
- **Verification flow** - enable → scan QR → verify code → active

### Auto Operator Code Generation
- Format: `P` (PaisaPe) + Service letter (`M`/`D`/`B`) + First letter of operator name
- Example: PaisaPe + Mobile + Jio = `PMJ`
- Auto-fills when creating operators, can be overridden manually

### Provider Report Import (Reconciliation)
- **CSV file upload** endpoint `/api/reconciliation/import`
- Matches by `txnId` or `providerRef`
- Returns: matched, mismatched, notFound counts with details
- Displays mismatch details table in UI

### Request/Response Encryption
- **AES-256-CBC** encryption middleware on customer-api routes
- Activated via `x-encrypted: true` header
- Encrypts both request and response payloads
- Optional — regular JSON works without header

### Webhook System
- **Provider Webhook** - `POST /api/webhook/:apiId/callback` receives status updates
- **Pending → Success/Failed** - updates transaction and handles wallet
- **Failed + Success webhook → DISPUTE** - creates dispute record for admin
- **Callback token validation** - security for webhook endpoints

### Dispute Management
- **Dispute records** - created when failed txn receives success webhook
- **Admin resolution** - accept as success, reject, or manual credit

### KYC Management
- **User submission** - PAN, Aadhaar, GST document numbers
- **Admin verification** - approve/reject with reasons

### Customer-Facing Reseller API
- **API Key auth** - `x-api-key` header
- **IP Whitelist** - configurable per API user
- **Endpoints** - Recharge, Status check, Balance
- **Comprehensive API documentation** with parameters, examples, error codes

### Reconciliation System
- **Auto-run** - every 10 minutes
- **Stats** - total pending, stale (>30min), today's success/failed/disputes, volume, commission
- **Manual trigger** - admin can run on demand
- **CSV Import** - upload provider reports for matching

### Security Hardening
- **Admin registration blocked** — cannot create admin via `/api/auth/register`
- **Strong JWT secret** — 64-char hex random secret
- **Helmet security headers** — XSS protection, HSTS, CORP, COOP
- **Rate limiting** — Global 100 req/min, Login 10/min, Customer API 60/min
- **CORS restricted** — only allowed from configured frontend origin
- **AES-256 encryption** — optional for customer API requests/responses

### Admin Panel Pages
1. Dashboard (stats overview)
2. User Management (wallet balance, actions)
3. Operators Management (auto code generation)
4. API Configuration (dynamic variables, test API)
5. Commission Settings
6. Routing Rules
7. Live Transactions (status change, retry, view detail)
8. Pending Report (bulk resolve, retry with API)
9. Dispute Report (resolve disputes)
10. Advanced Reports (all/failed/pending with operator names)
11. Ledger Report (consolidated view, CSV export)
12. KYC Management (verify/reject documents)
13. Reseller API (API users, key management, IP whitelist, comprehensive docs)
14. Reconciliation (stats, manual run, CSV import)
15. 2FA Settings (enable/disable with QR code)
16. Sandbox Test runner

### User Panel Pages
1. Dashboard (wallet balance, recent transactions)
2. Recharge
3. Wallet (balance, ledger, payment requests)
4. Reports (transaction history, wallet ledger)
5. KYC Submit
6. 2FA Settings
7. Settings

## Key API Endpoints
- `POST /api/auth/login`, `POST /api/auth/register`
- `GET /api/reports/admin-dashboard`, `GET /api/reports/dashboard-stats`
- `POST /api/recharge`, `GET /api/recharge/my`, `GET /api/recharge/all`
- `POST /api/recharge/:id/change-status`, `POST /api/recharge/bulk-resolve`
- `GET /api/recharge/timeline/:id`, `GET /api/recharge/detail/:id`
- `POST /api/kyc/submit`, `POST /api/kyc/:id/verify`
- `GET /api/disputes`, `POST /api/disputes/:id/resolve`
- `GET /api/reconciliation/report`, `POST /api/reconciliation/import` (CSV)
- `POST /api/customer-api/recharge`, `GET /api/customer-api/balance`
- `POST /api/two-factor/enable`, `POST /api/two-factor/verify`
- `GET /api/payment-requests`, `POST /api/payment-requests`

## P2 - Remaining/Future Tasks
- Full message queue integration (BullJS → recharge service)
- Automated reconciliation (cron job for provider report matching)
- Enhanced reports (operator-wise profit analysis)
- File upload for KYC documents (currently number-only)
- Email/SMS notifications for low balance alerts
- Dashboard charts and analytics

## Notes
- Sandbox mode uses **MOCKED** random responses (not real provider APIs)
- Build backend: `cd /app/backend && yarn build && sudo supervisorctl restart backend`
