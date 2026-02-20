import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🧹 Starting complete database reset...');

    // Delete all data in correct order (respecting foreign key constraints)
    console.log('🗑️ Deleting existing data...');
    
    // Delete all tables in correct order
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.loyaltyAccount.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.paymentMethod.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.review.deleteMany();
    await prisma.salonRequest.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.service.deleteMany();
    await prisma.serviceCategory.deleteMany();
    await prisma.stylist.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.socialAccount.deleteMany();
    await prisma.systemConfig.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ All existing data deleted - Database is now completely clean');
    console.log('📝 Database is ready for fresh admin setup');
    console.log('🔑 No default users created - Admin must sign up through the admin signup page');
    console.log('\n🎉 Database reset complete!');
    console.log('🚀 Next step: Visit /admin/signup to create the first admin user');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset function if this file is executed directly
if (require.main === module) {
  resetDatabase()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default resetDatabase;
