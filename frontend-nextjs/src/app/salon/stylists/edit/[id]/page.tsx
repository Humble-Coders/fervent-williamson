'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../../../../components/ui/Button';
import Card from '../../../../../components/ui/Card';
import MultiSelectDropdown, { MultiSelectOption } from '../../../../../components/ui/MultiSelectDropdown';
import Loading from '../../../../../components/ui/Loading';
// import { useAuthStore } from '../../../../../store/authStore'; // Removed unused import
import { stylistService, UpdateStylistData, getSalonServices } from '../../../../../services/stylistService';
import { Service } from '../../../../../services/serviceService';

interface StylistFormData {
  name: string;
  email: string;
  phone: string;
  specialties: string;
  serviceIds: string[];
  canDoAllServices: boolean;
  experience: number;
  isActive: boolean;
  images: string[];
}

const EditStylistPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const stylistId = params.id as string;
  // const { user } = useAuthStore(); // Removed unused variable
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [services, setServices] = useState<MultiSelectOption[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [formData, setFormData] = useState<StylistFormData>({
    name: '',
    email: '',
    phone: '',
    specialties: '',
    serviceIds: [],
    canDoAllServices: false,
    experience: 0,
    isActive: true,
    images: []
  });

  useEffect(() => {
    loadStylistAndServices();
  }, [stylistId]);

  const loadStylistAndServices = async () => {
    try {
      logger.info('🔄 Loading stylist and services for edit:', stylistId);

      const [stylist, servicesData] = await Promise.all([
        stylistService.getStylist(stylistId),
        getSalonServices().catch(() => {
          // Mock services for demonstration while backend API is being developed
          const mockServices: MultiSelectOption[] = [
            { id: '1', name: 'Hair Cut', price: 500, duration: 45, description: 'Professional hair cutting service', category: 'Hair Services' },
            { id: '2', name: 'Hair Color', price: 1500, duration: 120, description: 'Full hair coloring and styling', category: 'Hair Services' },
            { id: '3', name: 'Hair Highlights', price: 2000, duration: 150, description: 'Partial highlights and lowlights', category: 'Hair Services' },
            { id: '4', name: 'Hair Wash & Blow Dry', price: 300, duration: 30, description: 'Basic hair wash and styling', category: 'Hair Services' },
            { id: '5', name: 'Facial Treatment', price: 800, duration: 60, description: 'Deep cleansing facial treatment', category: 'Facial & Skincare' },
            { id: '6', name: 'Anti-Aging Facial', price: 1200, duration: 90, description: 'Advanced anti-aging treatment', category: 'Facial & Skincare' },
            { id: '7', name: 'Acne Treatment', price: 900, duration: 75, description: 'Specialized acne treatment', category: 'Facial & Skincare' },
            { id: '8', name: 'Manicure', price: 400, duration: 30, description: 'Basic nail care and polish', category: 'Nail Services' },
            { id: '9', name: 'Pedicure', price: 500, duration: 45, description: 'Foot care and nail treatment', category: 'Nail Services' },
            { id: '10', name: 'Gel Manicure', price: 600, duration: 45, description: 'Long-lasting gel nail polish', category: 'Nail Services' },
            { id: '11', name: 'Nail Art', price: 800, duration: 60, description: 'Creative nail art designs', category: 'Nail Services' },
            { id: '12', name: 'Swedish Massage', price: 1200, duration: 90, description: 'Relaxing full body massage', category: 'Massage & Spa' },
            { id: '13', name: 'Deep Tissue Massage', price: 1400, duration: 90, description: 'Therapeutic deep tissue work', category: 'Massage & Spa' },
            { id: '14', name: 'Hot Stone Massage', price: 1600, duration: 120, description: 'Relaxing hot stone therapy', category: 'Massage & Spa' },
            { id: '15', name: 'Bridal Makeup', price: 2500, duration: 120, description: 'Complete bridal makeup package', category: 'Makeup & Beauty' },
            { id: '16', name: 'Party Makeup', price: 1500, duration: 60, description: 'Glamorous party makeup', category: 'Makeup & Beauty' },
            { id: '17', name: 'Eyebrow Threading', price: 200, duration: 15, description: 'Precise eyebrow shaping', category: 'Makeup & Beauty' },
            { id: '18', name: 'Eyelash Extensions', price: 1800, duration: 120, description: 'Individual eyelash extensions', category: 'Makeup & Beauty' },
            { id: '19', name: 'Body Scrub', price: 1000, duration: 60, description: 'Exfoliating body treatment', category: 'Body Treatments' },
            { id: '20', name: 'Body Wrap', price: 1500, duration: 90, description: 'Detoxifying body wrap', category: 'Body Treatments' }
          ];
          logger.info('📋 Using mock services for demonstration:', mockServices);
          return mockServices;
        }).then(rawServices => {
          // Convert Service[] to MultiSelectOption[] if needed
          if (rawServices.length > 0 && 'categoryId' in rawServices[0]) {
            return (rawServices as Service[]).map((service: Service) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              price: service.price,
              duration: service.duration,
              category: service.categoryId
            }));
          }
          // Convert mock services to MultiSelectOption format
          return rawServices.map((service: any) => ({
            id: service.id,
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            category: service.category
          }));
        })
      ]);

      logger.info('📋 Services loaded:', servicesData);
      setServices(servicesData);
      setLoadingServices(false);

      setFormData({
        name: stylist.name || '',
        email: stylist.email || '',
        phone: stylist.phone || '',
        specialties: stylist.specialties?.join(', ') || '',
        serviceIds: (stylist as any).serviceIds || [],
        canDoAllServices: (stylist as any).canDoAllServices || false,
        experience: stylist.experience || 0,
        isActive: stylist.isActive,
        images: stylist.images || []
      });

      logger.info('✅ Stylist loaded for edit:', stylist);
    } catch (error) {
      logger.error('❌ Error loading stylist:', error);
      toast.error('Failed to load stylist');
      router.push('/salon/stylists');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof StylistFormData, value: string | string[] | File[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServicesChange = (selectedIds: string[]) => {
    if (formData.canDoAllServices) return; // Don't allow changes when "All Services" is enabled

    setFormData(prev => ({
      ...prev,
      serviceIds: selectedIds
    }));
  };

  const handleAllServicesToggle = (canDoAll: boolean) => {
    setFormData(prev => ({
      ...prev,
      canDoAllServices: canDoAll,
      serviceIds: canDoAll ? [] : prev.serviceIds // Clear individual selections when "All" is enabled
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      // TODO: Implement image upload logic
      // For now, just add placeholder URLs
      const newImages = Array.from(files).map((file) =>
        URL.createObjectURL(file)
      );
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
      
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      logger.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Stylist name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    if (!formData.specialties.trim()) {
      toast.error('Specialties are required');
      return;
    }

    if (!formData.canDoAllServices && formData.serviceIds.length === 0) {
      toast.error('Please select at least one service or enable "Can do all services"');
      return;
    }

    setSubmitting(true);
    try {
      const updateData: UpdateStylistData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s.length > 0),
        serviceIds: formData.canDoAllServices ? [] : formData.serviceIds,
        canDoAllServices: formData.canDoAllServices,
        experience: formData.experience,
        isActive: formData.isActive,
        images: formData.images
      };

      await stylistService.updateStylist(stylistId, updateData);
      toast.success('Stylist updated successfully');
      router.push('/salon/stylists');
    } catch (error: unknown) {
      logger.error('Error updating stylist:', error);
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update stylist');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/salon/stylists');
  };

  if (loading) {
    return <Loading text="Loading stylist..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          icon={<ArrowLeft />}
        >
          Back to Stylists
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Stylist</h1>
          <p className="text-gray-600">Update stylist information</p>
        </div>
      </div>

      {/* Form */}
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience (Years)
              </label>
              <input
                type="number"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                min="0"
                max="50"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialties (comma-separated) *
            </label>
            <textarea
              value={formData.specialties}
              onChange={(e) => handleInputChange('specialties', e.target.value)}
              placeholder="Hair Cutting, Hair Coloring, Styling"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Services Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Services *
            </label>

            {/* All Services Toggle */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="canDoAllServices"
                checked={formData.canDoAllServices}
                onChange={(e) => handleAllServicesToggle(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="canDoAllServices" className="text-sm font-medium text-gray-700">
                Can do all services
              </label>
            </div>

            {/* Services Multi-Select Dropdown */}
            {loadingServices ? (
              <div className="text-center py-4 text-gray-500">Loading services...</div>
            ) : (
              <MultiSelectDropdown
                options={services}
                selectedIds={formData.canDoAllServices ? services.map(s => s.id) : formData.serviceIds}
                onSelectionChange={handleServicesChange}
                placeholder="Select services this stylist can perform..."
                disabled={formData.canDoAllServices}
                showSearch={true}
                showSelectAll={true}
                className="w-full"
              />
            )}

            {formData.canDoAllServices && (
              <div className="mt-2 text-sm text-gray-600">
                ✓ This stylist can perform all available services
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience (Years)
            </label>
            <input
              type="number"
              value={formData.experience}
              onChange={(e) => handleInputChange('experience', e.target.value)}
              min="0"
              max="50"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stylist Images
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Upload stylist images</p>
              <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImages}
              />
            </div>

            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Stylist image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked.toString())}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active Stylist
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
            >
              Update Stylist
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditStylistPage;
