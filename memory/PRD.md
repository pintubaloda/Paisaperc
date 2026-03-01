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

## Demo Credentials
- Admin: `admin@test.com` / `password123`
- Retailer: `retailer@test.com` / `password123`

## What's Implemented (as of March 1, 2026)

### Core Backend Modules
- **Auth** - JWT login/register with role-based access
- **Users** - CRUD, edit, toggle, manual wallet credit/debit, KYC fields, API key, IP whitelist
- **Wallet** - Double-entry ledger, consolidated ledger report, all wallets view
- **Operators** - CRUD with name, service type, opCode
- **API Config** - Full provider setup with dynamic variables, response mapping, test API, operator code mapping, status check config
- **Commission** - By User Type + Operator + Service
- **Routing** - API priority list with failover

### Transaction System
- **Atomic debit-first flow** (debit -> API call -> refund on fail OR commission on success)
- **Dynamic Variable Substitution** - `[number]`, `[op_code]`, `[amount]`, `[txn_id]`, `[token]`, `[circle]`, `[provider_ref]`
- **Request Format Support** - GET, POST, POST_JSON, POSTDATA
- **Transaction Status Check** - via provider's status check API
- **Bulk Status Resolver** - resolves all pending transactions at once
- **Admin Manual Status Change** - admin can change any txn status with wallet handling
- **Retry with API selection** - retry failed txn with specific API
- **API Request/Response logging** - stored per transaction for audit

### Webhook System
- **Provider Webhook** - `POST /api/webhook/:apiId/callback` receives status updates
- **Pending → Success/Failed** - updates transaction and handles wallet
- **Failed + Success webhook → DISPUTE** - creates dispute record for admin manual decision
- **Callback token validation** - security for webhook endpoints

### Dispute Management
- **Dispute records** - created when failed txn receives success webhook
- **Admin resolution** - accept as success, reject, or manual credit
- **Unresolved/All views** - filter by resolution status

### KYC Management
- **User submission** - PAN, Aadhaar, GST document numbers
- **Admin verification** - approve/reject with reasons
- **Status tracking** - pending, approved, rejected

### 2FA Authentication
- **TOTP-based** - enable, disable, verify
- **Secret generation** - for authenticator apps

### Customer-Facing Reseller API
- **API Key auth** - `x-api-key` header
- **IP Whitelist** - configurable per API user
- **Endpoints** - Recharge, Status check, Balance
- **API documentation** - built-in docs page

### Reconciliation System
- **Auto-run** - every 10 minutes
- **Stats** - total pending, stale (>30min), today's success/failed/disputes
- **Manual trigger** - admin can run on demand

### Message Queue
- **MongoDB-based** - job queue with retry logic
- **Handler registration** - extensible for different job types
- **Auto-processing** - every 5 seconds

### WebSocket Notifications
- **Socket.IO gateway** - `/notifications` namespace
- **User-specific** - notifications targeted by userId
- **Admin broadcasts** - admin-specific events

### Transaction Timeline
- **Visual lifecycle view** for every transaction
- Events tracked: wallet_debit → txn_created → routing → api_call → api_response → txn_success/failed/pending → commission_credit/refund → status_check → webhook_received → dispute_created → admin_status_change
- **Color-coded nodes** with icons for each event type
- **Metadata tags** showing amounts, API IDs, operator names
- **Timestamps** for complete audit trail
- Accessible from Live Transactions detail dialog and Pending Report retry dialog

### Admin Panel Pages
1. Dashboard (stats overview)
2. User Management (wallet balance, actions)
3. Operators Management
4. API Configuration (dynamic variables, test API)
5. Commission Settings
6. Routing Rules
7. **Live Transactions** (status change, retry, view detail)
8. **Pending Report** (bulk resolve, retry with API, API req/resp detail)
9. **Dispute Report** (resolve disputes from webhook conflicts)
10. Advanced Reports (all/failed/pending with operator names)
11. Ledger Report (consolidated view, CSV export)
12. **KYC Management** (verify/reject documents)
13. **Reseller API** (API users, key management, IP whitelist, docs)
14. **Reconciliation** (stats, manual run)
15. **2FA Settings** (enable/disable)
16. Sandbox Test runner

### User Panel Pages
1. Dashboard
2. Recharge
3. KYC Submit
4. 2FA Settings

### Frontend Architecture
- **Refactored api.js** into feature-based modules:
  - `apiClient.js` - axios instance with interceptors
  - `authService.js` - login/register
  - `rechargeService.js` - all transaction operations
  - `walletService.js` - wallet operations
  - `adminService.js` - admin CRUD operations
  - `api.js` - barrel export (backward compatible)

## Key API Endpoints
- `POST /api/webhook/:apiId/callback` - Provider webhook
- `POST /api/recharge/:id/change-status` - Admin status change
- `POST /api/recharge/bulk-resolve` - Bulk resolve pending
- `GET /api/recharge/detail/:id` - Txn detail with API req/resp
- `POST /api/recharge/:id/retry-with-api` - Retry with specific API
- `POST /api/kyc/submit` - Submit KYC document
- `POST /api/kyc/:id/verify` - Admin verify KYC
- `GET /api/disputes` - All disputes
- `POST /api/disputes/:id/resolve` - Resolve dispute
- `GET /api/reconciliation/report` - Reconciliation stats
- `POST /api/customer-api/recharge` - Reseller API
- `GET /api/customer-api/balance` - Reseller balance
- `POST /api/two-factor/enable` - Enable 2FA

### Security Hardening (March 1, 2026)
- **Admin registration blocked** — cannot create admin via `/api/auth/register`
- **Strong JWT secret** — 64-char hex random secret (no default fallback)
- **Helmet security headers** — XSS protection, content-type sniffing, HSTS, CORP, COOP
- **Rate limiting** — Global 100 req/min, Login 10/min, Register 5/min, Customer API 60/min
- **CORS restricted** — only allowed from configured frontend origin
- **OTP not leaked** — removed OTP value from `/send-otp` response
- **User data sanitized** — `password` and `apiSecret` excluded from all API responses
- **Webhook replay protection** — rejects timestamps older than 5 minutes
- **IP whitelist** — customer API enforces IP restrictions per user
- **Callback token validation** — webhook endpoints validate provider tokens

## P2 - Remaining/Future Tasks
- File upload for KYC documents (currently number-only)
- Email/SMS notifications for low balance alerts
- Provider report import for reconciliation
- Rate limiting on reseller API
- Dashboard charts and analytics
- Operator-wise profit analysis report
- Multi-currency support

## Notes
- Sandbox mode uses **MOCKED** random responses (not real provider APIs)
- Build backend: `cd /app/backend && yarn build && sudo supervisorctl restart backend`
