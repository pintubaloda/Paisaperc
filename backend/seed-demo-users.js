const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'paisape_db';

const demoUsers = [
  {
    id: 'admin-001',
    email: 'admin@paisape.com',
    password: 'admin123',
    name: 'Admin User',
    mobile: '9999999999',
    role: 'admin',
    kycStatus: true,
    isActive: true,
  },
  {
    id: 'retailer-001',
    email: 'retailer@demo.com',
    password: 'retailer123',
    name: 'John Retailer',
    mobile: '9876543210',
    role: 'retailer',
    kycStatus: false,
    isActive: true,
  },
  {
    id: 'distributor-001',
    email: 'distributor@demo.com',
    password: 'distributor123',
    name: 'Sarah Distributor',
    mobile: '9876543211',
    role: 'distributor',
    kycStatus: true,
    isActive: true,
  },
  {
    id: 'api-user-001',
    email: 'api@demo.com',
    password: 'apiuser123',
    name: 'API Integration User',
    mobile: '9876543212',
    role: 'api_user',
    kycStatus: true,
    isActive: true,
    apiKey: 'demo-api-key-12345',
    apiSecret: 'demo-api-secret-67890',
  },
];

async function seedUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const walletsCollection = db.collection('wallets');

    // Clear existing demo users
    await usersCollection.deleteMany({ email: { $in: demoUsers.map(u => u.email) } });
    await walletsCollection.deleteMany({ userId: { $in: demoUsers.map(u => u.id) } });

    console.log('\nCreating demo users...');

    for (const user of demoUsers) {
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Create user
      await usersCollection.insertOne({
        ...user,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create wallet with demo balance
      const initialBalance = user.role === 'admin' ? 0 : 1000;
      await walletsCollection.insertOne({
        userId: user.id,
        balance: initialBalance,
        lockedBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ Created: ${user.email} (${user.role}) - Balance: ₹${initialBalance}`);
    }

    console.log('\n🎉 Demo users created successfully!');
    console.log('\n=== LOGIN CREDENTIALS ===\n');
    demoUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      if (user.apiKey) {
        console.log(`API Key: ${user.apiKey}`);
      }
      console.log('---');
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
