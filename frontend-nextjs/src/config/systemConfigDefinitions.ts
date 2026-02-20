// Static system configuration definitions for frontend
// These match the backend definitions and are used to render the admin interface

export interface ConfigDefinition {
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'json' | 'select' | 'multiselect' | 'array' | 'template';
  category: string;
  defaultValue: string;
  isPublic?: boolean;
  options?: Array<{ value: string; label: string } | { id: string; message: string; templateId: string }>; // For select type or template type
  allowAddOptions?: boolean; // Whether admins can add new options via UI
}

export const SYSTEM_CONFIG_DEFINITIONS: ConfigDefinition[] = [
  // Authentication Settings
  {
    key: 'email_verification_enabled',
    name: 'Email Verification Required',
    description: 'Require email verification for new user registrations',
    type: 'boolean',
    category: 'auth',
    defaultValue: 'true',
  },
  {
    key: 'phone_verification_enabled',
    name: 'Phone Verification Required',
    description: 'Require phone number verification for new user registrations',
    type: 'boolean',
    category: 'auth',
    defaultValue: 'false',
  },
  {
    key: 'sms_verification_enabled',
    name: 'SMS Verification Enabled',
    description: 'Enable SMS verification for phone number authentication',
    type: 'boolean',
    category: 'auth',
    defaultValue: 'true',
  },
  {
    key: 'social_login_enabled',
    name: 'Social Login Enabled',
    description: 'Allow users to login with social media accounts',
    type: 'boolean',
    category: 'auth',
    defaultValue: 'true',
  },
  {
    key: 'guest_booking_enabled',
    name: 'Guest Booking Enabled',
    description: 'Allow users to book appointments without creating an account',
    type: 'boolean',
    category: 'auth',
    defaultValue: 'false',
  },
  {
    key: 'password_min_length',
    name: 'Minimum Password Length',
    description: 'Minimum number of characters required for passwords',
    type: 'number',
    category: 'auth',
    defaultValue: '8',
  },
  {
    key: 'sms_service_provider',
    name: 'SMS Service Provider',
    description: 'Select which SMS service to use for sending messages',
    type: 'select',
    category: 'auth',
    defaultValue: 'fast2sms',
    allowAddOptions: true,
    options: [
      { value: 'fast2sms', label: 'Fast2SMS' },
      { value: 'firebase', label: 'Firebase SMS' },
      { value: 'twilio', label: 'Twilio' },
      { value: 'aws_sns', label: 'AWS SNS' },
      { value: 'bulksms', label: 'Bulk SMS' }
    ]
  },
  {
    key: 'bulksms_username',
    name: 'BulkSMS Username',
    description: 'Username for BulkSMS service (configured via BULKSMS_USERNAME environment variable)',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'bulksms_api_key',
    name: 'BulkSMS API Key',
    description: 'API key for BulkSMS service (configured via BULKSMS_API_KEY environment variable)',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'bulksms_sender_id',
    name: 'BulkSMS Sender ID',
    description: 'Sender ID for BulkSMS messages (configured via BULKSMS_SENDER_ID environment variable)',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'session_timeout_hours',
    name: 'Session Timeout (hours)',
    description: 'Number of hours before user sessions expire',
    type: 'number',
    category: 'auth',
    defaultValue: '24',
  },
  {
    key: 'social_login_providers',
    name: 'Social Login Providers',
    description: 'Select which social login providers to enable',
    type: 'multiselect',
    category: 'auth',
    defaultValue: '[]',
    allowAddOptions: true,
    options: [
      { value: 'google', label: 'Google' },
      { value: 'facebook', label: 'Facebook' },
      { value: 'instagram', label: 'Instagram' },
      { value: 'twitter', label: 'Twitter' },
      { value: 'linkedin', label: 'LinkedIn' }
    ]
  },

  // Booking Settings
  {
    key: 'booking_advance_days',
    name: 'Advance Booking Days',
    description: 'Maximum number of days in advance users can book appointments',
    type: 'number',
    category: 'booking',
    defaultValue: '30',
  },
  {
    key: 'booking_min_notice_hours',
    name: 'Minimum Notice Hours',
    description: 'Minimum hours notice required for booking appointments',
    type: 'number',
    category: 'booking',
    defaultValue: '2',
  },
  {
    key: 'booking_cancellation_hours',
    name: 'Cancellation Notice Hours',
    description: 'Minimum hours notice required for cancelling appointments',
    type: 'number',
    category: 'booking',
    defaultValue: '24',
  },
  {
    key: 'booking_confirmation_required',
    name: 'Booking Confirmation Required',
    description: 'Require salon confirmation for new bookings',
    type: 'boolean',
    category: 'booking',
    defaultValue: 'true',
  },
  {
    key: 'booking_reminder_enabled',
    name: 'Booking Reminders Enabled',
    description: 'Send reminder notifications for upcoming appointments',
    type: 'boolean',
    category: 'booking',
    defaultValue: 'true',
  },
  {
    key: 'booking_reminder_hours',
    name: 'Booking Reminder Hours',
    description: 'Hours before appointment to send reminder',
    type: 'number',
    category: 'booking',
    defaultValue: '24',
  },
  {
    key: 'max_concurrent_bookings',
    name: 'Maximum Concurrent Bookings',
    description: 'Maximum number of active bookings per user',
    type: 'number',
    category: 'booking',
    defaultValue: '5',
  },

  // Notification Settings
  {
    key: 'email_notifications_enabled',
    name: 'Email Notifications',
    description: 'Enable email notifications for users',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'false',
  },
  {
    key: 'sms_notifications_enabled',
    name: 'SMS Notifications',
    description: 'Enable SMS notifications for users',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'false',
  },

  // Notification Service Providers
  {
    key: 'notification_sms_service_provider',
    name: 'SMS Service Provider for Notifications',
    description: 'Select which SMS service to use for sending booking notifications',
    type: 'select',
    category: 'notifications',
    defaultValue: 'fast2sms',
    allowAddOptions: true,
    options: [
      { value: 'fast2sms', label: 'Fast2SMS' },
      { value: 'firebase', label: 'Firebase SMS' },
      { value: 'twilio', label: 'Twilio' },
      { value: 'aws_sns', label: 'AWS SNS' },
      { value: 'bulksms', label: 'Bulk SMS' }
    ]
  },
  {
    key: 'notification_email_service_provider',
    name: 'Email Service Provider for Notifications',
    description: 'Select which email service to use for sending booking notifications',
    type: 'select',
    category: 'notifications',
    defaultValue: 'smtp',
    allowAddOptions: true,
    options: [
      { value: 'smtp', label: 'SMTP/Outlook' },
      { value: 'sendgrid', label: 'SendGrid' },
      { value: 'aws_ses', label: 'AWS SES' }
    ]
  },

  // Order Placed Notifications (when customer creates booking)
  {
    key: 'order_request_email_enabled',
    name: 'Order Request - Email Notifications',
    description: 'Send email notifications to salon owner when customer requests a booking',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'false',
  },
  {
    key: 'order_placed_email_enabled',
    name: 'Order Placed - Email Notifications',
    description: 'Send email notifications to customer when they place an order',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'false',
  },
  {
    key: 'order_request_sms_enabled',
    name: 'Order Request - SMS Notifications',
    description: 'Send SMS notifications to salon owner when customer requests a booking',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'false',
  },
  {
    key: 'order_placed_sms_enabled',
    name: 'Order Placed - SMS Notifications',
    description: 'Send SMS notifications to customer when they place an order',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'false',
  },

  // Order Confirmed Notifications (when salon confirms booking)
  {
    key: 'order_confirmed_email_enabled',
    name: 'Order Confirmed - Email Notifications',
    description: 'Send email notifications when salon confirms an order',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'false',
  },
  {
    key: 'order_confirmed_sms_enabled',
    name: 'Order Confirmed - SMS Notifications',
    description: 'Send SMS notifications when salon confirms an order',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'false',
  },

  // SMS Templates
  {
    key: 'sms_template_otp',
    name: 'OTP SMS Template',
    description: 'SMS template for OTP verification. Use {#var#} for dynamic values.',
    type: 'array',
    category: 'notifications',
    defaultValue: '["Your CutQ verification code is {#var#}. Valid for {#var#} minutes. Do not share this code with anyone. Powered by - gem infinity"]',
  },
  {
    key: 'sms_template_booking_request_salon',
    name: 'Booking Request SMS Template (Salon)',
    description: 'SMS template for new booking requests to salon. Use {#var#} for dynamic values.',
    type: 'array',
    category: 'notifications',
    defaultValue: '["CutQ: New booking request from {#var#} for {#var#} on {#var#}at {#var#}. Please confirm via your dashboard. Powered by - gem infinity"]',
  },
  {
    key: 'sms_template_booking_placed_customer',
    name: 'Booking Placed SMS Template (Customer)',
    description: 'SMS template for booking placed confirmation to customer. Use {#var#} for dynamic values.',
    type: 'array',
    category: 'notifications',
    defaultValue: '["CutQ: Your booking at {#var#} is placed successfully! {#var#} at {#var#} for {#var#}. Verification Code: {#var#}. Awaiting confirmation. Powered by - gem infinity"]',
  },
  {
    key: 'sms_template_booking_confirmed_customer',
    name: 'Booking Confirmed SMS Template (Customer)',
    description: 'SMS template for booking confirmation to customer. Use {#var#} for dynamic values.',
    type: 'array',
    category: 'notifications',
    defaultValue: '["CutQ: Your booking at {#var#} is CONFIRMED! {#var#} at {#var#}. Service Code: {#var#}. Present this code. Powered by - gem infinity"]',
  },
  {
    key: 'push_notifications_enabled',
    name: 'Push Notifications',
    description: 'Enable push notifications for mobile apps',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'true',
  },
  {
    key: 'notification_email_from',
    name: 'Notification Email From',
    description: 'Email address used as sender for notifications',
    type: 'string',
    category: 'notifications',
    defaultValue: 'noreply@cutq.store',
  },

  // Payment Settings
  {
    key: 'payment_methods_enabled',
    name: 'Payment Methods',
    description: 'Enabled payment methods (comma-separated)',
    type: 'string',
    category: 'payment',
    defaultValue: 'card,cash,mobile',
  },
  {
    key: 'stripe_enabled',
    name: 'Stripe Payments',
    description: 'Enable Stripe payment processing',
    type: 'boolean',
    category: 'payment',
    defaultValue: 'true',
  },
  {
    key: 'payment_processing_fee',
    name: 'Payment Processing Fee (%)',
    description: 'Percentage fee charged for online payments',
    type: 'number',
    category: 'payment',
    defaultValue: '2.9',
  },
  {
    key: 'refund_policy_days',
    name: 'Refund Policy Days',
    description: 'Number of days within which refunds are allowed',
    type: 'number',
    category: 'payment',
    defaultValue: '7',
  },

  // CutQ/Salon Settings
  {
    key: 'salon_self_signup_enabled',
    name: 'CutQ Self Signup',
    description: 'Allow CutQs to request to join the platform through self-signup',
    type: 'boolean',
    category: 'salon',
    defaultValue: 'false',
  },
  {
    key: 'salon_approval_required',
    name: 'CutQ Approval Required',
    description: 'Require admin approval for new CutQ registrations',
    type: 'boolean',
    category: 'salon',
    defaultValue: 'true',
  },
  {
    key: 'max_services_per_salon',
    name: 'Maximum Services per CutQ',
    description: 'Maximum number of services a CutQ can offer',
    type: 'number',
    category: 'salon',
    defaultValue: '50',
  },
  {
    key: 'max_stylists_per_salon',
    name: 'Maximum Stylists per CutQ',
    description: 'Maximum number of stylists a CutQ can have',
    type: 'number',
    category: 'salon',
    defaultValue: '20',
  },

  // System Settings
  {
    key: 'maintenance_mode',
    name: 'Maintenance Mode',
    description: 'Enable maintenance mode to restrict access',
    type: 'boolean',
    category: 'system',
    defaultValue: 'false',
  },
  {
    key: 'development_mode_enabled',
    name: 'Development Mode',
    description: 'Enable development mode features (static OTP, debug logs, etc.)',
    type: 'boolean',
    category: 'system',
    defaultValue: 'false',
  },
  {
    key: 'static_otp_code',
    name: 'Static OTP Code',
    description: 'Static OTP code used in development mode',
    type: 'string',
    category: 'system',
    defaultValue: '111111',
  },
  {
    key: 'app_name',
    name: 'Application Name',
    description: 'Name of the application displayed to users',
    type: 'string',
    category: 'system',
    defaultValue: 'CutQ',
    isPublic: true,
  },
  {
    key: 'app_version',
    name: 'Application Version',
    description: 'Current version of the application',
    type: 'string',
    category: 'system',
    defaultValue: '1.0.0',
    isPublic: true,
  },
  {
    key: 'max_file_upload_size',
    name: 'Maximum File Upload Size (MB)',
    description: 'Maximum file size allowed for uploads in megabytes',
    type: 'number',
    category: 'system',
    defaultValue: '10',
  },

  // === SMTP/Email Configuration ===
  {
    key: 'smtp_host',
    name: 'SMTP Host',
    description: 'SMTP server hostname (e.g., smtp.gmail.com, smtp.office365.com)',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'smtp_port',
    name: 'SMTP Port',
    description: 'SMTP server port (usually 587 for TLS, 465 for SSL, 25 for non-secure)',
    type: 'number',
    category: 'auth',
    defaultValue: '587',
  },
  {
    key: 'smtp_secure',
    name: 'SMTP Secure (SSL/TLS)',
    description: 'Use SSL/TLS for SMTP connection',
    type: 'boolean',
    category: 'auth',
    defaultValue: 'true',
  },
  {
    key: 'smtp_user',
    name: 'SMTP Username/Email',
    description: 'SMTP authentication username (usually your email address)',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'smtp_password',
    name: 'SMTP Password',
    description: 'SMTP authentication password or app-specific password',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'smtp_from_email',
    name: 'From Email Address',
    description: 'Email address to use as sender',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'smtp_from_name',
    name: 'From Name',
    description: 'Name to display as sender',
    type: 'string',
    category: 'auth',
    defaultValue: 'CutQ',
  },

  // === Outlook/Office365 Configuration ===
  {
    key: 'outlook_client_id',
    name: 'Outlook Client ID',
    description: 'Microsoft Azure App Client ID for Outlook/Office365',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'outlook_client_secret',
    name: 'Outlook Client Secret',
    description: 'Microsoft Azure App Client Secret for Outlook/Office365',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'outlook_tenant_id',
    name: 'Outlook Tenant ID',
    description: 'Microsoft Azure Tenant ID for Outlook/Office365',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'outlook_from_email',
    name: 'Outlook From Email',
    description: 'Email address to use as sender for Outlook',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // === SendGrid Configuration ===
  {
    key: 'sendgrid_api_key',
    name: 'SendGrid API Key',
    description: 'SendGrid API key for sending emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'sendgrid_from_email',
    name: 'SendGrid From Email',
    description: 'Verified sender email address in SendGrid',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'sendgrid_from_name',
    name: 'SendGrid From Name',
    description: 'Name to display as sender in SendGrid emails',
    type: 'string',
    category: 'auth',
    defaultValue: 'CutQ',
  },

  // === AWS SES Configuration ===
  {
    key: 'aws_ses_region',
    name: 'AWS SES Region',
    description: 'AWS region for SES service (e.g., us-east-1, eu-west-1)',
    type: 'string',
    category: 'auth',
    defaultValue: 'us-east-1',
  },
  {
    key: 'aws_ses_access_key_id',
    name: 'AWS SES Access Key ID',
    description: 'AWS IAM Access Key ID for SES',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'aws_ses_secret_access_key',
    name: 'AWS SES Secret Access Key',
    description: 'AWS IAM Secret Access Key for SES',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'aws_ses_from_email',
    name: 'AWS SES From Email',
    description: 'Verified sender email address in AWS SES',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // === Fast2SMS Configuration ===
  {
    key: 'fast2sms_api_key',
    name: 'Fast2SMS API Key',
    description: 'API key for Fast2SMS service',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'fast2sms_sender_id',
    name: 'Fast2SMS Sender ID',
    description: 'Sender ID for Fast2SMS messages (6 characters)',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // === BulkSMS Configuration ===
  {
    key: 'bulksms_username',
    name: 'BulkSMS Username',
    description: 'Username for BulkSMS service',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'bulksms_api_key',
    name: 'BulkSMS API Key',
    description: 'API key for BulkSMS service',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'bulksms_sender_id',
    name: 'BulkSMS Sender ID',
    description: 'Sender ID for BulkSMS messages',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // === Twilio Configuration ===
  {
    key: 'twilio_account_sid',
    name: 'Twilio Account SID',
    description: 'Twilio Account SID for SMS service',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'twilio_auth_token',
    name: 'Twilio Auth Token',
    description: 'Twilio Auth Token for SMS service',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'twilio_phone_number',
    name: 'Twilio Phone Number',
    description: 'Twilio phone number to send SMS from (with country code, e.g., +1234567890)',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // === AWS SNS Configuration ===
  {
    key: 'aws_sns_region',
    name: 'AWS SNS Region',
    description: 'AWS region for SNS service (e.g., us-east-1, eu-west-1)',
    type: 'string',
    category: 'auth',
    defaultValue: 'us-east-1',
  },
  {
    key: 'aws_sns_access_key_id',
    name: 'AWS SNS Access Key ID',
    description: 'AWS IAM Access Key ID for SNS',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'aws_sns_secret_access_key',
    name: 'AWS SNS Secret Access Key',
    description: 'AWS IAM Secret Access Key for SNS',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // ========================================
  // AUTHENTICATION-SPECIFIC CONFIGURATIONS
  // ========================================

  // Toggle to use general settings or auth-specific settings
  {
    key: 'auth_use_general_email_config',
    name: 'Use General Email Settings',
    description: 'Use general email provider settings for authentication emails',
    type: 'boolean',
    category: 'auth',
    defaultValue: 'true',
  },
  {
    key: 'auth_use_general_sms_config',
    name: 'Use General SMS Settings',
    description: 'Use general SMS provider settings for authentication messages',
    type: 'boolean',
    category: 'auth',
    defaultValue: 'true',
  },

  // Auth-specific Email Service Provider
  {
    key: 'auth_email_service_provider',
    name: 'Auth Email Service Provider',
    description: 'Email service provider for authentication emails (only used if not using general settings)',
    type: 'select',
    category: 'auth',
    defaultValue: 'smtp',
    allowAddOptions: true,
    options: [
      { value: 'smtp', label: 'SMTP (Generic - Gmail, GoDaddy, etc.)' },
      { value: 'outlook', label: 'Outlook/Office365' },
      { value: 'sendgrid', label: 'SendGrid' },
      { value: 'aws_ses', label: 'AWS SES' }
    ]
  },

  // Auth-specific SMS Service Provider
  {
    key: 'auth_sms_service_provider',
    name: 'Auth SMS Service Provider',
    description: 'SMS service provider for authentication messages (only used if not using general settings)',
    type: 'select',
    category: 'auth',
    defaultValue: 'fast2sms',
    allowAddOptions: true,
    options: [
      { value: 'fast2sms', label: 'Fast2SMS' },
      { value: 'firebase', label: 'Firebase SMS' },
      { value: 'twilio', label: 'Twilio' },
      { value: 'aws_sns', label: 'AWS SNS' },
      { value: 'bulksms', label: 'Bulk SMS' }
    ]
  },

  // === Auth-specific SMTP Configuration ===
  {
    key: 'auth_smtp_host',
    name: 'Auth SMTP Host',
    description: 'SMTP server hostname for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_smtp_port',
    name: 'Auth SMTP Port',
    description: 'SMTP server port for authentication emails',
    type: 'number',
    category: 'auth',
    defaultValue: '587',
  },
  {
    key: 'auth_smtp_secure',
    name: 'Auth SMTP Secure (SSL/TLS)',
    description: 'Use SSL/TLS for authentication SMTP connection',
    type: 'boolean',
    category: 'auth',
    defaultValue: 'true',
  },
  {
    key: 'auth_smtp_user',
    name: 'Auth SMTP Username/Email',
    description: 'SMTP authentication username for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_smtp_password',
    name: 'Auth SMTP Password',
    description: 'SMTP authentication password for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_smtp_from_email',
    name: 'Auth From Email Address',
    description: 'Email address to use as sender for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_smtp_from_name',
    name: 'Auth From Name',
    description: 'Name to display as sender for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: 'CutQ',
  },

  // === Auth-specific Outlook Configuration ===
  {
    key: 'auth_outlook_client_id',
    name: 'Auth Outlook Client ID',
    description: 'Microsoft Azure App Client ID for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_outlook_client_secret',
    name: 'Auth Outlook Client Secret',
    description: 'Microsoft Azure App Client Secret for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_outlook_tenant_id',
    name: 'Auth Outlook Tenant ID',
    description: 'Microsoft Azure Tenant ID for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_outlook_from_email',
    name: 'Auth Outlook From Email',
    description: 'Email address to use as sender for authentication emails via Outlook',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // === Auth-specific SendGrid Configuration ===
  {
    key: 'auth_sendgrid_api_key',
    name: 'Auth SendGrid API Key',
    description: 'SendGrid API key for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_sendgrid_from_email',
    name: 'Auth SendGrid From Email',
    description: 'Verified sender email address in SendGrid for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_sendgrid_from_name',
    name: 'Auth SendGrid From Name',
    description: 'Name to display as sender in SendGrid authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: 'CutQ',
  },

  // === Auth-specific AWS SES Configuration ===
  {
    key: 'auth_aws_ses_region',
    name: 'Auth AWS SES Region',
    description: 'AWS region for SES service for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: 'us-east-1',
  },
  {
    key: 'auth_aws_ses_access_key_id',
    name: 'Auth AWS SES Access Key ID',
    description: 'AWS IAM Access Key ID for SES for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_aws_ses_secret_access_key',
    name: 'Auth AWS SES Secret Access Key',
    description: 'AWS IAM Secret Access Key for SES for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_aws_ses_from_email',
    name: 'Auth AWS SES From Email',
    description: 'Verified sender email address in AWS SES for authentication emails',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // === Auth-specific Fast2SMS Configuration ===
  {
    key: 'auth_fast2sms_mode',
    name: 'Auth Fast2SMS Mode',
    description: 'Select Fast2SMS message mode for authentication (only applies when Fast2SMS is selected)',
    type: 'select',
    category: 'auth',
    defaultValue: 'otp',
    allowAddOptions: true,
    options: [
      { value: 'otp', label: 'OTP Mode' },
      { value: 'transactional', label: 'Transactional Mode' },
      { value: 'promotional', label: 'Promotional Mode' },
    ],
  },
  {
    key: 'auth_fast2sms_api_key',
    name: 'Auth Fast2SMS API Key',
    description: 'API key for Fast2SMS service for authentication messages',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_fast2sms_sender_id',
    name: 'Auth Fast2SMS Sender ID',
    description: 'Sender ID for Fast2SMS authentication messages (6 characters)',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // === Auth-specific BulkSMS Configuration ===
  {
    key: 'auth_bulksms_username',
    name: 'Auth BulkSMS Username',
    description: 'Username for BulkSMS service for authentication messages',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_bulksms_api_key',
    name: 'Auth BulkSMS API Key',
    description: 'API key for BulkSMS service for authentication messages',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_bulksms_sender_id',
    name: 'Auth BulkSMS Sender ID',
    description: 'Sender ID for BulkSMS authentication messages',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // === Auth-specific Twilio Configuration ===
  {
    key: 'auth_twilio_account_sid',
    name: 'Auth Twilio Account SID',
    description: 'Twilio Account SID for authentication SMS',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_twilio_auth_token',
    name: 'Auth Twilio Auth Token',
    description: 'Twilio Auth Token for authentication SMS',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_twilio_phone_number',
    name: 'Auth Twilio Phone Number',
    description: 'Twilio phone number to send authentication SMS from (with country code)',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // === Auth-specific AWS SNS Configuration ===
  {
    key: 'auth_aws_sns_region',
    name: 'Auth AWS SNS Region',
    description: 'AWS region for SNS service for authentication SMS',
    type: 'string',
    category: 'auth',
    defaultValue: 'us-east-1',
  },
  {
    key: 'auth_aws_sns_access_key_id',
    name: 'Auth AWS SNS Access Key ID',
    description: 'AWS IAM Access Key ID for SNS for authentication SMS',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },
  {
    key: 'auth_aws_sns_secret_access_key',
    name: 'Auth AWS SNS Secret Access Key',
    description: 'AWS IAM Secret Access Key for SNS for authentication SMS',
    type: 'string',
    category: 'auth',
    defaultValue: '',
  },

  // ========================================
  // NOTIFICATION-SPECIFIC CONFIGURATIONS
  // ========================================

  // Toggle to use general settings or notification-specific settings
  {
    key: 'notification_use_general_email_config',
    name: 'Use General Email Settings',
    description: 'Use general email provider settings for notification emails',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'true',
  },
  {
    key: 'notification_use_general_sms_config',
    name: 'Use General SMS Settings',
    description: 'Use general SMS provider settings for notification messages',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'true',
  },

  // === Notification-specific SMTP Configuration ===
  {
    key: 'notification_smtp_host',
    name: 'Notification SMTP Host',
    description: 'SMTP server hostname for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_smtp_port',
    name: 'Notification SMTP Port',
    description: 'SMTP server port for notification emails',
    type: 'number',
    category: 'notifications',
    defaultValue: '587',
  },
  {
    key: 'notification_smtp_secure',
    name: 'Notification SMTP Secure (SSL/TLS)',
    description: 'Use SSL/TLS for notification SMTP connection',
    type: 'boolean',
    category: 'notifications',
    defaultValue: 'true',
  },
  {
    key: 'notification_smtp_user',
    name: 'Notification SMTP Username/Email',
    description: 'SMTP authentication username for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_smtp_password',
    name: 'Notification SMTP Password',
    description: 'SMTP authentication password for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_smtp_from_email',
    name: 'Notification From Email Address',
    description: 'Email address to use as sender for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_smtp_from_name',
    name: 'Notification From Name',
    description: 'Name to display as sender for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: 'CutQ',
  },

  // === Notification-specific Outlook Configuration ===
  {
    key: 'notification_outlook_client_id',
    name: 'Notification Outlook Client ID',
    description: 'Microsoft Azure App Client ID for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_outlook_client_secret',
    name: 'Notification Outlook Client Secret',
    description: 'Microsoft Azure App Client Secret for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_outlook_tenant_id',
    name: 'Notification Outlook Tenant ID',
    description: 'Microsoft Azure Tenant ID for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_outlook_from_email',
    name: 'Notification Outlook From Email',
    description: 'Email address to use as sender for notification emails via Outlook',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },

  // === Notification-specific SendGrid Configuration ===
  {
    key: 'notification_sendgrid_api_key',
    name: 'Notification SendGrid API Key',
    description: 'SendGrid API key for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_sendgrid_from_email',
    name: 'Notification SendGrid From Email',
    description: 'Verified sender email address in SendGrid for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_sendgrid_from_name',
    name: 'Notification SendGrid From Name',
    description: 'Name to display as sender in SendGrid notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: 'CutQ',
  },

  // === Notification-specific AWS SES Configuration ===
  {
    key: 'notification_aws_ses_region',
    name: 'Notification AWS SES Region',
    description: 'AWS region for SES service for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: 'us-east-1',
  },
  {
    key: 'notification_aws_ses_access_key_id',
    name: 'Notification AWS SES Access Key ID',
    description: 'AWS IAM Access Key ID for SES for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_aws_ses_secret_access_key',
    name: 'Notification AWS SES Secret Access Key',
    description: 'AWS IAM Secret Access Key for SES for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_aws_ses_from_email',
    name: 'Notification AWS SES From Email',
    description: 'Verified sender email address in AWS SES for notification emails',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },

  // === Notification-specific Fast2SMS Configuration ===
  {
    key: 'notification_fast2sms_mode',
    name: 'Notification Fast2SMS Mode',
    description: 'Select Fast2SMS message mode for notifications (only applies when Fast2SMS is selected)',
    type: 'select',
    category: 'notifications',
    defaultValue: 'otp',
    allowAddOptions: true,
    options: [
      { value: 'otp', label: 'OTP Mode' },
      { value: 'transactional', label: 'Transactional Mode' },
      { value: 'promotional', label: 'Promotional Mode' },
    ],
  },
  {
    key: 'notification_fast2sms_api_key',
    name: 'Notification Fast2SMS API Key',
    description: 'API key for Fast2SMS service for notification messages',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_fast2sms_sender_id',
    name: 'Notification Fast2SMS Sender ID',
    description: 'Sender ID for Fast2SMS notification messages (6 characters)',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },

  // === Notification-specific BulkSMS Configuration ===
  {
    key: 'notification_bulksms_username',
    name: 'Notification BulkSMS Username',
    description: 'Username for BulkSMS service for notification messages',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_bulksms_api_key',
    name: 'Notification BulkSMS API Key',
    description: 'API key for BulkSMS service for notification messages',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_bulksms_sender_id',
    name: 'Notification BulkSMS Sender ID',
    description: 'Sender ID for BulkSMS notification messages',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },

  // === Notification-specific Twilio Configuration ===
  {
    key: 'notification_twilio_account_sid',
    name: 'Notification Twilio Account SID',
    description: 'Twilio Account SID for notification SMS',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_twilio_auth_token',
    name: 'Notification Twilio Auth Token',
    description: 'Twilio Auth Token for notification SMS',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_twilio_phone_number',
    name: 'Notification Twilio Phone Number',
    description: 'Twilio phone number to send notification SMS from (with country code)',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },

  // === Notification-specific AWS SNS Configuration ===
  {
    key: 'notification_aws_sns_region',
    name: 'Notification AWS SNS Region',
    description: 'AWS region for SNS service for notification SMS',
    type: 'string',
    category: 'notifications',
    defaultValue: 'us-east-1',
  },
  {
    key: 'notification_aws_sns_access_key_id',
    name: 'Notification AWS SNS Access Key ID',
    description: 'AWS IAM Access Key ID for SNS for notification SMS',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
  {
    key: 'notification_aws_sns_secret_access_key',
    name: 'Notification AWS SNS Secret Access Key',
    description: 'AWS IAM Secret Access Key for SNS for notification SMS',
    type: 'string',
    category: 'notifications',
    defaultValue: '',
  },
];

// Helper functions
export const getConfigDefinition = (key: string): ConfigDefinition | undefined => {
  return SYSTEM_CONFIG_DEFINITIONS.find(config => config.key === key);
};

export const getConfigsByCategory = (category: string): ConfigDefinition[] => {
  return SYSTEM_CONFIG_DEFINITIONS.filter(config => config.category === category);
};

export const getAllCategories = (): string[] => {
  const categories = SYSTEM_CONFIG_DEFINITIONS.map(config => config.category);
  return [...new Set(categories)].sort();
};

export const getPublicConfigs = (): ConfigDefinition[] => {
  return SYSTEM_CONFIG_DEFINITIONS.filter(config => config.isPublic);
};

export const getCategoryDisplayName = (category: string): string => {
  const categoryNames: Record<string, string> = {
    auth: 'Authentication',
    booking: 'Booking',
    notifications: 'Notifications',
    payment: 'Payment',
    salon: 'CutQ Management',
    system: 'System',
    analytics: 'Analytics',
  };
  
  return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
};
