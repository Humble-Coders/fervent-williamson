# Backend Architecture - Modular & Reusable

## 🎯 Overview

The backend has been restructured to follow industry best practices for modularity, reusability, and maintainability. The new architecture allows the codebase to be used across different projects with minimal changes.

## 🏗️ Architecture Principles

### 1. **Dependency Injection**
- All services use dependency injection via a custom IoC container
- Easy to swap implementations and test with mocks
- Clear separation of concerns

### 2. **Provider Pattern**
- Multiple providers for each service (SMS, Email, Storage, etc.)
- Easy to switch providers via configuration
- Consistent interfaces across all providers

### 3. **Configuration-Driven**
- All provider settings come from environment variables
- Centralized configuration management
- Easy to deploy across different environments

### 4. **Business Logic Separation**
- Core services are business-agnostic
- Business-specific logic is optional and configurable
- Easy to adapt for different industries

## 📁 New Directory Structure

```
backend/src/
├── core/                    # Core framework components
│   ├── container.ts         # Dependency injection container
│   ├── BaseService.ts       # Base class for all services
│   └── serviceRegistry.ts   # Service registration
├── config/                  # Configuration management
│   ├── providers.ts         # Provider interfaces
│   ├── configLoader.ts      # Configuration loader
│   └── env.ts              # Environment variables
├── interfaces/              # Service contracts
│   └── services.ts         # All service interfaces
├── services/               # Business services
│   ├── auth/               # Authentication service
│   ├── otp/                # OTP service
│   ├── sms/                # SMS providers
│   │   └── providers/      # SMS provider implementations
│   └── email/              # Email providers
│       └── providers/      # Email provider implementations
└── repositories/           # Data access layer (to be implemented)
```

## 🔧 Supported Providers

### SMS Providers
- **Fast2SMS** - Indian SMS service
- **Twilio** - Global SMS service
- **AWS SNS** - Amazon SMS service
- **Firebase** - Custom Firebase Functions

### Email Providers
- **SendGrid** - Cloud email service
- **SMTP** - Standard SMTP (including Outlook/Office365)
- **AWS SES** - Amazon email service

### Authentication Methods
- **Email/Password** - Traditional authentication
- **Phone/OTP** - Phone number with OTP verification
- **Social Auth** - Google, Facebook, Apple
- **Firebase Auth** - Firebase authentication

## ⚙️ Configuration

### Environment Variables

```bash
# App Configuration
APP_NAME=CutQ
APP_VERSION=1.0.0
NODE_ENV=production

# SMS Provider (fast2sms|twilio|aws-sns|firebase)
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your_api_key

# Email Provider (sendgrid|smtp|outlook|aws-ses)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
SMTP_FROM_NAME=CutQ Platform

# Features (enable/disable)
ENABLE_EMAIL_VERIFICATION=true
ENABLE_SMS_VERIFICATION=true
ENABLE_SOCIAL_AUTH=true

# Business Features (optional)
ENABLE_LOYALTY_PROGRAM=true
ENABLE_BOOKING_SYSTEM=true
ENABLE_MULTI_TENANT=false
```

## 🚀 Usage Examples

### 1. Sending OTP

```typescript
import { getService } from '../core/container';
import { IOTPService } from '../interfaces/services';

const otpService = getService<IOTPService>('otp');

// Send email OTP
const result = await otpService.sendOTP({
  contact: 'user@example.com',
  type: 'email',
  purpose: 'verification'
});

// Send SMS OTP
const smsResult = await otpService.sendOTP({
  contact: '+1234567890',
  type: 'sms',
  purpose: 'login'
});
```

### 2. User Authentication

```typescript
import { getService } from '../core/container';
import { IAuthService } from '../interfaces/services';

const authService = getService<IAuthService>('auth');

// Register user
const registerResult = await authService.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securepassword'
});

// Login user
const loginResult = await authService.login({
  email: 'john@example.com',
  password: 'securepassword'
});
```

### 3. Sending Emails

```typescript
import { getService } from '../core/container';
import { IEmailService } from '../interfaces/services';

const emailService = getService<IEmailService>('emailService');

// Send template email
const result = await emailService.sendTemplate('welcome', 'user@example.com', {
  appName: 'CutQ',
  userName: 'John Doe'
});

// Send custom email
const customResult = await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<h1>Hello World</h1>',
  text: 'Hello World'
});
```

## 🔄 Switching Providers

To switch providers, simply change the environment variables:

```bash
# Switch from Fast2SMS to Twilio
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Switch from SMTP to SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_api_key
```

## 🧪 Testing

The new architecture makes testing much easier:

```typescript
import { container } from '../core/container';
import { IOTPService } from '../interfaces/services';

// Mock OTP service for testing
class MockOTPService implements IOTPService {
  async sendOTP() {
    return { success: true, data: { otp: '123456' } };
  }
  // ... other methods
}

// Register mock in tests
container.instance<IOTPService>('otp', new MockOTPService());
```

## 📊 Service Health Monitoring

```typescript
import { getServiceStatus, testServiceConnections } from '../core/serviceRegistry';

// Get service registration status
const status = getServiceStatus();
console.log(status);

// Test all service connections
const connections = await testServiceConnections();
console.log(connections);
```

## 🔧 Adding New Providers

To add a new SMS provider:

1. Create provider class implementing `ISMSService`
2. Add to `SMSServiceFactory`
3. Update configuration validation
4. Add environment variables

Example:
```typescript
// services/sms/providers/NewProvider.ts
export class NewProvider extends BaseService implements ISMSService {
  // Implementation
}

// services/sms/SMSServiceFactory.ts
case 'new-provider':
  return new NewProvider(config);
```

## 🎯 Benefits

1. **Reusability**: Core services work across different projects
2. **Flexibility**: Easy to switch providers without code changes
3. **Testability**: Dependency injection makes testing straightforward
4. **Maintainability**: Clear separation of concerns
5. **Scalability**: Modular architecture supports growth
6. **Configuration**: Environment-driven configuration
7. **Monitoring**: Built-in service health monitoring

## 🚀 Migration Guide

To migrate existing code:

1. Update service imports to use dependency injection
2. Replace direct provider calls with service interfaces
3. Move configuration to environment variables
4. Update tests to use mocked services

The new architecture is backward compatible and can be adopted gradually.
