const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'paisape_db';

const { v4: uuidv4 } = require('uuid');

const operators = [
  // Mobile Operators
  { name: 'Jio', service: 'mobile', opCode: 'JIO', isActive: true },
  { name: 'Airtel', service: 'mobile', opCode: 'AIRTEL', isActive: true },
  { name: 'Vi (Vodafone Idea)', service: 'mobile', opCode: 'VI', isActive: true },
  { name: 'BSNL', service: 'mobile', opCode: 'BSNL', isActive: true },
  
  // DTH Operators
  { name: 'Tata Play', service: 'dth', opCode: 'TATAPLAY', isActive: true },
  { name: 'Airtel Digital TV', service: 'dth', opCode: 'AIRTELDTH', isActive: true },
  { name: 'Dish TV', service: 'dth', opCode: 'DISHTV', isActive: true },
  { name: 'Sun Direct', service: 'dth', opCode: 'SUNDIRECT', isActive: true },
  
  // Bill Payment Services
  { name: 'Electricity Bill', service: 'bill_payment', opCode: 'ELECTRICITY', isActive: true },
  { name: 'Gas Bill', service: 'bill_payment', opCode: 'GAS', isActive: true },
  { name: 'Water Bill', service: 'bill_payment', opCode: 'WATER', isActive: true },
];

async function seedOperators() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const operatorsCollection = db.collection('operators');

    // Clear existing operators
    await operatorsCollection.deleteMany({});

    console.log('\nCreating operators...');

    for (const operator of operators) {
      await operatorsCollection.insertOne({
        id: uuidv4(),
        ...operator,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Created: ${operator.name} (${operator.service})`);
    }

    console.log(`\n🎉 ${operators.length} operators created successfully!`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding operators:', error);
    process.exit(1);
  }
}

seedOperators();
