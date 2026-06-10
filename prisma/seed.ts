import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const email = 'demo@carbonwise.com';
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  // Cleanup existing demo user data to prevent duplicates
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.activity.deleteMany({ where: { userId: existingUser.id } });
    await prisma.goal.deleteMany({ where: { userId: existingUser.id } });
    await prisma.prediction.deleteMany({ where: { userId: existingUser.id } });
    await prisma.user.delete({ where: { email } });
  }

  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email,
      hashedPassword,
      region: 'uk', // using UK region for real-time intensity demonstration
    },
  });

  console.log(`Demo User created: ${user.email}`);

  // Generate 6 months of activities (approx 180 days)
  const activities = [];
  const now = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  // Categories & sub-categories with their average amounts
  // We want to simulate a typical carbon footprint of ~350-500 kg CO2 / month
  // with some weekly cycles and occasional spikes
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const dayOfMonth = d.getDate();

    // 1. Transport (Daily or Weekday driving/commuting)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Weekday commute - Car (Petrol) 25km
      activities.push({
        userId: user.id,
        category: 'transport',
        subCategory: 'car_petrol',
        amount: 25,
        unit: 'km',
        co2Amount: 25 * 0.21, // 5.25 kg
        date: new Date(d),
        isAnomaly: false,
        notes: 'Daily commute',
      });

      // Regular train ride once a week
      if (dayOfWeek === 3) {
        activities.push({
          userId: user.id,
          category: 'transport',
          subCategory: 'train',
          amount: 40,
          unit: 'km',
          co2Amount: 40 * 0.041, // 1.64 kg
          date: new Date(d),
          isAnomaly: false,
          notes: 'Client meeting travel',
        });
      }
    } else {
      // Weekend leisure travel
      activities.push({
        userId: user.id,
        category: 'transport',
        subCategory: 'car_petrol',
        amount: 15,
        unit: 'km',
        co2Amount: 15 * 0.21, // 3.15 kg
        date: new Date(d),
        isAnomaly: false,
        notes: 'Weekend shopping trip',
      });
    }

    // Occasional flight anomaly: international flight 3 months ago (4000 km, ~780 kg CO2)
    if (dayOfMonth === 15 && d.getMonth() === (now.getMonth() - 3 + 12) % 12) {
      activities.push({
        userId: user.id,
        category: 'transport',
        subCategory: 'international_flight',
        amount: 4000,
        unit: 'km',
        co2Amount: 4000 * 0.195, // 780 kg
        date: new Date(d),
        isAnomaly: true,
        notes: 'Summer vacation flight (Anomaly)',
      });
    }

    // 2. Food (Simulated meals, logged every 2 days)
    if (dayOfMonth % 2 === 0) {
      // Alternate between high-carbon beef and low-carbon plant/chicken diets
      const isBeefDay = dayOfMonth % 6 === 0;
      if (isBeefDay) {
        activities.push({
          userId: user.id,
          category: 'food',
          subCategory: 'beef',
          amount: 0.3, // 300g
          unit: 'kg',
          co2Amount: 0.3 * 27.0, // 8.1 kg
          date: new Date(d),
          isAnomaly: false,
          notes: 'Steak dinner',
        });
      } else {
        activities.push({
          userId: user.id,
          category: 'food',
          subCategory: 'poultry',
          amount: 0.4, // 400g
          unit: 'kg',
          co2Amount: 0.4 * 6.9, // 2.76 kg
          date: new Date(d),
          isAnomaly: false,
          notes: 'Chicken and rice meal',
        });
        
        activities.push({
          userId: user.id,
          category: 'food',
          subCategory: 'vegetables',
          amount: 0.5, // 500g
          unit: 'kg',
          co2Amount: 0.5 * 2.0, // 1.0 kg
          date: new Date(d),
          isAnomaly: false,
          notes: 'Salad and greens',
        });
      }
    }

    // 3. Energy (Electricity log once a day, Gas bill simulation weekly)
    // Daily electricity baseline (e.g. 8-12 kWh/day)
    const electricityAmount = 10 + (Math.sin(dayOfMonth) * 2); // cyclical variation
    activities.push({
      userId: user.id,
      category: 'energy',
      subCategory: 'electricity',
      amount: parseFloat(electricityAmount.toFixed(2)),
      unit: 'kWh',
      co2Amount: parseFloat((electricityAmount * 0.42).toFixed(2)), // 4.2 kg
      date: new Date(d),
      isAnomaly: false,
      notes: 'Daily household electricity use',
    });

    // Weekly heating/gas log
    if (dayOfWeek === 0) {
      const gasAmount = 15 + (Math.cos(dayOfMonth) * 3);
      // Anomaly: 2 months ago, there was a massive gas leak/spike
      const isLeakWeek = d.getMonth() === (now.getMonth() - 2 + 12) % 12 && dayOfMonth < 8;
      const finalGasAmount = isLeakWeek ? gasAmount * 5 : gasAmount;

      activities.push({
        userId: user.id,
        category: 'energy',
        subCategory: 'natural_gas',
        amount: parseFloat(finalGasAmount.toFixed(2)),
        unit: 'm³',
        co2Amount: parseFloat((finalGasAmount * 2.0).toFixed(2)),
        date: new Date(d),
        isAnomaly: isLeakWeek,
        notes: isLeakWeek ? 'Heating left on full power (Anomaly)' : 'Weekly heating gas use',
      });
    }

    // 4. Shopping (logged once a week)
    if (dayOfWeek === 6 && dayOfMonth % 2 === 0) {
      activities.push({
        userId: user.id,
        category: 'shopping',
        subCategory: 'clothing',
        amount: 2,
        unit: 'items',
        co2Amount: 2 * 22.0, // 44 kg
        date: new Date(d),
        isAnomaly: false,
        notes: 'Clothes shopping',
      });
    }

    // Rare electronics purchase (anomaly or high carbon event)
    if (dayOfMonth === 1 && d.getMonth() === (now.getMonth() - 4 + 12) % 12) {
      activities.push({
        userId: user.id,
        category: 'shopping',
        subCategory: 'electronics',
        amount: 1,
        unit: 'items',
        co2Amount: 50.0, // 50 kg
        date: new Date(d),
        isAnomaly: false,
        notes: 'New smartphone purchase',
      });
    }
  }

  // Insert activities in chunks to avoid SQLite parameter limits
  console.log(`Inserting ${activities.length} activity records...`);
  const chunkSize = 200;
  for (let i = 0; i < activities.length; i += chunkSize) {
    const chunk = activities.slice(i, i + chunkSize);
    await prisma.activity.createMany({
      data: chunk,
    });
  }

  // Create Goal
  const goalStart = new Date(startDate);
  const goalEnd = new Date(now);
  goalEnd.setMonth(goalEnd.getMonth() + 6);
  await prisma.goal.create({
    data: {
      userId: user.id,
      targetReduction: 15.0, // 15% reduction
      baselineCo2: 450.0, // baseline average kg CO2 per month
      startDate: goalStart,
      endDate: goalEnd,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
