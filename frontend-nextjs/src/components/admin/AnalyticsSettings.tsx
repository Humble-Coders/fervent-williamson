import React, { useState, useEffect } from 'react';
import { BarChart3, Eye, MessageSquare, Clock, Database, Trash2, Globe } from 'lucide-react';
import Switch from '../ui/Switch';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { buildApiUrl } from '../../config/env';

interface AnalyticsConfig {
  // Custom Analytics System (CutQ Internal)
  trackPageViews: boolean;
  trackUserActions: boolean;
  trackConversions: boolean;
  trackErrors: boolean;

  // Communication Tracking
  trackSmsMessages: boolean;
  trackEmailMessages: boolean;
  trackWhatsappMessages: boolean;

  // Business Analytics
  trackBookingFunnel: boolean;
  trackSalonViews: boolean;
  trackServiceViews: boolean;
  trackStylistViews: boolean;

  // Real-time Analytics
  trackActiveSessions: boolean;
  trackRealTimeActions: boolean;

  // Google Analytics (External) - separate from custom analytics
  enableGoogleAnalytics: boolean;
  googleAnalyticsPageViews: boolean;
  googleAnalyticsEvents: boolean;
  googleAnalyticsConversions: boolean;
  googleAnalyticsErrors: boolean;
  googleAnalyticsWebVitals: boolean;

  // Data Retention (in days)
  pageViewRetentionDays: number;
  communicationRetentionDays: number;
  businessRetentionDays: number;

  // Auto-cleanup settings
  enableAutoCleanup: boolean;
  cleanupFrequencyDays: number;
}

const AnalyticsSettings: React.FC = () => {
  const [config, setConfig] = useState<AnalyticsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(buildApiUrl('analytics-config'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load analytics configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error loading analytics configuration' });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<AnalyticsConfig>) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(buildApiUrl('analytics-config'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
        setMessage({ type: 'success', text: 'Analytics configuration updated successfully' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update analytics configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error updating analytics configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof AnalyticsConfig, value: boolean) => {
    if (config) {
      const updates = { [key]: value };
      setConfig({ ...config, ...updates });
      updateConfig(updates);
    }
  };

  const handleNumberChange = (key: keyof AnalyticsConfig, value: number) => {
    if (config) {
      const updates = { [key]: value };
      setConfig({ ...config, ...updates });
      updateConfig(updates);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load analytics configuration</p>
        <Button onClick={fetchConfig} className="mt-4">Retry</Button>
      </div>
    );
  }

  const configSections = [
    {
      title: 'Page View Tracking',
      icon: Eye,
      description: 'Track user page views and navigation patterns',
      configs: [
        { key: 'trackPageViews', label: 'Track Page Views', description: 'Record when users visit different pages' },
        { key: 'trackUserActions', label: 'Track User Actions', description: 'Record user interactions like clicks and form submissions' },
        { key: 'trackConversions', label: 'Track Conversions', description: 'Record conversion events like bookings and sign-ups' },
        { key: 'trackErrors', label: 'Track Errors', description: 'Record application errors and exceptions' },
      ]
    },
    {
      title: 'Communication Tracking',
      icon: MessageSquare,
      description: 'Track communication events and messaging',
      configs: [
        { key: 'trackSmsMessages', label: 'Track SMS Messages', description: 'Record SMS notifications and messages sent' },
        { key: 'trackEmailMessages', label: 'Track Email Messages', description: 'Record email notifications and messages sent' },
        { key: 'trackWhatsappMessages', label: 'Track WhatsApp Messages', description: 'Record WhatsApp notifications and messages sent' },
      ]
    },
    {
      title: 'Business Analytics',
      icon: BarChart3,
      description: 'Track business-specific metrics and KPIs',
      configs: [
        { key: 'trackBookingFunnel', label: 'Track Booking Funnel', description: 'Record booking process steps and conversion rates' },
        { key: 'trackSalonViews', label: 'Track Salon Views', description: 'Record when users view salon profiles' },
        { key: 'trackServiceViews', label: 'Track Service Views', description: 'Record when users view service details' },
        { key: 'trackStylistViews', label: 'Track Stylist Views', description: 'Record when users view stylist profiles' },
      ]
    },
    {
      title: 'Real-time Analytics',
      icon: Clock,
      description: 'Track real-time user activity and sessions',
      configs: [
        { key: 'trackActiveSessions', label: 'Track Active Sessions', description: 'Monitor currently active user sessions' },
        { key: 'trackRealTimeActions', label: 'Track Real-time Actions', description: 'Record user actions in real-time for live analytics' },
      ]
    },
    {
      title: 'Google Analytics (External)',
      icon: Globe,
      description: 'Configure Google Analytics tracking (separate from custom analytics)',
      configs: [
        { key: 'enableGoogleAnalytics', label: 'Enable Google Analytics', description: 'Master switch for all Google Analytics tracking' },
        { key: 'googleAnalyticsPageViews', label: 'GA Page Views', description: 'Send page view events to Google Analytics' },
        { key: 'googleAnalyticsEvents', label: 'GA Events', description: 'Send custom events to Google Analytics' },
        { key: 'googleAnalyticsConversions', label: 'GA Conversions', description: 'Send conversion events to Google Analytics' },
        { key: 'googleAnalyticsErrors', label: 'GA Errors', description: 'Send error events to Google Analytics' },
        { key: 'googleAnalyticsWebVitals', label: 'GA Web Vitals', description: 'Send Core Web Vitals metrics to Google Analytics' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <Alert type={message.type} message={message.text} />
      )}

      {/* Analytics Configuration Sections */}
      {configSections.map((section) => {
        const IconComponent = section.icon;
        return (
          <div key={section.title} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <IconComponent className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {section.configs.map((configItem) => (
                <div key={configItem.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{configItem.label}</h4>
                    <p className="text-sm text-gray-500">{configItem.description}</p>
                  </div>
                  <div className="ml-4">
                    <Switch
                      checked={config[configItem.key as keyof AnalyticsConfig] as boolean}
                      onChange={(checked) => handleToggle(configItem.key as keyof AnalyticsConfig, checked)}
                      disabled={saving}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Data Retention Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Database className="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Data Retention</h3>
            <p className="text-sm text-gray-500">Configure how long analytics data is stored</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page View Retention (days)
            </label>
            <Input
              type="number"
              value={config.pageViewRetentionDays}
              onChange={(e) => handleNumberChange('pageViewRetentionDays', parseInt(e.target.value) || 90)}
              min="1"
              max="3650"
              disabled={saving}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Communication Retention (days)
            </label>
            <Input
              type="number"
              value={config.communicationRetentionDays}
              onChange={(e) => handleNumberChange('communicationRetentionDays', parseInt(e.target.value) || 365)}
              min="1"
              max="3650"
              disabled={saving}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Data Retention (days)
            </label>
            <Input
              type="number"
              value={config.businessRetentionDays}
              onChange={(e) => handleNumberChange('businessRetentionDays', parseInt(e.target.value) || 365)}
              min="1"
              max="3650"
              disabled={saving}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cleanup Frequency (days)
            </label>
            <Input
              type="number"
              value={config.cleanupFrequencyDays}
              onChange={(e) => handleNumberChange('cleanupFrequencyDays', parseInt(e.target.value) || 7)}
              min="1"
              max="365"
              disabled={saving}
            />
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Auto Cleanup</h4>
              <p className="text-sm text-gray-500">Automatically delete old analytics data based on retention settings</p>
            </div>
            <Switch
              checked={config.enableAutoCleanup}
              onChange={(checked) => handleToggle('enableAutoCleanup', checked)}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Trash2 className="w-5 h-5 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Quick Actions</h3>
            <p className="text-sm text-yellow-700">Bulk operations for analytics configuration</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => {
              const allDisabled = {
                // Custom Analytics System (CutQ Internal)
                trackPageViews: false,
                trackUserActions: false,
                trackConversions: false,
                trackErrors: false,
                trackSmsMessages: false,
                trackEmailMessages: false,
                trackWhatsappMessages: false,
                trackBookingFunnel: false,
                trackSalonViews: false,
                trackServiceViews: false,
                trackStylistViews: false,
                trackActiveSessions: false,
                trackRealTimeActions: false,

                // Google Analytics (External)
                enableGoogleAnalytics: false,
                googleAnalyticsPageViews: false,
                googleAnalyticsEvents: false,
                googleAnalyticsConversions: false,
                googleAnalyticsErrors: false,
                googleAnalyticsWebVitals: false,
              };
              setConfig({ ...config, ...allDisabled });
              updateConfig(allDisabled);
            }}
            disabled={saving}
          >
            Disable All Tracking
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              const allEnabled = {
                // Custom Analytics System (CutQ Internal)
                trackPageViews: true,
                trackUserActions: true,
                trackConversions: true,
                trackErrors: true,
                trackSmsMessages: true,
                trackEmailMessages: true,
                trackWhatsappMessages: true,
                trackBookingFunnel: true,
                trackSalonViews: true,
                trackServiceViews: true,
                trackStylistViews: true,
                trackActiveSessions: true,
                trackRealTimeActions: true,

                // Google Analytics (External)
                enableGoogleAnalytics: true,
                googleAnalyticsPageViews: true,
                googleAnalyticsEvents: true,
                googleAnalyticsConversions: true,
                googleAnalyticsErrors: true,
                googleAnalyticsWebVitals: true,
              };
              setConfig({ ...config, ...allEnabled });
              updateConfig(allEnabled);
            }}
            disabled={saving}
          >
            Enable All Tracking
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSettings;
