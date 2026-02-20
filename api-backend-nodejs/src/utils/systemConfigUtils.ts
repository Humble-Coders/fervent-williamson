import { PrismaClient } from '@prisma/client';
import { getConfigDefinition } from '../config/systemConfigDefinitions';

const prisma = new PrismaClient();

/**
 * Get a system configuration value by key
 * Returns the stored value from database or default value if not found
 */
export async function getConfigValue(key: string, fallbackDefault?: string): Promise<string> {
  try {
    // Get static definition
    const definition = getConfigDefinition(key);
    if (!definition) {
      console.warn(`System config definition not found for key: ${key}`);
      return fallbackDefault || '';
    }

    // Get stored value from database
    const storedConfig = await prisma.systemConfig.findUnique({
      where: { key },
    });

    // Return stored value or default value
    return storedConfig?.value || definition.defaultValue || fallbackDefault || '';
  } catch (error) {
    console.error(`Error fetching system config for key ${key}:`, error);
    return fallbackDefault || '';
  }
}

/**
 * Get a parsed system configuration value (for JSON, boolean, number types)
 */
export async function getParsedConfigValue(key: string, fallbackDefault?: any): Promise<any> {
  try {
    const definition = getConfigDefinition(key);
    if (!definition) {
      return fallbackDefault;
    }

    const value = await getConfigValue(key);
    
    // Parse based on type
    switch (definition.type) {
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'number':
        return parseInt(value, 10) || 0;
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return fallbackDefault;
        }
      default:
        return value;
    }
  } catch (error) {
    console.error(`Error parsing system config for key ${key}:`, error);
    return fallbackDefault;
  }
}

/**
 * Check if a system configuration is enabled (for boolean configs)
 */
export async function isConfigEnabled(key: string): Promise<boolean> {
  const value = await getConfigValue(key, 'false');
  return value.toLowerCase() === 'true';
}
