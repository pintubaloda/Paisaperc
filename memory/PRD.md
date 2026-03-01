# PaisaPe - Multi Recharge & Bill Payment Platform

## Original Problem Statement
Build a "PaisaPe" multi-mobile/DTH recharge and bill payment software with admin panel, user management, double-entry wallet, intelligent routing with API failover, commission settings, and support for third-party recharge APIs.

## Tech Stack
- **Backend**: NestJS (TypeScript) on port 8001
- **Frontend**: React with Shadcn UI, TailwindCSS
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT-based authentication

## Demo Credentials
- Admin: `admin@test.com` / `password123`
- Retailer: `retailer@test.com` / `password123`

## What's Implemented

### Backend
- Auth (JWT login/register)
- Users (CRUD, edit, toggle, manual wallet credit/debit)
- Wallet (double-entry ledger, consolidated ledger report, all wallets view, per-user ledger)
- Operators (CRUD with name, service type, opCode)
- API Config (CRUD, headers, authToken, requestFormat, response field mapping, test API, operator codes, response mappings, status check config)
- Commission (CRUD by User Type + Operator + Service)
- Routing (API priority list with failover)
- Recharge:
  - Atomic debit-first flow (debit -> API call -> refund on fail OR commission on success)
  - **Dynamic Variable Substitution** in API URLs and request bodies: `[number]`, `[op_code]`, `[amount]`, `[txn_id]`, `[token]`, `[circle]`, `[provider_ref]`
  - **Operator Code Mapping** - translates operatorId to provider-specific codes
  - **Request Format Support** - GET, POST, POST_JSON, POSTDATA (form-urlencoded)
  - **Response Parsing** - supports nested dot-notation paths, response code mapping
  - **Transaction Status Check** - resolves pending txns via provider's status check API
  - **Operator Name** in all transaction records and reports
  - Failover to next API on failure, Retry for failed txns
  - Sandbox mode with random outcomes, Bulk sandbox test runner
- Reports (dashboard stats, admin dashboard, operator-wise data)

### Admin Panel
- Dashboard with stats
- User Management: wallet balance column, Edit/Wallet/Ledger/Toggle actions
- Operators Management
- API Configuration: full provider setup with dynamic variables, test API
- Commission Settings (User Type + Operator + Service)
- Routing Rules (API priority with failover)
- Live Transactions: user names, **operator names**, auto-refresh, filter, search, retry, check-status
- Advanced Reports: All/Failed/Pending tabs with **operator names**, CSV export
- Ledger Report: consolidated view with opening/closing balances, CSV export
- Sandbox Test runner

### User Panel
- Dashboard, Recharge, Wallet, Reports, Settings

## P1 - Next Up
- KYC Management (PAN/Aadhaar/GST document upload & admin verification)
- Enhanced Reports (operator-wise profit analysis, date filters)

## P2 - Future/Backlog
- 2FA Implementation
- WebSocket notifications for real-time transaction updates
- Reconciliation System (cron job to detect mismatches)
- Message queue (RabbitMQ) for high transaction loads
- Customer-facing reseller API with HMAC signature validation
- Refactor api.js into feature-based service modules

## Key Architecture
- **Transaction Flow**: Debit wallet -> Call provider API (with failover) -> On success: credit commission. On failure: refund. On pending: mark for status check later.
- **Dynamic Variables**: `[number]`, `[op_code]`, `[amount]`, `[txn_id]`, `[token]`, `[circle]`, `[provider_ref]` - substituted in URLs, request params, and headers
- **Status Check**: Sandbox randomly resolves (60% success, 20% pending, 20% failed). Real APIs call provider's statusCheckEndpoint with configured method/params.

## Notes
- Sandbox mode uses **MOCKED** random responses (not real provider APIs)
- Build backend: `cd /app/backend && yarn build && sudo supervisorctl restart backend`
