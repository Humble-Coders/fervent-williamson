import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { X, Plus } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { adminSalonService, CreateSalonData } from '../../services/adminSalonService';
import { extractErrorMessage } from '../../utils/errorHandler';
import { WorkingHours, BackendWorkingHours } from '../../types';

interface AddSalonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Form data type that uses frontend format (closed: boolean)
type FormSalonData = Omit<CreateSalonData, 'workingHours'> & {
  workingHours?: WorkingHours;
};

const AddSalonModal: React.FC<AddSalonModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormSalonData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    featured: false,
    isOpen: true,
    images: [],
    specialties: [],
    amenities: [],
    teamSize: 1,
    yearsInBusiness: 0,
    certifications: [],
    workingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true }
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        featured: false,
        isOpen: true,
        images: [],
        specialties: [],
        amenities: [],
        teamSize: 1,
        yearsInBusiness: 0,
        certifications: [],
        workingHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '09:00', close: '18:00', closed: false },
          sunday: { open: '09:00', close: '18:00', closed: true }
        }
      });
      setError(null);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Transform working hours from frontend format (closed) to backend format (isOpen)
      // Frontend uses: { closed: boolean } where true = closed
      // Backend expects: { isOpen: boolean } where true = open
      const transformedWorkingHours: BackendWorkingHours = {};

      if (formData.workingHours) {
        Object.entries(formData.workingHours).forEach(([day, schedule]) => {
          transformedWorkingHours[day as keyof BackendWorkingHours] = {
            open: schedule.open,
            close: schedule.close,
            isOpen: !schedule.closed // Convert closed to isOpen
          };
        });
      }

      const transformedData: CreateSalonData = {
        ...formData,
        workingHours: transformedWorkingHours
      };

      await adminSalonService.createSalon(transformedData);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      logger.error('Salon creation error:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-200/50">
          <div className="flex items-center justify-between p-8 border-b border-neutral-200/50">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Add New Salon
                </h2>
                <p className="text-sm text-text-secondary">Create a new salon profile</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-neutral-100 transition-colors"
            >
              <X className="h-6 w-6 text-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="bg-red-50/80 backdrop-blur-xl border border-red-200 rounded-2xl p-4">
                <div className="text-red-800 text-sm font-medium whitespace-pre-line">{error}</div>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Salon Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="rounded-2xl"
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="rounded-2xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Input
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="rounded-2xl"
                  />
                  <Input
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="rounded-2xl"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-2xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all duration-300"
                    placeholder="Describe your CutQ..."
                    required
                  />
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Settings</h3>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-text-secondary">Featured Salon</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="isOpen"
                      checked={formData.isOpen}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-text-secondary">Currently Open</span>
                  </label>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
                <p className="text-sm text-text-secondary">
                  <strong>Note:</strong> After creating the salon, you can add services, staff members, and configure detailed settings from the salon management page.
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200/50">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-2xl px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-6"
              >
                {loading ? 'Creating...' : 'Create Salon'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSalonModal;
