# PaisaPe - Multi Recharge & Bill Payment Platform

![PaisaPe Logo](frontend/public/images/paisape-logo.png)

**Payments. Everytime. Everywhere**

A comprehensive enterprise-grade recharge and bill payment platform built with NestJS, Next.js, and PostgreSQL.

---

## 🎯 Demo Credentials

### Admin Account
- **Email:** `admin@paisape.com`
- **Password:** `admin123`
- **Features:** Full system access, user management, API configuration, commission settings, routing rules

### Retailer Account
- **Email:** `retailer@demo.com`
- **Password:** `retailer123`
- **Initial Balance:** ₹1,000
- **Features:** Process recharges, manage wallet, view reports

### Distributor Account
- **Email:** `distributor@demo.com`
- **Password:** `distributor123`
- **Initial Balance:** ₹1,000
- **Features:** Higher commission rates, distributor dashboard

### API User Account (For Developers)
- **Email:** `api@demo.com`
- **Password:** `apiuser123`
- **API Key:** `demo-api-key-12345`
- **API Secret:** `demo-api-secret-67890`
- **Initial Balance:** ₹1,000
- **Features:** Programmatic API access for integration

### Generate Demo Credentials in Fresh Install

Run once in backend:

```bash
npm run seed
```

This creates/updates all demo accounts and operators in PostgreSQL.

---

## 🚀 Features

### Core Functionality
- ✅ **Multi-Service Support:** Mobile Recharge, DTH, Bill Payments
- ✅ **Role-Based Access Control:** Admin, Retailer, Distributor, Super Distributor, API User
- ✅ **Double-Entry Ledger System:** Bank-grade transaction tracking
- ✅ **Manual Payment Requests:** User raises request → Admin approves → Wallet credited
- ✅ **Commission System:** Profile & Operator based automatic commission
- ✅ **Routing Engine:** Smart API selection based on user/amount/operator
- ✅ **Real-time Statistics:** Dashboard with transaction metrics

### Admin Panel Features
- Dynamic API Configuration (Add provider APIs with parameters)
- Operator Management (Mobile, DTH, Bill Payment)
- Commission Settings (Percentage or Flat)
- Routing Rules Configuration
- User Management & KYC Approval
- Payment Request Approval/Rejection
- Comprehensive Reports & Analytics

### User Features
- Wallet Management with Transaction History
- Quick Recharge (Mobile/DTH/Bill Payment)
- Payment Request with Proof Upload
- Transaction Ledger (Double-Entry)
- Commission Tracking
- Profile & Settings Management

### Developer API
- RESTful API for resellers
- API Key Authentication
- Recharge & Status Check Endpoints
- Webhooks for transaction updates

---

## 📋 Available Operators

### Mobile Recharge
- Jio, Airtel, Vi (Vodafone Idea), BSNL

### DTH Recharge
- Tata Play, Airtel Digital TV, Dish TV, Sun Direct

### Bill Payments
- Electricity Bill, Gas Bill, Water Bill

---

## 🧪 Quick Test

1. **Login:** `https://<your-frontend-domain>/login`
   - Use: `retailer@demo.com` / `retailer123`

2. **Legacy Landing Page:** `https://<your-frontend-domain>/front-pages/legacy-landing`

2. **Process Recharge:**
   - Select Jio operator
   - Enter: 9876543210
   - Amount: ₹99

3. **Check Wallet & Ledger**

---

**Built with ❤️ using Emergent AI Platform**
