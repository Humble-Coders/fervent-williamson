// System configuration service
import { env } from '../config/env';
import { logger } from '@/config/logger';

const API_BASE_URL = env.API_URL;

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

export interface ConfigResponse {
  success: boolean;
  data: SystemConfig[];
  message: string;
}

export interface SingleConfigResponse {
  success: boolean;
  data: SystemConfig;
  message: string;
}

class ConfigService {
  // Get all system configurations
  async getAllConfigs(): Promise<SystemConfig[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/system-config`);
      const data: ConfigResponse = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch configurations');
      }
    } catch (error) {
      logger.error('Error fetching configurations:', error);
      throw error;
    }
  }

  // Get a specific configuration by key
  async getConfig(key: string): Promise<SystemConfig> {
    try {
      const response = await fetch(`${API_BASE_URL}/system-config/${key}`);
      const data: SingleConfigResponse = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch configuration');
      }
    } catch (error) {
      logger.error(`Error fetching configuration ${key}:`, error);
      throw error;
    }
  }

  // Update a configuration
  async updateConfig(key: string, value: string): Promise<SystemConfig> {
    try {
      const response = await fetch(`${API_BASE_URL}/system-config/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });

      const data: SingleConfigResponse = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update configuration');
      }
    } catch (error) {
      logger.error(`Error updating configuration ${key}:`, error);
      throw error;
    }
  }

  // Add a new option to a select field
  async addOption(key: string, value: string, label: string): Promise<{ key: string; options: Array<{ value: string; label: string }> }> {
    try {
      const response = await fetch(`${API_BASE_URL}/system-config/${key}/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value, label }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to add option');
      }
    } catch (error) {
      logger.error(`Error adding option to ${key}:`, error);
      throw error;
    }
  }

  // Helper methods for specific configurations
  async isEmailVerificationEnabled(): Promise<boolean> {
    try {
      const config = await this.getConfig('email_verification_enabled');
      return config.value === 'true';
    } catch (error) {
      logger.error('Error checking email verification status:', error);
      return true; // Default to enabled if error
    }
  }

  async isSmsVerificationEnabled(): Promise<boolean> {
    try {
      const config = await this.getConfig('sms_verification_enabled');
      return config.value === 'true';
    } catch (error) {
      logger.error('Error checking SMS verification status:', error);
      return true; // Default to enabled if error
    }
  }

  async isVerificationEnabled(type: 'email' | 'phone'): Promise<boolean> {
    if (type === 'email') {
      return this.isEmailVerificationEnabled();
    } else {
      return this.isSmsVerificationEnabled();
    }
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
