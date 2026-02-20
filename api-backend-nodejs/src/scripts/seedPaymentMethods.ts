import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultPaymentMethods = [
  {
    name: 'Credit/Debit Card',
    type: 'card',
    icon: 'CreditCard',
    emoji: '💳',
    description: 'Visa, Mastercard, Amex',
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Digital Wallet',
    type: 'wallet',
    icon: 'Wallet',
    emoji: '📱',
    description: 'Apple Pay, Google Pay, Samsung Pay',
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'Pay at Salon',
    type: 'cash',
    icon: 'DollarSign',
    emoji: '💰',
    description: 'Cash or card at location',
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Bank Transfer',
    type: 'transfer',
    icon: 'Building2',
    emoji: '🏦',
    description: 'Direct bank transfer',
    isActive: false,
    sortOrder: 4,
  },
  {
    name: 'PayPal',
    type: 'paypal',
    icon: 'CreditCard',
    emoji: '🅿️',
    description: 'PayPal payment',
    isActive: false,
    sortOrder: 5,
  },
];

async function seedPaymentMethods() {
  console.log('🌱 Seeding payment method configurations...');

  try {
    // Clear existing payment method configs
    await prisma.paymentMethodConfig.deleteMany();
    console.log('🗑️  Cleared existing payment method configurations');

    // Create new payment method configs
    for (const paymentMethod of defaultPaymentMethods) {
      await prisma.paymentMethodConfig.create({
        data: paymentMethod,
      });
      console.log(`✅ Created payment method: ${paymentMethod.name}`);
    }

    console.log('🎉 Payment method configurations seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding payment method configurations:', error);
    throw error;
  }
}

async function updateSalonPaymentMethods() {
  console.log('🔄 Updating salon payment method configurations...');

  try {
    // Update all salons to have default enabled payment methods
    const defaultEnabledMethods = ['card', 'wallet', 'cash'];
    
    await prisma.salon.updateMany({
      data: {
        enabledPaymentMethods: defaultEnabledMethods,
        bufferTime: 15,
        maxBookingsPerDay: 20,
        allowSameDayBooking: true,
      },
    });

    console.log('✅ Updated salon payment method configurations');
  } catch (error) {
    console.error('❌ Error updating salon configurations:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedPaymentMethods();
    await updateSalonPaymentMethods();
    console.log('🚀 All seeding completed successfully!');
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed script
if (require.main === module) {
  main();
}

export { seedPaymentMethods, updateSalonPaymentMethods };
