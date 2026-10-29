require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Mess = require('../src/models/Mess');
const Member = require('../src/models/Member');
const Expense = require('../src/models/Expense');
const Payment = require('../src/models/Payment');
const MealEntry = require('../src/models/MealEntry');

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        params[key] = nextArg;
        i++;
      } else {
        params[key] = true;
      }
    }
  }
  return params;
}

async function seed() {
  console.log('🌱 Starting Manager & Mess initialization...\n');

  const args = parseArgs();
  const name = args.name || process.env.SEED_MANAGER_NAME || 'Mess Manager';
  const email = (args.email || process.env.SEED_MANAGER_EMAIL || 'manager@mess.com').toLowerCase().trim();
  const password = args.password || process.env.SEED_MANAGER_PASSWORD;
  const messName = args.mess || process.env.SEED_MESS_NAME || 'Green View Bachelor Mess';
  const includeSampleData = Boolean(args['sample-data'] || process.env.SEED_SAMPLE_DATA === 'true');

  if (!password || password.length < 8) {
    console.error('❌ Error: A secure password of at least 8 characters is required.');
    console.error('   Usage: node scripts/seedManager.js --email "manager@mess.com" --password "YourStrongPassword123!" --name "Manager Name" --mess "Mess Name" [--sample-data]\n');
    process.exit(1);
  }

  await connectDB();

  try {
    let existingUser = await User.findOne({ email });
    let mess;

    if (existingUser) {
      console.log(`ℹ️  Manager user with email "${email}" already exists.`);
      mess = await Mess.findById(existingUser.messId);
      if (!mess) {
        mess = await Mess.create({
          name: messName,
          code: 'MESS-' + Math.floor(1000 + Math.random() * 9000),
          managerId: existingUser._id,
        });
        existingUser.messId = mess._id;
        await existingUser.save();
      }
    } else {
      // Create user placeholder ID for mess
      const userId = new mongoose.Types.ObjectId();
      const messId = new mongoose.Types.ObjectId();

      mess = await Mess.create({
        _id: messId,
        name: messName,
        code: 'MESS-' + Math.floor(1000 + Math.random() * 9000),
        address: 'House #42, Road #7, Dhanmondi, Dhaka',
        currency: 'BDT',
        currencySymbol: '৳',
        managerId: userId,
        settings: {
          mealCategories: ['bazar', 'groceries'],
          fixedCostCategories: ['house_rent', 'gas', 'electricity', 'water', 'wifi', 'cleaning', 'other'],
          defaultFixedAllocation: 'equal',
          roundingPolicy: 'round_to_paisa',
        },
      });

      existingUser = await User.create({
        _id: userId,
        name,
        email,
        password,
        phone: '01700000000',
        role: 'manager',
        messId: mess._id,
        isActive: true,
      });

      console.log(`✅ Manager account created successfully!`);
      console.log(`   Manager Name: ${name}`);
      console.log(`   Email:        ${email}`);
      console.log(`   Mess Name:    ${messName}`);
      console.log(`   Mess ID:      ${mess._id}`);
    }

    if (includeSampleData) {
      console.log('\n📦 Seeding realistic sample mess data...');
      const currentYearMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-10"

      // Create 4 members if none exist
      const existingMembers = await Member.find({ messId: mess._id });
      let members = existingMembers;

      if (existingMembers.length === 0) {
        members = await Member.insertMany([
          {
            messId: mess._id,
            name: 'Rahim Ahmed',
            phone: '01811223344',
            email: 'rahim@bachelor.bd',
            roomNumber: '301',
            openingBalance: 0,
            isActive: true,
          },
          {
            messId: mess._id,
            name: 'Tanvir Hossain',
            phone: '01711223344',
            email: 'tanvir@bachelor.bd',
            roomNumber: '301',
            openingBalance: 150, // owes 150 from prev month
            isActive: true,
          },
          {
            messId: mess._id,
            name: 'Karim Ullah',
            phone: '01911223344',
            email: 'karim@bachelor.bd',
            roomNumber: '302',
            openingBalance: -200, // advance credit 200
            isActive: true,
          },
          {
            messId: mess._id,
            name: 'Sakib Hasan',
            phone: '01511223344',
            email: 'sakib@bachelor.bd',
            roomNumber: '302',
            openingBalance: 0,
            isActive: true,
          },
        ]);
        console.log(`   Added ${members.length} sample mess members.`);
      }

      // Add sample expenses if none for this month
      const expCount = await Expense.countDocuments({ messId: mess._id, month: currentYearMonth });
      if (expCount === 0) {
        const today = new Date().toISOString().substring(0, 10);
        await Expense.insertMany([
          {
            messId: mess._id,
            date: today,
            month: currentYearMonth,
            category: 'bazar',
            amount: 2450.5,
            description: 'Weekly fresh vegetables, fish, chicken, oil, rice',
            paymentSource: 'mess_cash',
            recordedBy: existingUser._id,
          },
          {
            messId: mess._id,
            date: today,
            month: currentYearMonth,
            category: 'bazar',
            amount: 850,
            description: 'Spices, onions, potatoes, eggs from local bazar',
            paymentSource: 'member_personal',
            paidByMemberId: members[0]._id, // Rahim paid out of pocket
            recordedBy: existingUser._id,
          },
          {
            messId: mess._id,
            date: today,
            month: currentYearMonth,
            category: 'wifi',
            amount: 1000,
            description: 'Monthly optical fiber 30mbps internet bill',
            paymentSource: 'mess_cash',
            recordedBy: existingUser._id,
          },
          {
            messId: mess._id,
            date: today,
            month: currentYearMonth,
            category: 'cleaning',
            amount: 1200,
            description: 'Monthly mess cleaning lady & trash collection',
            paymentSource: 'mess_cash',
            recordedBy: existingUser._id,
          },
        ]);
        console.log(`   Added sample bazar & fixed expenses for ${currentYearMonth}.`);
      }

      // Add sample deposits
      const payCount = await Payment.countDocuments({ messId: mess._id, month: currentYearMonth });
      if (payCount === 0) {
        const today = new Date().toISOString().substring(0, 10);
        await Payment.insertMany([
          {
            messId: mess._id,
            memberId: members[0]._id,
            date: today,
            month: currentYearMonth,
            amount: 3000,
            paymentMethod: 'bKash',
            reference: 'TRX98273611',
            notes: 'Advance meal & utility deposit',
            recordedBy: existingUser._id,
          },
          {
            messId: mess._id,
            memberId: members[1]._id,
            date: today,
            month: currentYearMonth,
            amount: 2500,
            paymentMethod: 'cash',
            notes: 'Hand cash payment for October',
            recordedBy: existingUser._id,
          },
          {
            messId: mess._id,
            memberId: members[2]._id,
            date: today,
            month: currentYearMonth,
            amount: 3000,
            paymentMethod: 'nagad',
            reference: 'NAG837192',
            notes: 'Monthly advance deposit',
            recordedBy: existingUser._id,
          },
        ]);
        console.log(`   Added sample member deposits for ${currentYearMonth}.`);
      }

      // Add sample meals
      const mealCount = await MealEntry.countDocuments({ messId: mess._id, month: currentYearMonth });
      if (mealCount === 0) {
        const today = new Date().toISOString().substring(0, 10);
        await MealEntry.insertMany([
          {
            messId: mess._id,
            memberId: members[0]._id,
            date: today,
            month: currentYearMonth,
            breakfast: 1,
            lunch: 1,
            dinner: 1,
            totalMeals: 3,
            recordedBy: existingUser._id,
          },
          {
            messId: mess._id,
            memberId: members[1]._id,
            date: today,
            month: currentYearMonth,
            breakfast: 0.5,
            lunch: 1,
            dinner: 1,
            totalMeals: 2.5,
            recordedBy: existingUser._id,
          },
          {
            messId: mess._id,
            memberId: members[2]._id,
            date: today,
            month: currentYearMonth,
            breakfast: 1,
            lunch: 0,
            dinner: 1,
            totalMeals: 2,
            recordedBy: existingUser._id,
          },
          {
            messId: mess._id,
            memberId: members[3]._id,
            date: today,
            month: currentYearMonth,
            breakfast: 0,
            lunch: 1,
            dinner: 1,
            totalMeals: 2,
            recordedBy: existingUser._id,
          },
        ]);
        console.log(`   Added sample meals for ${today}.`);
      }
    }

    console.log('\n🎉 Initialization complete! You can now log in.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
