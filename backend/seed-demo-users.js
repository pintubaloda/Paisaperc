const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

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
    initialBalance: 0,
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
    initialBalance: 1000,
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
    initialBalance: 1000,
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
    initialBalance: 1000,
  },
];

async function seedUsers() {
  try {
    console.log('Seeding demo users in PostgreSQL...');

    for (const user of demoUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          kycStatus: user.kycStatus,
          isActive: user.isActive,
          apiKey: user.apiKey || null,
          apiSecret: user.apiSecret || null,
          password: hashedPassword,
        },
        create: {
          id: user.id,
          email: user.email,
          password: hashedPassword,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          kycStatus: user.kycStatus,
          isActive: user.isActive,
          apiKey: user.apiKey || null,
          apiSecret: user.apiSecret || null,
        },
      });

      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: { balance: user.initialBalance, lockedBalance: 0 },
        create: { userId: user.id, balance: user.initialBalance, lockedBalance: 0 },
      });

      console.log(`Created/updated: ${user.email} (${user.role})`);
    }

    console.log('\nDemo users seeded successfully.');
    console.log('\n=== LOGIN CREDENTIALS ===\n');

    demoUsers.forEach((user) => {
      console.log(`${user.role.toUpperCase()}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      if (user.apiKey) console.log(`API Key: ${user.apiKey}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
