import { PrismaClient } from '@prisma/client';
import { SYSTEM_CONFIG_DEFINITIONS } from '../config/systemConfigDefinitions';

const prisma = new PrismaClient();

async function seedSystemConfig() {
  console.log('🌱 Seeding system configurations with default values...');

  // Use static definitions to seed only the values
  // Seed default values for all defined configurations
  for (const definition of SYSTEM_CONFIG_DEFINITIONS) {
    try {
      const optionsJson = definition.options ? JSON.stringify(definition.options) : null;

      await prisma.systemConfig.upsert({
        where: { key: definition.key },
        update: {
          // Update options if they exist in definition, preserve existing values
          ...(optionsJson && { options: optionsJson })
        },
        create: {
          key: definition.key,
          value: definition.defaultValue,
          options: optionsJson,
        },
      });
      console.log(`✅ Seeded config: ${definition.key} = ${definition.defaultValue}${optionsJson ? ' (with options)' : ''}`);
    } catch (error) {
      console.error(`❌ Failed to seed config ${definition.key}:`, error);
    }
  }

  console.log('🎉 System configuration seeding completed!');
}

async function main() {
  try {
    await seedSystemConfig();
  } catch (error) {
    console.error('Error seeding system configurations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedSystemConfig };
