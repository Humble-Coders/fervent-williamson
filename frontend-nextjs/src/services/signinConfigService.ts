import { buildApiUrl } from '../config/env';
import { logger } from '@/config/logger';

export interface SigninConfig {
  emailEnabled: boolean;
  phoneEnabled: boolean;
  whatsappEnabled: boolean;
}

class SigninConfigService {
  private cache: SigninConfig | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getSigninConfig(): Promise<SigninConfig> {
    // Return cached config if still valid
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      // Fetch multiple config values in parallel
      const [emailResponse, phoneResponse, whatsappResponse] = await Promise.all([
        fetch(buildApiUrl('system-config/signin_email_enabled')),
        fetch(buildApiUrl('system-config/signin_phone_enabled')),
        fetch(buildApiUrl('system-config/signin_whatsapp_enabled'))
      ]);

      const [emailData, phoneData, whatsappData] = await Promise.all([
        emailResponse.json(),
        phoneResponse.json(),
        whatsappResponse.json()
      ]);

      const config: SigninConfig = {
        emailEnabled: emailData.success ? emailData.data.value === 'true' : true, // Default to true
        phoneEnabled: phoneData.success ? phoneData.data.value === 'true' : true, // Default to true
        whatsappEnabled: whatsappData.success ? whatsappData.data.value === 'true' : false, // Default to false
      };

      // Cache the result
      this.cache = config;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return config;
    } catch (error) {
      logger.error('Failed to fetch signin config:', error);
      
      // Return default config on error
      return {
        emailEnabled: true,
        phoneEnabled: true,
        whatsappEnabled: false,
      };
    }
  }

  // Clear cache to force refresh
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }
}

export const signinConfigService = new SigninConfigService();
