'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Save, Bell, Clock, IndianRupee, Users, Shield, Camera, MapPin, Edit3, Eye, Settings, User, Building, Package, X, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import { salonService } from '../../services/salonService';


interface SalonSettings {
  // Basic Information
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  
  // Business Hours
  workingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
  
  // Booking Settings
  slotDuration: number;
  breakDuration: number;
  advanceBookingDays: number;
  minimumNoticeHours: number;
  bufferTime: number;
  maxBookingsPerDay: number;
  allowSameDayBooking: boolean;
  
  // Payment Settings
  enabledPaymentMethods: string[];
  requirePaymentAtBooking: boolean;
  cancellationPolicy: string;
  
  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderHours: number;
  
  // Stylist Settings
  allowStylistSelfBooking: boolean;
  requireStylistApproval: boolean;
}

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);



  // Get active tab from URL
  const getActiveTabFromUrl = (): 'profile' | 'booking' | 'payment' | 'notifications' | 'system' => {
    const tab = searchParams.get('tab') as 'profile' | 'booking' | 'payment' | 'notifications' | 'system';
    return tab || 'profile';
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'booking' | 'payment' | 'notifications' | 'system'>(getActiveTabFromUrl());

  // Default working hours structure
  const defaultWorkingHours = {
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '09:00', close: '18:00', isOpen: true },
    sunday: { open: '09:00', close: '18:00', isOpen: false }
  };

  // Update URL when tab changes
  const handleTabChange = (tab: 'profile' | 'booking' | 'payment' | 'notifications' | 'system') => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('tab', tab);
    router.replace(`${pathname}?${newSearchParams.toString()}`);
  };

  // Update tab when URL changes
  useEffect(() => {
    const newTab = getActiveTabFromUrl();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [searchParams]);





  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user's owned salon data
        if (!user?.ownedSalons || user.ownedSalons.length === 0) {
          // For demo purposes, use a default salon if user doesn't own one
          // In production, this should redirect to salon creation or show appropriate message
          logger.warn('User does not own any salons, using demo data');

          const defaultSettings: SalonSettings = {
            name: 'Demo Salon',
            description: 'This is a demo salon for testing purposes',
            address: '123 Demo Street, Demo City',
            phone: '+1234567890',
            email: 'demo@salon.com',
            website: 'https://demo-salon.com',
            workingHours: defaultWorkingHours,
            slotDuration: 30,
            breakDuration: 0,
            advanceBookingDays: 30,
            minimumNoticeHours: 2,
            bufferTime: 15,
            maxBookingsPerDay: 20,
            allowSameDayBooking: true,
            enabledPaymentMethods: ['cash'],
            requirePaymentAtBooking: false,
            cancellationPolicy: '',
            emailNotifications: true,
            smsNotifications: false,
            reminderHours: 24,
            allowStylistSelfBooking: false,
            requireStylistApproval: true,
          };

          // Ensure working hours are always defined
          if (!defaultSettings.workingHours) {
            defaultSettings.workingHours = defaultWorkingHours;
          }


          setSettings(defaultSettings);
          return;
        }

        // Get the first owned salon (assuming one salon per owner for now)
        const salonId = user.ownedSalons[0].id;
        const salonData = await salonService.getSalonById(salonId);

        // Transform salon data to settings format
        const salonSettings: SalonSettings = {
          name: salonData.name || '',
          description: salonData.description || '',
          address: salonData.address || '',
          phone: salonData.phone || '',
          email: salonData.email || '',
          website: '', // TODO: Add website field to salon model
          workingHours: (salonData.workingHours as any) || defaultWorkingHours,
          slotDuration: (salonData as any).slotDuration || 30,
          breakDuration: (salonData as any).breakDuration || 0,
          advanceBookingDays: (salonData as any).advanceBookingDays || 30,
          minimumNoticeHours: (salonData as any).minimumNoticeHours || 2,
          bufferTime: (salonData as any).bufferTime || 15,
          maxBookingsPerDay: (salonData as any).maxBookingsPerDay || 20,
          allowSameDayBooking: (salonData as any).allowSameDayBooking ?? true,
          enabledPaymentMethods: (salonData as any).enabledPaymentMethods || ['cash'],
          requirePaymentAtBooking: false, // TODO: Add to salon model
          cancellationPolicy: '', // TODO: Add to salon model
          emailNotifications: (salonData as any).emailNotifications ?? true,
          smsNotifications: (salonData as any).smsNotifications ?? false,
          reminderHours: (salonData as any).reminderHours || 24,
          allowStylistSelfBooking: false, // TODO: Add to salon model
          requireStylistApproval: true, // TODO: Add to salon model
        };

        // Ensure working hours are always defined
        if (!salonSettings.workingHours) {
          salonSettings.workingHours = defaultWorkingHours;
        }


        setSettings(salonSettings);
      } catch (error) {
        logger.error('Error fetching settings:', error);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSettings();
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!settings || !user?.ownedSalons || user.ownedSalons.length === 0) {
        throw new Error('No salon data to save');
      }

      const salonId = user.ownedSalons[0].id;

      // Update salon with new settings
      await salonService.updateSalon(salonId, {
        name: settings.name,
        description: settings.description,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        workingHours: settings.workingHours as any,
        slotDuration: settings.slotDuration,
        breakDuration: settings.breakDuration,
        advanceBookingDays: settings.advanceBookingDays,
        minimumNoticeHours: settings.minimumNoticeHours,
        bufferTime: settings.bufferTime,
        maxBookingsPerDay: settings.maxBookingsPerDay || null,
        allowSameDayBooking: settings.allowSameDayBooking,
        enabledPaymentMethods: settings.enabledPaymentMethods,
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        reminderHours: settings.reminderHours,
      } as any);

      logger.info('Settings saved successfully');
      setHasChanges(false);

      // Refetch the salon data to reflect the saved changes
      const salonData = await salonService.getSalonById(salonId);
      const salonSettings: SalonSettings = {
        name: salonData.name || '',
        description: salonData.description || '',
        address: salonData.address || '',
        phone: salonData.phone || '',
        email: salonData.email || '',
        website: '',
        workingHours: (salonData.workingHours as any) || defaultWorkingHours,
        slotDuration: (salonData as any).slotDuration || 30,
        breakDuration: (salonData as any).breakDuration || 0,
        advanceBookingDays: (salonData as any).advanceBookingDays || 30,
        minimumNoticeHours: (salonData as any).minimumNoticeHours || 2,
        bufferTime: (salonData as any).bufferTime || 15,
        maxBookingsPerDay: (salonData as any).maxBookingsPerDay || 20,
        allowSameDayBooking: (salonData as any).allowSameDayBooking ?? true,
        enabledPaymentMethods: (salonData as any).enabledPaymentMethods || ['cash'],
        requirePaymentAtBooking: false,
        cancellationPolicy: '',
        emailNotifications: (salonData as any).emailNotifications ?? true,
        smsNotifications: (salonData as any).smsNotifications ?? false,
        reminderHours: (salonData as any).reminderHours || 24,
        allowStylistSelfBooking: false,
        requireStylistApproval: true,
      };
      setSettings(salonSettings);
    } catch (error) {
      logger.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<SalonSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
      setHasChanges(true);
    }
  };



  const toggleEditMode = () => {
    if (isEditMode && hasChanges) {
      // Ask for confirmation if there are unsaved changes
      if (window.confirm('You have unsaved changes. Do you want to discard them?')) {
        setIsEditMode(false);
        setHasChanges(false);
        // Reload settings to discard changes
        window.location.reload();
      }
    } else {
      setIsEditMode(!isEditMode);
    }
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    if (!error) {
      setIsEditMode(false);
      setHasChanges(false);
    }
  };

  const updateWorkingHours = (day: string, hours: { open: string; close: string; isOpen: boolean }) => {
    if (settings) {
      setSettings({
        ...settings,
        workingHours: {
          ...settings.workingHours,
          [day]: hours
        }
      });
      setHasChanges(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Save className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Settings</h3>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!settings) return null;

  const tabs = [
    { id: 'profile', name: 'Salon Profile', icon: Building },
    { id: 'booking', name: 'Booking Settings', icon: Clock },
    { id: 'payment', name: 'Payment Settings', icon: IndianRupee },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    // { id: 'system', name: 'System Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your salon configuration and preferences</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {/* View/Edit Toggle */}
          <Button
            variant="outline"
            onClick={toggleEditMode}
            className="flex items-center"
          >
            {isEditMode ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                View Mode
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Mode
              </>
            )}
          </Button>

          {/* Save Button - only show in edit mode */}
          {isEditMode && (
            <Button
              onClick={handleSaveAndExit}
              disabled={saving || !hasChanges}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save & Exit'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Salon Profile</h3>
              {!isEditMode && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  View Only
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salon Name</label>
                {isEditMode ? (
                  <Input
                    value={settings.name}
                    onChange={(e) => updateSettings({ name: e.target.value })}
                    placeholder="Enter salon name"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {settings.name || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                {isEditMode ? (
                  <Input
                    value={settings.phone}
                    onChange={(e) => updateSettings({ phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {settings.phone || 'Not set'}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                {isEditMode ? (
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSettings({ email: e.target.value })}
                    placeholder="Enter email address"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {settings.email || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                {isEditMode ? (
                  <Input
                    value={settings.website || ''}
                    onChange={(e) => updateSettings({ website: e.target.value })}
                    placeholder="https://your-salon.com"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {settings.website ? (
                      <a href={settings.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {settings.website}
                      </a>
                    ) : (
                      'Not set'
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              {isEditMode ? (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  value={settings.description}
                  onChange={(e) => updateSettings({ description: e.target.value })}
                  placeholder="Describe your salon..."
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 min-h-[100px] whitespace-pre-wrap">
                  {settings.description || 'No description provided'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              {isEditMode ? (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  value={settings.address}
                  onChange={(e) => updateSettings({ address: e.target.value })}
                  placeholder="Enter full address..."
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 min-h-[80px] whitespace-pre-wrap">
                  {settings.address || 'No address provided'}
                </div>
              )}
            </div>

            {/* Working Hours */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Working Hours</h4>



              <div className="space-y-4">
                {/* Always show working hours, even if empty */}
                {settings?.workingHours ? (
                  Object.entries(settings.workingHours).map(([day, hours]) => (
                    <div key={day} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      {/* Day and Open/Closed Toggle */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hours.isOpen}
                            onChange={(e) => updateWorkingHours(day, { ...hours, isOpen: e.target.checked })}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            disabled={!isEditMode}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            {hours.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </label>
                      </div>

                      {/* Time Inputs - Mobile Friendly */}
                      {hours.isOpen && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-12">From:</span>
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateWorkingHours(day, { ...hours, open: e.target.value })}
                              className="flex-1 min-w-0"
                              disabled={!isEditMode}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-12">To:</span>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateWorkingHours(day, { ...hours, close: e.target.value })}
                              className="flex-1 min-w-0"
                              disabled={!isEditMode}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                    <p>No working hours configured</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'booking' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Booking Settings</h3>
              {!isEditMode && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  View Only
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slot Duration (minutes)</label>
                <Input
                  type="number"
                  value={settings.slotDuration}
                  onChange={(e) => updateSettings({ slotDuration: parseInt(e.target.value) })}
                  disabled={!isEditMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Break Duration (minutes)
                  <span className="block text-xs font-normal text-gray-500 mt-1">
                    Currently not used - use Buffer Time instead
                  </span>
                </label>
                <Input
                  type="number"
                  value={settings.breakDuration}
                  onChange={(e) => updateSettings({ breakDuration: parseInt(e.target.value) })}
                  disabled={!isEditMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Advance Booking Days</label>
                <Input
                  type="number"
                  value={settings.advanceBookingDays}
                  onChange={(e) => updateSettings({ advanceBookingDays: parseInt(e.target.value) })}
                  disabled={!isEditMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Notice Hours
                  <span className="block text-xs font-normal text-gray-500 mt-1">
                    Accepts decimals (e.g., 0.5 = 30 minutes)
                  </span>
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={settings.minimumNoticeHours}
                  onChange={(e) => updateSettings({ minimumNoticeHours: parseFloat(e.target.value) })}
                  disabled={!isEditMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buffer Time (minutes)
                  <span className="block text-xs font-normal text-gray-500 mt-1">
                    Time added after each appointment for cleanup/preparation
                  </span>
                </label>
                <Input
                  type="number"
                  value={settings.bufferTime}
                  onChange={(e) => updateSettings({ bufferTime: parseInt(e.target.value) })}
                  disabled={!isEditMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Bookings Per Day
                  <span className="block text-xs font-normal text-gray-500 mt-1">
                    Leave empty for unlimited bookings
                  </span>
                </label>
                <Input
                  type="number"
                  value={settings.maxBookingsPerDay || ''}
                  onChange={(e) => updateSettings({ maxBookingsPerDay: e.target.value ? parseInt(e.target.value) : 0 })}
                  disabled={!isEditMode}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.allowSameDayBooking}
                  onChange={(e) => updateSettings({ allowSameDayBooking: e.target.checked })}
                  disabled={!isEditMode}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="ml-2 text-sm text-gray-700">Allow same-day booking</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Payment Settings</h3>
              {!isEditMode && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  View Only
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Enabled Payment Methods</label>
              <div className="space-y-2">
                {[
                  { id: 'card', name: 'Credit/Debit Card' },
                  { id: 'wallet', name: 'Digital Wallet' },
                  { id: 'cash', name: 'Cash' },
                ].map((method) => (
                  <label key={method.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.enabledPaymentMethods.includes(method.id)}
                      onChange={(e) => {
                        const methods = e.target.checked
                          ? [...settings.enabledPaymentMethods, method.id]
                          : settings.enabledPaymentMethods.filter(m => m !== method.id);
                        updateSettings({ enabledPaymentMethods: methods });
                      }}
                      disabled={!isEditMode}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="ml-2 text-sm text-gray-700">{method.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.requirePaymentAtBooking}
                  onChange={(e) => updateSettings({ requirePaymentAtBooking: e.target.checked })}
                  disabled={!isEditMode}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="ml-2 text-sm text-gray-700">Require payment at booking</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                rows={3}
                value={settings.cancellationPolicy}
                onChange={(e) => updateSettings({ cancellationPolicy: e.target.value })}
                disabled={!isEditMode}
              />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              {!isEditMode && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  View Only
                </span>
              )}
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => updateSettings({ emailNotifications: e.target.checked })}
                  disabled={!isEditMode}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="ml-2 text-sm text-gray-700">Email notifications</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => updateSettings({ smsNotifications: e.target.checked })}
                  disabled={!isEditMode}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Hours Before Appointment</label>
              <Input
                type="number"
                value={settings.reminderHours}
                onChange={(e) => updateSettings({ reminderHours: parseInt(e.target.value) })}
                disabled={!isEditMode}
                className="w-32"
              />
            </div>
          </div>
        )}



        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
              {!isEditMode && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  View Only
                </span>
              )}
            </div>

            <div className="space-y-6">
              {/* Salon Self-Signup */}
              {/* <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Salon Registration</h4>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowStylistSelfBooking || false}
                    onChange={(e) => updateSettings({ allowStylistSelfBooking: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={!isEditMode}
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow new salon self-registration</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  When disabled, new salon requests will be sent to admin for approval
                </p>
              </div> */}

              {/* Booking Settings */}
              {/* <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Booking Configuration</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.requireStylistApproval || false}
                      onChange={(e) => updateSettings({ requireStylistApproval: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      disabled={!isEditMode}
                    />
                    <span className="ml-2 text-sm text-gray-700">Require stylist approval for bookings</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.allowStylistSelfBooking || false}
                      onChange={(e) => updateSettings({ allowStylistSelfBooking: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      disabled={!isEditMode}
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow stylists to manage their own bookings</span>
                  </label>
                </div>
              </div> */}

              {/* Email Configuration */}
              {/* <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Email Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Provider</label>
                    {isEditMode ? (
                      <select
                        value={settings.website || 'custom'}
                        onChange={(e) => updateSettings({ website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="custom">Custom SMTP</option>
                        <option value="google">Google (Gmail)</option>
                        <option value="microsoft">Microsoft (Outlook)</option>
                      </select>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                        {settings.website || 'Custom SMTP'}
                      </div>
                    )}
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        )}
      </div>


    </div>
  );
};



export default SettingsPage;
