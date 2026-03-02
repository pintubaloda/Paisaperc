import * as bcrypt from 'bcrypt'
import type { PrismaService } from '../prisma/prisma.service'

const operators = [
  { id: 'op-jio', name: 'Jio', service: 'mobile', opCode: 'JIO', isActive: true },
  { id: 'op-airtel-mobile', name: 'Airtel', service: 'mobile', opCode: 'AIRTEL', isActive: true },
  { id: 'op-vi', name: 'Vi (Vodafone Idea)', service: 'mobile', opCode: 'VI', isActive: true },
  { id: 'op-bsnl', name: 'BSNL', service: 'mobile', opCode: 'BSNL', isActive: true },
  { id: 'op-tataplay', name: 'Tata Play', service: 'dth', opCode: 'TATAPLAY', isActive: true },
  { id: 'op-airtel-dth', name: 'Airtel Digital TV', service: 'dth', opCode: 'AIRTELDTH', isActive: true },
  { id: 'op-dishtv', name: 'Dish TV', service: 'dth', opCode: 'DISHTV', isActive: true },
  { id: 'op-sundirect', name: 'Sun Direct', service: 'dth', opCode: 'SUNDIRECT', isActive: true },
  { id: 'op-electricity', name: 'Electricity Bill', service: 'bill_payment', opCode: 'ELECTRICITY', isActive: true },
  { id: 'op-gas', name: 'Gas Bill', service: 'bill_payment', opCode: 'GAS', isActive: true },
  { id: 'op-water', name: 'Water Bill', service: 'bill_payment', opCode: 'WATER', isActive: true }
]

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
    initialBalance: 0
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
    initialBalance: 1000
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
    initialBalance: 1000
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
    initialBalance: 1000
  }
]

export async function runAutoDemoSeed(prisma: PrismaService) {
  if (process.env.AUTO_SEED_DEMO !== 'true') return

  console.log('[seed] AUTO_SEED_DEMO is enabled. Ensuring demo data exists...')

  for (const operator of operators) {
    await prisma.operator.upsert({
      where: { id: operator.id },
      update: {},
      create: operator
    })
  }

  for (const user of demoUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10)

    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        password: hashedPassword,
        name: user.name,
        mobile: user.mobile,
        role: user.role as any,
        kycStatus: user.kycStatus,
        isActive: user.isActive,
        apiKey: user.apiKey || null,
        apiSecret: user.apiSecret || null
      }
    })

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        balance: user.initialBalance,
        lockedBalance: 0
      }
    })
  }

  console.log('[seed] Demo users/operators ensured successfully.')
}
