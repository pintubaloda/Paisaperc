# PaisaPe - Multi Recharge & Bill Payment Platform

## Original Problem Statement
Build a "PaisaPe" multi-mobile/DTH recharge and bill payment software with admin panel, user management, double-entry wallet, intelligent routing with API failover, commission settings, and support for third-party recharge APIs (StockXchange, MoneyArt formats).

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

### Backend
- Auth (JWT login/register)
- Users (CRUD, edit, toggle, manual wallet credit/debit)
- Wallet (double-entry ledger, all wallets view, per-user ledger, admin endpoints)
- Operators (CRUD)
- API Config (CRUD, headers, authToken, requestFormat, response field mapping, test API with params, operator codes, response mappings)
- Commission (CRUD by User Type + Operator + Service)
- Routing (API priority list with failover)
- Recharge (failover, retry, stats, enriched with user names, bulk mock test)
- Reports (dashboard stats, admin dashboard)

### Admin Panel (8 pages)
- Dashboard with stats
- User Management: wallet balance column, Edit/Wallet/Ledger/Toggle actions
- Operators Management
- API Config: auth token, headers, request format (query_param/json_body), method (GET/POST/POST_JSON/POSTDATA), dynamic system variables ([number], [op_code], [amount], [txn_id], [token], [circle]), response field mapping, Test API with mobile/operator/amount
- Commission Settings (User Type + Operator + Service)
- Routing Rules (API priority with failover)
- Live Transactions (user names, auto-refresh, filter, search, retry)
- Reports (user names, failed/pending tabs, CSV export)

### User Panel (5 pages)
- Dashboard, Recharge, Wallet, Reports (txn + ledger tabs), Settings (profile/KYC/password)

### API Format Support
- **StockXchange**: GET query params (type, token, op_code, number, amount, txn_id)
- **MoneyArt**: POST JSON with headers (X-Client-Id, X-Client-Secret)

### Stress Test Results
- 100 mock transactions completed in seconds
- Wallet debit and ledger verified correctly
- Success rate: ~37% (simulated), all debits and commissions tracked

## P1 - Next Up
- KYC Management (document upload & verification)
- Real API integration (replace mock with actual HTTP calls)
- Password change API
- Enhanced reports (date filters, export PDF/Excel)

## P2 - Future/Backlog
- 2FA, WebSocket notifications, Reconciliation, Message queue, Reseller API with HMAC

## Notes
- Recharge API calls are **MOCKED** (simulated with random success/failure)
- Backend: `cd /app/backend && npx tsc && sudo supervisorctl restart backend`
