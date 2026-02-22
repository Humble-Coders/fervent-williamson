import {
  FirestoreService,
  db,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from './firestore/firestoreService';
import { logger } from '@/config/logger';

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  type: 'boolean' | 'string' | 'number' | 'json' | 'select' | 'multiselect' | 'array';
  category: string;
  name: string;
  description: string;
  options?: Array<{ value: string; label: string }>;
  allowAddOptions?: boolean;
  isActive: boolean;
}

const configFs = new FirestoreService<SystemConfig>('config');

class ConfigService {
  // Get all system configurations
  async getAllConfigs(): Promise<SystemConfig[]> {
    try {
      return await configFs.getAll();
    } catch (error) {
      logger.error('Error fetching configurations:', error);
      throw error;
    }
  }

  // Get a specific configuration by key
  async getConfig(key: string): Promise<SystemConfig> {
    try {
      const docSnap = await getDoc(doc(db, 'config', key));
      if (!docSnap.exists()) {
        throw new Error(`Configuration ${key} not found`);
      }
      const data = docSnap.data();
      return { id: docSnap.id, key: docSnap.id, ...data } as SystemConfig;
    } catch (error) {
      logger.error(`Error fetching configuration ${key}:`, error);
      throw error;
    }
  }

  // Update a configuration
  async updateConfig(key: string, value: string): Promise<SystemConfig> {
    try {
      const ref = doc(db, 'config', key);
      await updateDoc(ref, {
        value,
        updatedAt: serverTimestamp(),
      });
      return this.getConfig(key);
    } catch (error) {
      logger.error(`Error updating configuration ${key}:`, error);
      throw error;
    }
  }

  // Add a new option to a select field
  async addOption(key: string, value: string, label: string): Promise<{ key: string; options: Array<{ value: string; label: string }> }> {
    try {
      const config = await this.getConfig(key);
      const options = config.options || [];
      options.push({ value, label });

      await updateDoc(doc(db, 'config', key), {
        options,
        updatedAt: serverTimestamp(),
      });

      return { key, options };
    } catch (error) {
      logger.error(`Error adding option to ${key}:`, error);
      throw error;
    }
  }

  // Helper: check email verification
  async isEmailVerificationEnabled(): Promise<boolean> {
    try {
      const config = await this.getConfig('email_verification_enabled');
      return config.value === 'true';
    } catch {
      return true;
    }
  }

  // Helper: check SMS verification
  async isSmsVerificationEnabled(): Promise<boolean> {
    try {
      const config = await this.getConfig('sms_verification_enabled');
      return config.value === 'true';
    } catch {
      return true;
    }
  }

  // Helper: check verification by type
  async isVerificationEnabled(type: 'email' | 'phone'): Promise<boolean> {
    return type === 'email'
      ? this.isEmailVerificationEnabled()
      : this.isSmsVerificationEnabled();
  }

  // Get configuration value as boolean
  getConfigValueAsBoolean(config: SystemConfig): boolean {
    return config.value === 'true';
  }

  // Get configuration value as number
  getConfigValueAsNumber(config: SystemConfig): number {
    return parseInt(config.value, 10) || 0;
  }

  // Get configuration value as JSON
  getConfigValueAsJson(config: SystemConfig): any {
    try {
      return JSON.parse(config.value);
    } catch (error) {
      logger.error(`Error parsing JSON config ${config.key}:`, error);
      return null;
    }
  }
}

export const configService = new ConfigService();
export default configService;
