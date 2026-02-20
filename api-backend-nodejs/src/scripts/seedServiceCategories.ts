import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const serviceCategories = [
  {
    name: 'Hair Care',
    description: 'Professional hair styling, cutting, coloring, and treatment services',
    emoji: '💇‍♀️',
    icon: 'scissors',
  },
  {
    name: 'Facial',
    description: 'Rejuvenating facial treatments for all skin types',
    emoji: '🧴',
    icon: 'sparkles',
  },
  {
    name: 'Nail Care',
    description: 'Manicures, pedicures, and nail art services',
    emoji: '💅',
    icon: 'hand',
  },
  {
    name: 'Massage',
    description: 'Relaxing and therapeutic massage treatments',
    emoji: '💆‍♀️',
    icon: 'heart',
  },
  {
    name: 'Makeup',
    description: 'Professional makeup application for all occasions',
    emoji: '💄',
    icon: 'palette',
  },
  {
    name: 'Spa',
    description: 'Full-service spa treatments and wellness packages',
    emoji: '🧖‍♀️',
    icon: 'flower',
  },
  {
    name: 'Waxing',
    description: 'Professional hair removal services',
    emoji: '🪒',
    icon: 'zap',
  },
  {
    name: 'Threading',
    description: 'Precise eyebrow and facial hair threading',
    emoji: '🧵',
    icon: 'target',
  },
  {
    name: 'Skin Care',
    description: 'Advanced skincare treatments and consultations',
    emoji: '✨',
    icon: 'sun',
  },
  {
    name: 'Bridal',
    description: 'Complete bridal beauty packages for your special day',
    emoji: '👰‍♀️',
    icon: 'crown',
  },
];

async function seedServiceCategories() {
  try {
    console.log('🌱 Starting service categories seeding...');

    for (const category of serviceCategories) {
      const existingCategory = await prisma.serviceCategory.findFirst({
        where: { name: category.name }
      });

      if (existingCategory) {
        await prisma.serviceCategory.update({
          where: { id: existingCategory.id },
          data: category
        });
        console.log(`✅ Updated category: ${category.name}`);
      } else {
        await prisma.serviceCategory.create({
          data: category
        });
        console.log(`✅ Created category: ${category.name}`);
      }
    }

    console.log('🎉 Service categories seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding service categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedServiceCategories()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedServiceCategories;
