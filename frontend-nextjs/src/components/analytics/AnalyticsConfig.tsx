import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import {
  Settings,
  RotateCcw,
  Eye,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { analyticsConfigApi, AnalyticsConfigData } from '../../services/analyticsConfigApi';

interface AnalyticsConfigProps {
  onConfigChange?: (config: AnalyticsConfigData) => void;
}

const AnalyticsConfig: React.FC<AnalyticsConfigProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<AnalyticsConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const configData = await analyticsConfigApi.getConfig();
      setConfig(configData);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics configuration');
      logger.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = async (updates: Partial<AnalyticsConfigData>) => {
    if (!config) return;

    try {
      setSaving(true);
      const updatedConfig = await analyticsConfigApi.updateConfig(updates);
      setConfig(updatedConfig);
      setSuccessMessage('Configuration updated successfully');
      onConfigChange?.(updatedConfig);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update configuration');
      logger.error('Failed to update config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetConfig = async () => {
    if (!confirm('Are you sure you want to reset all analytics settings to defaults?')) {
      return;
    }

    try {
      setSaving(true);
      const resetConfig = await analyticsConfigApi.resetConfig();
      setConfig(resetConfig);
      setSuccessMessage('Configuration reset to defaults');
      onConfigChange?.(resetConfig);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to reset configuration');
      logger.error('Failed to reset config:', err);
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <Settings className="h-12 w-12 mx-auto mb-4" />
          <p>Failed to load analytics configuration</p>
          <button
            onClick={loadConfig}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Analytics Configuration</h2>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleResetConfig}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}
      </div>

      <div className="p-6 space-y-8">
        {/* Page View Tracking */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <Eye className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Page View Tracking</h3>
          </div>
          <div className="space-y-4 ml-8">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Track Page Views</label>
                <p className="text-sm text-gray-500">Record when users visit different pages</p>
              </div>
              <ToggleSwitch
                enabled={config.trackPageViews}
                onChange={(enabled) => handleConfigUpdate({ trackPageViews: enabled })}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Track User Actions</label>
                <p className="text-sm text-gray-500">Record button clicks and user interactions</p>
              </div>
              <ToggleSwitch
                enabled={config.trackUserActions}
                onChange={(enabled) => handleConfigUpdate({ trackUserActions: enabled })}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Track Conversions</label>
                <p className="text-sm text-gray-500">Record booking completions and key events</p>
              </div>
              <ToggleSwitch
                enabled={config.trackConversions}
                onChange={(enabled) => handleConfigUpdate({ trackConversions: enabled })}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Track Errors</label>
                <p className="text-sm text-gray-500">Record application errors and issues</p>
              </div>
              <ToggleSwitch
                enabled={config.trackErrors}
                onChange={(enabled) => handleConfigUpdate({ trackErrors: enabled })}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Communication Tracking */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Communication Tracking</h3>
          </div>
          <div className="space-y-4 ml-8">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Track SMS Messages</label>
                <p className="text-sm text-gray-500">Record SMS delivery status and metrics</p>
              </div>
              <ToggleSwitch
                enabled={config.trackSmsMessages}
                onChange={(enabled) => handleConfigUpdate({ trackSmsMessages: enabled })}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Track Email Messages</label>
                <p className="text-sm text-gray-500">Record email delivery, opens, and clicks</p>
              </div>
              <ToggleSwitch
                enabled={config.trackEmailMessages}
                onChange={(enabled) => handleConfigUpdate({ trackEmailMessages: enabled })}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Track WhatsApp Messages</label>
                <p className="text-sm text-gray-500">Record WhatsApp delivery status</p>
              </div>
              <ToggleSwitch
                enabled={config.trackWhatsappMessages}
                onChange={(enabled) => handleConfigUpdate({ trackWhatsappMessages: enabled })}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Business Analytics */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">Business Analytics</h3>
          </div>
          <div className="space-y-4 ml-8">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Track Booking Funnel</label>
                <p className="text-sm text-gray-500">Record booking process steps and conversions</p>
              </div>
              <ToggleSwitch
                enabled={config.trackBookingFunnel}
                onChange={(enabled) => handleConfigUpdate({ trackBookingFunnel: enabled })}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Track CutQ Views</label>
                <p className="text-sm text-gray-500">Record CutQ page visits and engagement</p>
              </div>
              <ToggleSwitch
                enabled={config.trackSalonViews}
                onChange={(enabled) => handleConfigUpdate({ trackSalonViews: enabled })}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Track Service Views</label>
                <p className="text-sm text-gray-500">Record service page visits and interest</p>
              </div>
              <ToggleSwitch
                enabled={config.trackServiceViews}
                onChange={(enabled) => handleConfigUpdate({ trackServiceViews: enabled })}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Track Stylist Views</label>
                <p className="text-sm text-gray-500">Record stylist profile visits</p>
              </div>
              <ToggleSwitch
                enabled={config.trackStylistViews}
                onChange={(enabled) => handleConfigUpdate({ trackStylistViews: enabled })}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsConfig;
