# PaisaPe - Multi Recharge & Bill Payment Platform

## Original Problem Statement
Build a "PaisaPe" multi-mobile/DTH recharge and bill payment software with admin panel, user management, double-entry wallet, intelligent routing with API failover, commission settings, and support for third-party recharge APIs.

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

## What's Implemented

### Backend Modules
- Auth (JWT login/register)
- Users (CRUD, edit, toggle status, manual wallet adjust)
- Wallet (double-entry ledger, credit/debit, admin: get all wallets, per-user ledger)
- Operators (CRUD for mobile/DTH/bill payment)
- API Config (CRUD, operator codes, response mappings, callback URLs, test API with params, headers/authToken/requestFormat/response field mapping)
- Commission (CRUD by User Type + Operator + Service)
- Routing (CRUD with API priority list for failover)
- Recharge (with API failover logic, retry, stats)
- Reports (dashboard stats, admin dashboard, transactions, ledger)
- Payment Requests, Customer API, Two-Factor (schema only)

### Admin Panel (8 pages)
- Dashboard with stats cards
- User Management: wallet balance column, Edit modal, Manual Wallet modal, Account Ledger view
- Operators Management (CRUD)
- API Configuration: Add/Edit with auth token, headers, request format (query_param/json_body), response field mapping; Test API with mobile/operator/amount preview; Operator codes, Response mappings
- Commission Settings (User Type + Operator + Service based)
- Routing Rules (API priority list with failover order)
- Live Transactions (auto-refresh, status filter, search, detail modal, retry)
- Advanced Reports with tabs, CSV export

### User Panel (5 pages)
- Dashboard with stats
- Recharge page (mobile/DTH/bill payment)
- Wallet page with ledger and payment requests
- Reports (transactions + wallet ledger tabs)
- Settings (profile, KYC status, password change)

### API Config Format Support
- **StockXchange format**: GET with query params (type, token, op_code, number, amount, txn_id)
- **MoneyArt format**: POST JSON with headers (X-Client-Id, X-Client-Secret)

## P1 - Next Up
- KYC Management (PAN/Aadhaar/GST upload & verification)
- Enhanced Reports (date filters, export to Excel/PDF, operator-wise profit)
- Password change API implementation
- Real API integration (replace simulated calls with actual HTTP calls to providers)

## P2 - Future/Backlog
- 2FA Implementation
- Real-time notifications (WebSockets)
- Reconciliation system (cron job for mismatch detection)
- Message queue for high load (Kafka/RabbitMQ)
- Customer-facing reseller API with HMAC validation
- IP Whitelisting, Rate Limiting

## Notes
- Recharge provider API calls are **MOCKED** (simulated with random success/failure)
- Test API endpoint generates request preview only, no live call
- Backend must be compiled (`npx tsc` in /app/backend) before restart
