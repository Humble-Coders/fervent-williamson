'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter, useParams } from 'next/navigation';
import { Save, Shield, Bell, IndianRupee, Calendar, Mail, Phone, Settings as SettingsIcon, Building2, Cog, Users, Globe, BarChart3, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import MultiSelect from '../../components/ui/MultiSelect';
import Switch from '../../components/ui/Switch';
import AnalyticsSettings from '../../components/admin/AnalyticsSettings';
import { buildApiUrl } from '../../config/env';
import {
  SYSTEM_CONFIG_DEFINITIONS,
  getConfigsByCategory,
  getAllCategories,
  ConfigDefinition
} from '../../config/systemConfigDefinitions';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  type: 'boolean' | 'string' | 'number' | 'json' | 'select' | 'multiselect' | 'array' | 'template';
  category: string;
  name: string;
  description: string;
  options?: Array<{ value: string; label: string } | { id: string; message: string; templateId: string }>;
  allowAddOptions?: boolean;
  isActive: boolean;
}

// Define tab configuration with better organization
const TAB_CONFIG = {
  general: {
    id: 'general',
    name: 'General',
    icon: Globe,
    description: 'Basic application settings and provider configurations',
    categories: ['system'],
    subTabs: {
      system: {
        id: 'system',
        name: 'System',
        icon: SettingsIcon,
        description: 'General system settings',
        authKeys: ['app_name', 'app_version', 'max_file_upload_size', 'maintenance_mode', 'development_mode_enabled', 'static_otp_code']
      },
      emailProviders: {
        id: 'emailProviders',
        name: 'Email Providers',
        icon: Mail,
        description: 'Configure email service providers (used by Authentication & Notifications)',
        authKeys: [],
        serviceKeys: [
          'email_service_provider',
          // SMTP credentials
          'smtp_host',
          'smtp_port',
          'smtp_secure',
          'smtp_user',
          'smtp_password',
          'smtp_from_email',
          'smtp_from_name',
          // Outlook credentials
          'outlook_client_id',
          'outlook_client_secret',
          'outlook_tenant_id',
          'outlook_from_email',
          // SendGrid credentials
          'sendgrid_api_key',
          'sendgrid_from_email',
          'sendgrid_from_name',
          // AWS SES credentials
          'aws_ses_region',
          'aws_ses_access_key_id',
          'aws_ses_secret_access_key',
          'aws_ses_from_email'
        ]
      },
      smsProviders: {
        id: 'smsProviders',
        name: 'SMS Providers',
        icon: Phone,
        description: 'Configure SMS service providers (used by Authentication & Notifications)',
        authKeys: [],
        serviceKeys: [
          'sms_service_provider',
          // Fast2SMS configuration
          'fast2sms_mode',
          'fast2sms_api_key',
          'fast2sms_sender_id',
          // BulkSMS credentials
          'bulksms_username',
          'bulksms_api_key',
          'bulksms_sender_id',
          // Twilio credentials
          'twilio_account_sid',
          'twilio_auth_token',
          'twilio_phone_number',
          // AWS SNS credentials
          'aws_sns_region',
          'aws_sns_access_key_id',
          'aws_sns_secret_access_key'
        ]
      }
    }
  },
  authentication: {
    id: 'authentication',
    name: 'Authentication',
    icon: Shield,
    description: 'User authentication and security settings',
    categories: ['auth'],
    subTabs: {
      phone: {
        id: 'phone',
        name: 'Phone',
        icon: Phone,
        description: 'Phone authentication settings',
        authKeys: [
          'phone_verification_enabled',
          'sms_verification_enabled',
          'signin_phone_enabled',
          'auth_use_general_sms_config'
        ],
        serviceKeys: [
          'auth_sms_service_provider',
          // Fast2SMS configuration
          'auth_fast2sms_mode',
          'auth_fast2sms_api_key',
          'auth_fast2sms_sender_id',
          // BulkSMS credentials
          'auth_bulksms_username',
          'auth_bulksms_api_key',
          'auth_bulksms_sender_id',
          // Twilio credentials
          'auth_twilio_account_sid',
          'auth_twilio_auth_token',
          'auth_twilio_phone_number',
          // AWS SNS credentials
          'auth_aws_sns_region',
          'auth_aws_sns_access_key_id',
          'auth_aws_sns_secret_access_key'
        ]
      },
      email: {
        id: 'email',
        name: 'Email',
        icon: Mail,
        description: 'Email authentication settings',
        authKeys: [
          'email_verification_enabled',
          'signin_email_enabled',
          'auth_use_general_email_config'
        ],
        serviceKeys: [
          'auth_email_service_provider',
          // SMTP credentials
          'auth_smtp_host',
          'auth_smtp_port',
          'auth_smtp_secure',
          'auth_smtp_user',
          'auth_smtp_password',
          'auth_smtp_from_email',
          'auth_smtp_from_name',
          // Outlook credentials
          'auth_outlook_client_id',
          'auth_outlook_client_secret',
          'auth_outlook_tenant_id',
          'auth_outlook_from_email',
          // SendGrid credentials
          'auth_sendgrid_api_key',
          'auth_sendgrid_from_email',
          'auth_sendgrid_from_name',
          // AWS SES credentials
          'auth_aws_ses_region',
          'auth_aws_ses_access_key_id',
          'auth_aws_ses_secret_access_key',
          'auth_aws_ses_from_email'
        ]
      },
      whatsapp: {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: Phone,
        description: 'WhatsApp authentication settings',
        authKeys: ['whatsapp_verification_enabled', 'signin_whatsapp_enabled'],
        serviceKeys: ['whatsapp_service_provider', 'fast2sms_whatsapp_mode']
      },
      security: {
        id: 'security',
        name: 'Security',
        icon: Shield,
        description: 'General security and login settings',
        authKeys: ['max_login_attempts', 'account_lockout_duration', 'password_reset_expiry', 'social_login_providers', 'require_phone_verification']
      },
      templates: {
        id: 'templates',
        name: 'Templates',
        icon: FileText,
        description: 'Authentication message templates',
        authKeys: ['sms_template_otp'],
        serviceKeys: []
      }
    }
  },
  notifications: {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    description: 'Email and SMS notification settings',
    categories: ['notifications'],
    subTabs: {
      sms: {
        id: 'sms',
        name: 'SMS',
        icon: Phone,
        description: 'SMS notification settings',
        authKeys: [
          'sms_notifications_enabled',
          'order_request_sms_enabled',
          'order_placed_sms_enabled',
          'order_confirmed_sms_enabled',
          'notification_use_general_sms_config'
        ],
        serviceKeys: [
          'notification_sms_service_provider',
          // Fast2SMS configuration
          'notification_fast2sms_mode',
          'notification_fast2sms_api_key',
          'notification_fast2sms_sender_id',
          // BulkSMS credentials
          'notification_bulksms_username',
          'notification_bulksms_api_key',
          'notification_bulksms_sender_id',
          // Twilio credentials
          'notification_twilio_account_sid',
          'notification_twilio_auth_token',
          'notification_twilio_phone_number',
          // AWS SNS credentials
          'notification_aws_sns_region',
          'notification_aws_sns_access_key_id',
          'notification_aws_sns_secret_access_key'
        ]
      },
      email: {
        id: 'email',
        name: 'Email',
        icon: Mail,
        description: 'Email notification settings',
        authKeys: [
          'email_notifications_enabled',
          'order_request_email_enabled',
          'order_placed_email_enabled',
          'order_confirmed_email_enabled',
          'notification_use_general_email_config'
        ],
        serviceKeys: [
          'notification_email_service_provider',
          // SMTP credentials
          'notification_smtp_host',
          'notification_smtp_port',
          'notification_smtp_secure',
          'notification_smtp_user',
          'notification_smtp_password',
          'notification_smtp_from_email',
          'notification_smtp_from_name',
          // Outlook credentials
          'notification_outlook_client_id',
          'notification_outlook_client_secret',
          'notification_outlook_tenant_id',
          'notification_outlook_from_email',
          // SendGrid credentials
          'notification_sendgrid_api_key',
          'notification_sendgrid_from_email',
          'notification_sendgrid_from_name',
          // AWS SES credentials
          'notification_aws_ses_region',
          'notification_aws_ses_access_key_id',
          'notification_aws_ses_secret_access_key',
          'notification_aws_ses_from_email'
        ]
      },
      templates: {
        id: 'templates',
        name: 'Templates',
        icon: FileText,
        description: 'Notification message templates',
        authKeys: ['sms_template_booking_request_salon', 'sms_template_booking_placed_customer', 'sms_template_booking_confirmed_customer'],
        serviceKeys: []
      }
    }
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    description: 'Analytics tracking and data collection settings',
    categories: ['analytics']
  },
  bookings: {
    id: 'bookings',
    name: 'Bookings',
    icon: Calendar,
    description: 'Booking rules and restrictions',
    categories: ['booking']
  },
  payments: {
    id: 'payments',
    name: 'Payments',
    icon: IndianRupee,
    description: 'Payment methods and policies',
    categories: ['payment']
  },
  cutqs: {
    id: 'cutqs',
    name: 'CutQs',
    icon: Building2,
    description: 'CutQ management and limits',
    categories: ['salon']
  }
} as const;

type TabId = keyof typeof TAB_CONFIG;
type SubTabId = string;

const AdminSettingsPage: React.FC = () => {
  const router = useRouter();
  const { tab } = useParams<{ tab?: string }>();

  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get current active tab from URL or default to 'general'
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('phone');

  // Template management state
  const [templateModal, setTemplateModal] = useState<{
    isOpen: boolean;
    configKey: string;
    templateText: string;
    templateId: string;
    editIndex?: number;
  }>({
    isOpen: false,
    configKey: '',
    templateText: '',
    templateId: '',
    editIndex: undefined
  });

  // Add option modal state
  const [addOptionModal, setAddOptionModal] = useState<{
    isOpen: boolean;
    configKey: string;
    optionValue: string;
    optionLabel: string;
  }>({
    isOpen: false,
    configKey: '',
    optionValue: '',
    optionLabel: ''
  });



  // Get available categories from static definitions
  const availableCategories = getAllCategories();

  useEffect(() => {
    fetchConfigs();
  }, []);



  // Handle tab changes via URL
  useEffect(() => {
    // For Next.js, we'll handle tabs within the same page instead of using sub-routes
    // No redirect needed - just use the default tab
  }, [tab]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  // Helper function to get configs for a tab (which may include multiple categories)
  const getConfigsForTab = (tabId: TabId): SystemConfig[] => {
    const tabConfig = TAB_CONFIG[tabId];
    if (!tabConfig) return [];

    return configs.filter(config =>
      (tabConfig.categories as any).includes(config.category)
    );
  };

  // Helper function to get configs for authentication sub-tabs
  const getConfigsForAuthSubTab = (subTabId: SubTabId): SystemConfig[] => {
    const authConfig = TAB_CONFIG.authentication;
    if (!authConfig.subTabs || !authConfig.subTabs[subTabId]) return [];

    const subTab = authConfig.subTabs[subTabId];
    const allKeys = [...(subTab.authKeys || []), ...(subTab.serviceKeys || [])];

    return configs.filter(config => allKeys.includes(config.key));
  };

  // Helper function to get configs for notifications sub-tabs
  const getConfigsForNotificationSubTab = (subTabId: SubTabId): SystemConfig[] => {
    const notificationConfig = TAB_CONFIG.notifications;
    if (!notificationConfig.subTabs || !notificationConfig.subTabs[subTabId]) return [];

    const subTab = notificationConfig.subTabs[subTabId];
    const allKeys = [...(subTab.authKeys || []), ...(subTab.serviceKeys || [])];

    return configs.filter(config => allKeys.includes(config.key));
  };

  // Helper function to get configs for general sub-tabs
  const getConfigsForGeneralSubTab = (subTabId: SubTabId): SystemConfig[] => {
    const generalConfig = TAB_CONFIG.general;
    if (!generalConfig.subTabs || !generalConfig.subTabs[subTabId]) return [];

    const subTab = generalConfig.subTabs[subTabId];
    const allKeys = [...(subTab.authKeys || []), ...(subTab.serviceKeys || [])];

    return configs.filter(config => allKeys.includes(config.key));
  };

  const fetchConfigs = async () => {
    try {
      const response = await fetch(buildApiUrl('system-config'));
      const data = await response.json();
      
      if (data.success) {
        setConfigs(data.data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load system configurations' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error loading configurations' });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (key: string, value: string) => {
    try {
      const response = await fetch(buildApiUrl(`system-config/${key}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });

      const data = await response.json();
      
      if (data.success) {
        setConfigs(configs.map(config => 
          config.key === key ? { ...config, value } : config
        ));
        setMessage({ type: 'success', text: 'Configuration updated successfully' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error updating configuration' });
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // In a real app, you might want to batch update all configs
      setMessage({ type: 'success', text: 'All configurations saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configurations' });
    } finally {
      setSaving(false);
    }
  };

  // Template management functions
  const openTemplateModal = (configKey: string, editIndex?: number) => {
    const config = configs.find(c => c.key === configKey);
    if (!config) return;

    let templateText = '';
    let templateId = '';

    if (config.type === 'template') {
      // For new template type, get from options
      const templateOptions = config.options?.filter((opt): opt is { id: string; message: string; templateId: string } =>
        'id' in opt && 'message' in opt && 'templateId' in opt
      ) || [];

      if (editIndex !== undefined && templateOptions[editIndex]) {
        const template = templateOptions[editIndex];
        templateText = template.message;
        templateId = template.templateId || '';
      }
    } else {
      // Legacy array type handling
      let templates = [];
      try {
        if (config.value) {
          const parsed = JSON.parse(config.value);
          templates = Array.isArray(parsed) ? parsed : [config.value];
        }
      } catch (error) {
        templates = config.value ? [config.value] : [];
      }

      if (editIndex !== undefined && templates[editIndex]) {
        const template = templates[editIndex];
        if (typeof template === 'string') {
          templateText = template;
          templateId = '';
        } else if (typeof template === 'object' && template.message) {
          templateText = template.message;
          templateId = template.templateId || '';
        }
      }
    }

    setTemplateModal({
      isOpen: true,
      configKey,
      templateText,
      templateId,
      editIndex
    });
  };

  const closeTemplateModal = () => {
    setTemplateModal({
      isOpen: false,
      configKey: '',
      templateText: '',
      templateId: '',
      editIndex: undefined
    });
  };

  const saveTemplate = async () => {
    const config = configs.find(c => c.key === templateModal.configKey);
    if (!config) return;

    if (config.type === 'template') {
      // For new template type, add to options
      const templateOptions = config.options?.filter((opt): opt is { id: string; message: string; templateId: string } =>
        'id' in opt && 'message' in opt && 'templateId' in opt
      ) || [];

      const newTemplate = {
        id: templateModal.editIndex !== undefined ? templateOptions[templateModal.editIndex]?.id || Date.now().toString() : Date.now().toString(),
        message: templateModal.templateText,
        templateId: templateModal.templateId || ''
      };

      if (templateModal.editIndex !== undefined) {
        // Edit existing template via API
        try {
          const response = await fetch(`${buildApiUrl('/system-config')}/${templateModal.configKey}/templates/${newTemplate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTemplate),
          });

          if (response.ok) {
            fetchConfigs(); // Refresh configs
            closeTemplateModal();
          }
        } catch (error) {
          logger.error('Error updating template:', error);
        }
      } else {
        // Add new template via API
        try {
          const response = await fetch(`${buildApiUrl('/system-config')}/${templateModal.configKey}/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTemplate),
          });

          if (response.ok) {
            fetchConfigs(); // Refresh configs
            closeTemplateModal();
          }
        } catch (error) {
          logger.error('Error adding template:', error);
        }
      }
    } else {
      // Legacy array type handling
      let templates = [];
      try {
        if (config.value) {
          const parsed = JSON.parse(config.value);
          templates = Array.isArray(parsed) ? parsed : [config.value];
        }
      } catch (error) {
        templates = config.value ? [config.value] : [];
      }

      const newTemplate = {
        message: templateModal.templateText,
        templateId: templateModal.templateId || ''
      };

      if (templateModal.editIndex !== undefined) {
        templates[templateModal.editIndex] = newTemplate;
      } else {
        templates.push(newTemplate);
      }

      updateConfig(templateModal.configKey, JSON.stringify(templates));
      closeTemplateModal();
    }
  };

  const deleteTemplate = async (configKey: string, index: number) => {
    const config = configs.find(c => c.key === configKey);
    if (!config) return;

    if (config.type === 'template') {
      // For new template type, delete from options via API
      const templateOptions = config.options?.filter((opt): opt is { id: string; message: string; templateId: string } =>
        'id' in opt && 'message' in opt && 'templateId' in opt
      ) || [];

      if (templateOptions[index]) {
        try {
          const response = await fetch(`${buildApiUrl('/system-config')}/${configKey}/templates/${templateOptions[index].id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            fetchConfigs(); // Refresh configs
          }
        } catch (error) {
          logger.error('Error deleting template:', error);
        }
      }
    } else {
      // Legacy array type handling
      let templates = [];
      try {
        if (config.value) {
          const parsed = JSON.parse(config.value);
          templates = Array.isArray(parsed) ? parsed : [config.value];
        }
      } catch (error) {
        templates = config.value ? [config.value] : [];
      }

      templates.splice(index, 1);
      updateConfig(configKey, JSON.stringify(templates));
    }
  };

  const setActiveTemplate = (configKey: string, index: number) => {
    const config = configs.find(c => c.key === configKey);
    if (!config) return;

    let templates = [];
    try {
      if (config.value) {
        const parsed = JSON.parse(config.value);
        templates = Array.isArray(parsed) ? parsed : [config.value];
      }
    } catch (error) {
      templates = config.value ? [config.value] : [];
    }

    // Move selected template to first position (active template)
    if (index > 0 && index < templates.length) {
      const activeTemplate = templates[index];
      templates.splice(index, 1);
      templates.unshift(activeTemplate);
      updateConfig(configKey, JSON.stringify(templates));
    }
  };

  // Add option modal functions
  const openAddOptionModal = (configKey: string) => {
    setAddOptionModal({
      isOpen: true,
      configKey,
      optionValue: '',
      optionLabel: ''
    });
  };

  const closeAddOptionModal = () => {
    setAddOptionModal({
      isOpen: false,
      configKey: '',
      optionValue: '',
      optionLabel: ''
    });
  };

  const saveNewOption = async () => {
    if (!addOptionModal.optionValue.trim() || !addOptionModal.optionLabel.trim()) {
      setMessage({ type: 'error', text: 'Both option value and label are required' });
      return;
    }

    try {
      const response = await fetch(`${buildApiUrl('/system-config')}/${addOptionModal.configKey}/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: addOptionModal.optionValue.trim(),
          label: addOptionModal.optionLabel.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Option added successfully' });
        closeAddOptionModal();
        // Refresh configs to get updated options
        fetchConfigs();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to add option' });
      }
    } catch (error) {
      logger.error('Error adding option:', error);
      setMessage({ type: 'error', text: 'Failed to add option' });
    }
  };

  const renderConfigInput = (config: SystemConfig) => {
    const handleChange = (value: string) => {
      updateConfig(config.key, value);
    };

    // Get options for select/multiselect fields from config or fallback to static definitions
    const getOptionsForConfig = (configKey: string) => {
      // First try to get options from the config object (from database)
      if (config.options && config.options.length > 0) {
        // Filter out template options for select/multiselect fields
        const selectOptions = config.options.filter((opt): opt is { value: string; label: string } =>
          'value' in opt && 'label' in opt
        );
        if (selectOptions.length > 0) {
          return selectOptions;
        }
      }

      // Fallback to static definitions for backward compatibility
      switch (configKey) {
        case 'supported_payment_methods':
          return [
            { value: 'cash', label: 'Cash' },
            { value: 'card', label: 'Credit/Debit Card' },
            { value: 'online', label: 'Online Payment' },
            { value: 'wallet', label: 'Digital Wallet' },
            { value: 'upi', label: 'UPI' },
            { value: 'bank_transfer', label: 'Bank Transfer' }
          ];
        case 'sms_provider':
          return [
            { value: 'fast2sms', label: 'Fast2SMS' },
            { value: 'twilio', label: 'Twilio' },
            { value: 'aws-sns', label: 'AWS SNS' },
            { value: 'firebase', label: 'Firebase' }
          ];
        case 'fast2sms_mode':
          return [
            { value: 'otp', label: 'OTP Mode' },
            { value: 'quick', label: 'Quick Message Mode' }
          ];
        case 'email_service_provider':
          return [
            { value: 'smtp', label: 'SMTP (Generic - Gmail, GoDaddy, etc.)' },
            { value: 'outlook', label: 'Outlook/Office365' },
            { value: 'sendgrid', label: 'SendGrid' },
            { value: 'aws_ses', label: 'AWS SES' }
          ];
        case 'sms_service_provider':
        case 'notification_sms_service_provider':
          return [
            { value: 'fast2sms', label: 'Fast2SMS' },
            { value: 'firebase', label: 'Firebase SMS' },
            { value: 'twilio', label: 'Twilio' },
            { value: 'aws_sns', label: 'AWS SNS' },
            { value: 'bulksms', label: 'Bulk SMS' }
          ];
        case 'notification_email_service_provider':
          return [
            { value: 'smtp', label: 'SMTP/Outlook' },
            { value: 'sendgrid', label: 'SendGrid' },
            { value: 'aws_ses', label: 'AWS SES' }
          ];
        case 'whatsapp_service_provider':
          return [
            { value: 'fast2sms', label: 'Fast2SMS' },
            { value: 'firebase', label: 'Firebase WhatsApp' },
            { value: 'twilio', label: 'Twilio' },
            { value: 'aws_sns', label: 'AWS SNS' }
          ];
        case 'fast2sms_whatsapp_mode':
          return [
            { value: 'otp', label: 'OTP Mode' },
            { value: 'quick', label: 'Quick Mode' }
          ];
        case 'social_login_providers':
          return [
            { value: 'google', label: 'Google' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'instagram', label: 'Instagram' },
            { value: 'twitter', label: 'Twitter' },
            { value: 'linkedin', label: 'LinkedIn' }
          ];

        default:
          return [];
      }
    };

    switch (config.type) {
      case 'boolean':
        return (
          <Switch
            checked={config.value === 'true'}
            onChange={(checked) => handleChange(checked ? 'true' : 'false')}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={config.value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-32"
          />
        );
      case 'json':
        // Handle multiselect for specific JSON fields
        if (config.key === 'social_login_providers' || config.key === 'supported_payment_methods') {
          let currentValue = [];
          try {
            if (config.value) {
              const parsed = JSON.parse(config.value);
              currentValue = Array.isArray(parsed) ? parsed : [];
            }
          } catch (error) {
            currentValue = [];
          }
          return (
            <MultiSelect
              options={getOptionsForConfig(config.key)}
              value={currentValue}
              onChange={(newValue) => handleChange(JSON.stringify(newValue))}
              placeholder={`Select ${config.name.toLowerCase()}...`}
              className="w-64"
            />
          );
        }
        // For other JSON fields, show as text input
        return (
          <Input
            type="text"
            value={config.value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
            placeholder="JSON format"
          />
        );

      case 'select':
        const selectOptions = getOptionsForConfig(config.key);
        return (
          <div className="flex items-center gap-2">
            <select
              value={config.value}
              onChange={(e) => handleChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
            >
              {selectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {config.allowAddOptions && (
              <button
                onClick={() => openAddOptionModal(config.key)}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                title="Add new option"
              >
                +
              </button>
            )}
          </div>
        );

      case 'multiselect':
        let multiselectValue = [];
        try {
          if (config.value) {
            const parsed = JSON.parse(config.value);
            multiselectValue = Array.isArray(parsed) ? parsed : [];
          }
        } catch (error) {
          multiselectValue = [];
        }
        return (
          <MultiSelect
            options={getOptionsForConfig(config.key)}
            value={multiselectValue}
            onChange={(newValue) => handleChange(JSON.stringify(newValue))}
            placeholder={`Select ${config.name.toLowerCase()}...`}
            className="w-64"
          />
        );

      case 'template':
        // For SMS templates stored in options column
        const templateOptions = config.options?.filter((opt): opt is { id: string; message: string; templateId: string } =>
          'id' in opt && 'message' in opt && 'templateId' in opt
        ) || [];

        return (
          <div className="space-y-6">
            {/* Active Template Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Template (Currently Used)
              </label>
              <select
                value={config.value || '1'} // Active template ID
                onChange={(e) => handleChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {templateOptions.map((template, index) => (
                  <option key={template.id} value={template.id}>
                    {config.value === template.id ? '🟢 ' : ''}Template {index + 1}: {template.message.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Template Management */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Manage Templates ({templateOptions.length} total)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openTemplateModal(config.key)}
                >
                  + Add New Template
                </Button>
              </div>

              {/* Template List */}
              <div className="space-y-2">
                {templateOptions.map((template, index) => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          Template {index + 1}
                          {config.value === template.id && <span className="text-green-600">• Active</span>}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{template.message}</p>
                      {template.templateId && (
                        <p className="text-xs text-gray-500 mt-1">Template ID: {template.templateId}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openTemplateModal(config.key, index)}
                      >
                        Edit
                      </Button>
                      {templateOptions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTemplate(config.key, index)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'array':
        // For SMS templates and other array fields
        if (config.key.startsWith('sms_template_')) {
          let templates = [];
          try {
            // Try to parse as JSON array first
            if (config.value) {
              const parsed = JSON.parse(config.value);
              templates = Array.isArray(parsed) ? parsed : [config.value];
            }
          } catch (error) {
            // If parsing fails, treat as single string template
            templates = config.value ? [config.value] : [];
          }

          return (
            <div className="space-y-6">
              {/* Active Template Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Template (Currently Used)
                </label>
                <select
                  value={0} // First template is always active
                  onChange={(e) => setActiveTemplate(config.key, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {templates.map((template: any, index: number) => {
                    const templateMessage = typeof template === 'string' ? template : template?.message || '';
                    return (
                      <option key={index} value={index}>
                        {index === 0 ? '🟢 ' : ''}Template {index + 1}: {templateMessage.substring(0, 50)}...
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Template Management */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Manage Templates ({templates.length} total)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openTemplateModal(config.key)}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    + Add New Template
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {templates.map((template: any, index: number) => {
                    // Handle both old string format and new object format
                    const templateMessage = typeof template === 'string' ? template : template?.message || '';
                    const templateId = typeof template === 'object' ? template?.templateId || '' : '';

                    return (
                      <div key={index} className="flex items-center gap-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">
                              Template {index + 1}
                              {index === 0 && <span className="text-green-600 ml-1">• Active</span>}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 truncate">
                            {templateMessage || 'Empty template'}
                          </div>
                          {templateId && (
                            <div className="text-xs text-gray-500 mt-1">
                              Template ID: {templateId}
                            </div>
                          )}
                        </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openTemplateModal(config.key, index)}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50 px-2 py-1 text-xs"
                        >
                          Edit
                        </Button>
                        {templates.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTemplate(config.key, index)}
                            className="text-red-600 border-red-600 hover:bg-red-50 px-2 py-1 text-xs"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }
        // For other array fields
        let arrayValue = [];
        try {
          if (config.value) {
            const parsed = JSON.parse(config.value);
            arrayValue = Array.isArray(parsed) ? parsed : [config.value];
          }
        } catch (error) {
          arrayValue = config.value ? [config.value] : [];
        }
        return (
          <div className="space-y-2">
            {arrayValue.map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newArray = [...arrayValue];
                    newArray[index] = e.target.value;
                    handleChange(JSON.stringify(newArray));
                  }}
                  className="flex-1"
                  placeholder="Enter value"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newArray = arrayValue.filter((_: any, i: number) => i !== index);
                    handleChange(JSON.stringify(newArray));
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newArray = [...arrayValue, ''];
                handleChange(JSON.stringify(newArray));
              }}
              className="w-full"
            >
              + Add Item
            </Button>
          </div>
        );

      case 'string':
        return (
          <Input
            type="text"
            value={config.value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={config.value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Convert TAB_CONFIG to array for rendering
  const tabs = Object.values(TAB_CONFIG);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Manage platform-wide configurations</p>
        </div>
        {/* <Button onClick={handleSaveAll} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button> */}
      </div>

      {/* Message */}
      {message && (
        <Alert type={message.type} message={message.text} />
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
                title={tab.description}
              >
                <Icon className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">{tab.name}</div>
                  <div className="text-xs text-gray-400 hidden sm:block">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-6">
          {/* Tab Header */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900">{TAB_CONFIG[activeTab].name}</h3>
            <p className="text-sm text-gray-500 mt-1">{TAB_CONFIG[activeTab].description}</p>
          </div>

          {/* General Sub-tabs */}
          {activeTab === 'general' && TAB_CONFIG.general.subTabs && (
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-thin">
                {Object.entries(TAB_CONFIG.general.subTabs).map(([subTabId, subTab]) => {
                  const Icon = subTab.icon;
                  return (
                    <button
                      key={subTabId}
                      onClick={() => setActiveSubTab(subTabId)}
                      className={`flex items-center py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                        activeSubTab === subTabId
                          ? 'border-primary-500 text-primary-600 bg-primary-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      title={subTab.description}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">{subTab.name}</div>
                        <div className="text-xs text-gray-400 hidden sm:block">{subTab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Authentication Sub-tabs */}
          {activeTab === 'authentication' && TAB_CONFIG.authentication.subTabs && (
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-thin">
                {Object.entries(TAB_CONFIG.authentication.subTabs).map(([subTabId, subTab]) => {
                  const Icon = subTab.icon;
                  return (
                    <button
                      key={subTabId}
                      onClick={() => setActiveSubTab(subTabId)}
                      className={`flex items-center py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                        activeSubTab === subTabId
                          ? 'border-primary-500 text-primary-600 bg-primary-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      title={subTab.description}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">{subTab.name}</div>
                        <div className="text-xs text-gray-400 hidden sm:block">{subTab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Notifications Sub-tabs */}
          {activeTab === 'notifications' && TAB_CONFIG.notifications.subTabs && (
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-thin">
                {Object.entries(TAB_CONFIG.notifications.subTabs).map(([subTabId, subTab]) => {
                  const Icon = subTab.icon;
                  return (
                    <button
                      key={subTabId}
                      onClick={() => setActiveSubTab(subTabId)}
                      className={`flex items-center py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                        activeSubTab === subTabId
                          ? 'border-primary-500 text-primary-600 bg-primary-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      title={subTab.description}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">{subTab.name}</div>
                        <div className="text-xs text-gray-400 hidden sm:block">{subTab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'analytics' ? (
              <AnalyticsSettings />
            ) : activeTab === 'authentication' ? (
              // Authentication sub-tab content
              activeSubTab === 'templates' ? (
                // Special rendering for Authentication Templates tab
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-purple-500" />
                      Authentication Templates
                    </h4>
                    <div className="space-y-4">
                      {configs.filter(config =>
                        TAB_CONFIG.authentication.subTabs?.templates?.authKeys?.includes(config.key as any)
                      ).map((config) => (
                        <div key={config.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200">
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-gray-900 flex items-center">
                              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                              {config.name}
                            </h5>
                            <p className="text-xs text-gray-600 mt-1 ml-4">{config.description}</p>
                          </div>
                          <div className="ml-4">
                            {renderConfigInput(config)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : getConfigsForAuthSubTab(activeSubTab).length > 0 ? (
                <div className="space-y-6">
                  {/* Authentication Settings Section */}
                  {TAB_CONFIG.authentication.subTabs?.[activeSubTab]?.authKeys &&
                   TAB_CONFIG.authentication.subTabs[activeSubTab].authKeys!.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-blue-500" />
                        Authentication Settings
                      </h4>
                      <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                        {configs.filter(config =>
                          TAB_CONFIG.authentication.subTabs?.[activeSubTab]?.authKeys?.includes(config.key)
                        ).map((config) => (
                          <div key={config.id} className="flex items-center justify-between py-2">
                            <div className="flex-1 pr-8">
                              <h5 className="text-sm font-medium text-gray-900">{config.name}</h5>
                              <p className="text-sm text-gray-500">{config.description}</p>
                            </div>
                            <div className="ml-8 flex-shrink-0">
                              {renderConfigInput(config)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Provider Settings Section */}
                  {TAB_CONFIG.authentication.subTabs?.[activeSubTab]?.serviceKeys &&
                   TAB_CONFIG.authentication.subTabs[activeSubTab].serviceKeys!.length > 0 && (() => {
                     // Check if "Use General Settings" toggle is enabled
                     const useGeneralEmailConfig = configs.find(c => c.key === 'auth_use_general_email_config');
                     const useGeneralSmsConfig = configs.find(c => c.key === 'auth_use_general_sms_config');

                     const isEmailTab = activeSubTab === 'email';
                     const isPhoneTab = activeSubTab === 'phone';

                     const shouldHideEmailFields = isEmailTab && useGeneralEmailConfig?.value === 'true';
                     const shouldHideSmsFields = isPhoneTab && useGeneralSmsConfig?.value === 'true';

                     // If toggle is ON, don't show provider-specific fields
                     if (shouldHideEmailFields || shouldHideSmsFields) {
                       return null;
                     }

                     return (
                       <div>
                         <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                           <Cog className="w-4 h-4 mr-2 text-green-500" />
                           Service Provider Configuration
                         </h4>
                         <div className="space-y-3 bg-green-50 p-4 rounded-lg">
                           {configs.filter(config =>
                             TAB_CONFIG.authentication.subTabs?.[activeSubTab]?.serviceKeys?.includes(config.key)
                           ).map((config) => (
                             <div key={config.id} className="flex items-center justify-between py-2">
                               <div className="flex-1 pr-8">
                                 <h5 className="text-sm font-medium text-gray-900">{config.name}</h5>
                                 <p className="text-sm text-gray-500">{config.description}</p>
                               </div>
                               <div className="ml-8 flex-shrink-0">
                                 {renderConfigInput(config)}
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     );
                   })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No configurations found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No settings available for this sub-category.
                  </p>
                </div>
              )
            ) : activeTab === 'notifications' ? (
              // Notifications sub-tab content
              activeSubTab === 'templates' ? (
                // Special rendering for Templates tab with better UI
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-purple-500" />
                      SMS Templates
                    </h4>
                    <div className="space-y-4">
                      {configs.filter(config =>
                        TAB_CONFIG.notifications.subTabs?.templates?.authKeys?.includes(config.key as any)
                      ).map((config) => (
                        <div key={config.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200">
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-gray-900 flex items-center">
                              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                              {config.name}
                            </h5>
                            <p className="text-xs text-gray-600 mt-1 ml-4">{config.description}</p>
                          </div>
                          <div className="ml-4">
                            {renderConfigInput(config)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : getConfigsForNotificationSubTab(activeSubTab).length > 0 ? (
                <div className="space-y-6">
                  {/* Notification Settings Section */}
                  {TAB_CONFIG.notifications.subTabs?.[activeSubTab]?.authKeys &&
                   TAB_CONFIG.notifications.subTabs[activeSubTab].authKeys!.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <Bell className="w-4 h-4 mr-2 text-blue-500" />
                        Notification Settings
                      </h4>
                      <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                        {configs.filter(config =>
                          TAB_CONFIG.notifications.subTabs?.[activeSubTab]?.authKeys?.includes(config.key)
                        ).map((config) => (
                          <div key={config.id} className="flex items-center justify-between py-2">
                            <div className="flex-1 pr-8">
                              <h5 className="text-sm font-medium text-gray-900">{config.name}</h5>
                              <p className="text-sm text-gray-500">{config.description}</p>
                            </div>
                            <div className="ml-8 flex-shrink-0">
                              {renderConfigInput(config)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Provider Settings Section */}
                  {TAB_CONFIG.notifications.subTabs?.[activeSubTab]?.serviceKeys &&
                   TAB_CONFIG.notifications.subTabs[activeSubTab].serviceKeys!.length > 0 && (() => {
                     // Check if "Use General Settings" toggle is enabled
                     const useGeneralEmailConfig = configs.find(c => c.key === 'notification_use_general_email_config');
                     const useGeneralSmsConfig = configs.find(c => c.key === 'notification_use_general_sms_config');

                     const isEmailTab = activeSubTab === 'email';
                     const isSmsTab = activeSubTab === 'sms';

                     const shouldHideEmailFields = isEmailTab && useGeneralEmailConfig?.value === 'true';
                     const shouldHideSmsFields = isSmsTab && useGeneralSmsConfig?.value === 'true';

                     // If toggle is ON, don't show provider-specific fields
                     if (shouldHideEmailFields || shouldHideSmsFields) {
                       return null;
                     }

                     return (
                       <div>
                         <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                           <Cog className="w-4 h-4 mr-2 text-green-500" />
                           Service Provider Configuration
                         </h4>
                         <div className="space-y-3 bg-green-50 p-4 rounded-lg">
                           {configs.filter(config =>
                             TAB_CONFIG.notifications.subTabs?.[activeSubTab]?.serviceKeys?.includes(config.key)
                           ).map((config) => (
                             <div key={config.id} className="flex items-center justify-between py-2">
                               <div className="flex-1 pr-8">
                                 <h5 className="text-sm font-medium text-gray-900">{config.name}</h5>
                                 <p className="text-sm text-gray-500">{config.description}</p>
                               </div>
                               <div className="ml-8 flex-shrink-0">
                                 {renderConfigInput(config)}
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     );
                   })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No configurations found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No settings available for this sub-category.
                  </p>
                </div>
              )
            ) : activeTab === 'general' ? (
              // General sub-tab content
              getConfigsForGeneralSubTab(activeSubTab).length > 0 ? (
                <div className="space-y-6">
                  {/* General Settings Section */}
                  {TAB_CONFIG.general.subTabs?.[activeSubTab]?.authKeys &&
                   TAB_CONFIG.general.subTabs[activeSubTab].authKeys!.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <SettingsIcon className="w-4 h-4 mr-2 text-blue-500" />
                        General Settings
                      </h4>
                      <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                        {configs.filter(config =>
                          TAB_CONFIG.general.subTabs?.[activeSubTab]?.authKeys?.includes(config.key)
                        ).map((config) => (
                          <div key={config.id} className="flex items-center justify-between py-2">
                            <div className="flex-1 pr-8">
                              <h5 className="text-sm font-medium text-gray-900">{config.name}</h5>
                              <p className="text-sm text-gray-500">{config.description}</p>
                            </div>
                            <div className="ml-8 flex-shrink-0">
                              {renderConfigInput(config)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Provider Settings Section */}
                  {TAB_CONFIG.general.subTabs?.[activeSubTab]?.serviceKeys &&
                   TAB_CONFIG.general.subTabs[activeSubTab].serviceKeys!.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <Cog className="w-4 h-4 mr-2 text-green-500" />
                        Provider Configuration
                      </h4>
                      <div className="space-y-3 bg-green-50 p-4 rounded-lg">
                        {configs.filter(config =>
                          TAB_CONFIG.general.subTabs?.[activeSubTab]?.serviceKeys?.includes(config.key)
                        ).map((config) => (
                          <div key={config.id} className="flex items-center justify-between py-2">
                            <div className="flex-1 pr-8">
                              <h5 className="text-sm font-medium text-gray-900">{config.name}</h5>
                              <p className="text-sm text-gray-500">{config.description}</p>
                            </div>
                            <div className="ml-8 flex-shrink-0">
                              {renderConfigInput(config)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No configurations found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No settings available for this sub-category.
                  </p>
                </div>
              )
            ) : getConfigsForTab(activeTab).length > 0 ? (
              getConfigsForTab(activeTab).map((config) => (
                <div key={config.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1 pr-8">
                    <h4 className="text-sm font-medium text-gray-900">{config.name}</h4>
                    <p className="text-sm text-gray-500">{config.description}</p>
                  </div>
                  <div className="ml-8 flex-shrink-0">
                    {renderConfigInput(config)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No configurations found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No settings available for this category.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Modal */}
      {templateModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {templateModal.editIndex !== undefined ? 'Edit Template' : 'Add New Template'}
              </h3>
              <button
                onClick={closeTemplateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Content
                </label>
                <textarea
                  value={templateModal.templateText}
                  onChange={(e) => setTemplateModal(prev => ({ ...prev, templateText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  rows={6}
                  placeholder="Enter SMS template with {#var#} for dynamic values"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template ID (Optional)
                </label>
                <input
                  type="text"
                  value={templateModal.templateId}
                  onChange={(e) => setTemplateModal(prev => ({ ...prev, templateId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template ID for SMS provider (if required)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Some SMS providers like BulkSMS require a template ID for message delivery.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Template Variables</h4>
                <p className="text-sm text-blue-700">
                  Use <code className="bg-blue-100 px-1 rounded">{'{#var#}'}</code> as placeholders for dynamic values.
                  The system will automatically replace these with actual data when sending messages.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={closeTemplateModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveTemplate}
                disabled={!templateModal.templateText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {templateModal.editIndex !== undefined ? 'Update Template' : 'Add Template'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Option Modal */}
      {addOptionModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add New Option
              </h3>
              <button
                onClick={closeAddOptionModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option Value
                </label>
                <input
                  type="text"
                  value={addOptionModal.optionValue}
                  onChange={(e) => setAddOptionModal(prev => ({ ...prev, optionValue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., new_provider"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be the internal value used by the system
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option Label
                </label>
                <input
                  type="text"
                  value={addOptionModal.optionLabel}
                  onChange={(e) => setAddOptionModal(prev => ({ ...prev, optionLabel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., New Provider"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be displayed to users in the dropdown
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeAddOptionModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={saveNewOption}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Option
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
