const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

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
  { id: 'op-water', name: 'Water Bill', service: 'bill_payment', opCode: 'WATER', isActive: true },
];

async function seedOperators() {
  try {
    console.log('Seeding operators in PostgreSQL...');

    for (const operator of operators) {
      await prisma.operator.upsert({
        where: { id: operator.id },
        update: {
          name: operator.name,
          service: operator.service,
          opCode: operator.opCode,
          isActive: operator.isActive,
        },
        create: operator,
      });
      console.log(`Created/updated: ${operator.name} (${operator.service})`);
    }

    console.log(`\n${operators.length} operators seeded successfully.`);
  } catch (error) {
    console.error('Error seeding operators:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedOperators();
