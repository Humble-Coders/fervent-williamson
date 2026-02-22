'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useParams } from 'next/navigation';
import { Calendar, Clock, Settings, Save } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { salonService } from '../../services/salonService';

interface BookingConfig {
  salon: {
    id: string;
    displayId?: number;
    name: string;
  };
  slotDuration: number;
  breakDuration: number;
  advanceBookingDays: number;
  minimumNoticeHours: number;
  bufferTime: number;
  maxBookingsPerDay: number;
  allowSameDayBooking: boolean;
  enabledPaymentMethods: string[];
  paymentMethods: any[];
}

interface PaymentMethodConfig {
  id: string;
  name: string;
  type: string;
  emoji: string;
  description: string;
  isActive: boolean;
}

const SalonBookingConfigPage: React.FC = () => {
  const { salonId } = useParams<{ salonId: string }>();
  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (salonId) {
      fetchConfig();
      fetchPaymentMethods();
    }
  }, [salonId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const salon = await salonService.getSalonById(salonId!);
      // Extract booking config from salon document
      const bookingConfig: BookingConfig = {
        salon: {
          id: salon.id,
          displayId: (salon as any).displayId,
          name: salon.name,
        },
        slotDuration: (salon as any).slotDuration || 30,
        breakDuration: (salon as any).breakDuration || 0,
        advanceBookingDays: (salon as any).advanceBookingDays || 30,
        minimumNoticeHours: (salon as any).minimumNoticeHours || 2,
        bufferTime: (salon as any).bufferTime || 15,
        maxBookingsPerDay: (salon as any).maxBookingsPerDay || 20,
        allowSameDayBooking: (salon as any).allowSameDayBooking ?? true,
        enabledPaymentMethods: (salon as any).enabledPaymentMethods || [],
        paymentMethods: (salon as any).paymentMethods || [],
      };
      setConfig(bookingConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    // Payment methods feature has been dropped; return empty array
    setAvailablePaymentMethods([]);
  };

  const handleSave = async () => {
    if (!config || !salonId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await salonService.updateSalon(salonId, {
        slotDuration: config.slotDuration,
        breakDuration: config.breakDuration,
        advanceBookingDays: config.advanceBookingDays,
        minimumNoticeHours: config.minimumNoticeHours,
        bufferTime: config.bufferTime,
        maxBookingsPerDay: config.maxBookingsPerDay,
        allowSameDayBooking: config.allowSameDayBooking,
        enabledPaymentMethods: config.enabledPaymentMethods,
      } as any);

      setSuccess('Configuration saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof BookingConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  const togglePaymentMethod = (methodType: string) => {
    if (!config) return;
    
    const enabled = config.enabledPaymentMethods.includes(methodType);
    const newMethods = enabled
      ? config.enabledPaymentMethods.filter(m => m !== methodType)
      : [...config.enabledPaymentMethods, methodType];
    
    updateConfig('enabledPaymentMethods', newMethods);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Configuration not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Booking Configuration</h1>
          <p className="text-text-secondary mt-1">
            Configure booking settings for {config.salon.name}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Settings */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-text-primary">Time Settings</h3>
          </div>

          <div className="space-y-4">
            <Input
              label="Slot Duration (minutes)"
              type="number"
              value={config.slotDuration}
              onChange={(e) => updateConfig('slotDuration', parseInt(e.target.value) || 30)}
              min={15}
              max={180}
            />

            <Input
              label="Break Duration (minutes)"
              type="number"
              value={config.breakDuration}
              onChange={(e) => updateConfig('breakDuration', parseInt(e.target.value) || 0)}
              min={0}
              max={60}
            />

            <Input
              label="Buffer Time (minutes)"
              type="number"
              value={config.bufferTime}
              onChange={(e) => updateConfig('bufferTime', parseInt(e.target.value) || 15)}
              min={0}
              max={60}
            />
          </div>
        </Card>

        {/* Booking Rules */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-text-primary">Booking Rules</h3>
          </div>

          <div className="space-y-4">
            <Input
              label="Advance Booking Days"
              type="number"
              value={config.advanceBookingDays}
              onChange={(e) => updateConfig('advanceBookingDays', parseInt(e.target.value) || 30)}
              min={1}
              max={365}
            />

            <Input
              label="Minimum Notice Hours"
              type="number"
              value={config.minimumNoticeHours}
              onChange={(e) => updateConfig('minimumNoticeHours', parseInt(e.target.value) || 2)}
              min={0}
              max={72}
            />

            <Input
              label="Max Bookings Per Day"
              type="number"
              value={config.maxBookingsPerDay}
              onChange={(e) => updateConfig('maxBookingsPerDay', parseInt(e.target.value) || 20)}
              min={1}
              max={100}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowSameDayBooking"
                checked={config.allowSameDayBooking}
                onChange={(e) => updateConfig('allowSameDayBooking', e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="allowSameDayBooking" className="text-sm font-medium text-text-primary">
                Allow Same Day Booking
              </label>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-text-primary">Payment Methods</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePaymentMethods.map((method) => (
              <div
                key={method.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  config.enabledPaymentMethods.includes(method.type)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                onClick={() => togglePaymentMethod(method.type)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{method.emoji}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary">{method.name}</h4>
                    <p className="text-sm text-text-muted">{method.description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded border-2 ${
                    config.enabledPaymentMethods.includes(method.type)
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-neutral-300'
                  }`}>
                    {config.enabledPaymentMethods.includes(method.type) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SalonBookingConfigPage;
