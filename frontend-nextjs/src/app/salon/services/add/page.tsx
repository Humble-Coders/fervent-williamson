'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
// import { useAuthStore } from '../../../../store/authStore'; // Removed unused import
import { salonCategoryService, SalonServiceCategory } from '../../../../services/salonCategoryService';
import { serviceService } from '../../../../services/serviceService';

interface ServiceFormData {
  name: string;
  description: string;
  duration: number;
  price: number;
  categoryId: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  isActive: boolean;
  images: string[];
}

const AddServicePage: React.FC = () => {
  const router = useRouter();
  // const { user } = useAuthStore(); // Removed unused variable
  const [categories, setCategories] = useState<SalonServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    categoryId: '',
    gender: 'UNISEX',
    isActive: true,
    images: []
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      logger.info('🔄 Loading categories for add service page...');
      const categoriesData = await salonCategoryService.getAvailableCategories();
      logger.info('🏷️ Categories loaded:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      logger.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'temp');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      logger.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Service name is required');
      return;
    }

    if (formData.duration <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }

    if (formData.price < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    setSubmitting(true);
    try {
      const createData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: formData.duration,
        price: formData.price,
        categoryId: formData.categoryId,
        gender: formData.gender,
        isActive: formData.isActive,
        images: formData.images
      };

      await serviceService.createService(createData);
      toast.success('Service created successfully');
      router.push('/salon/services');
    } catch (error) {
      logger.error('Error creating service:', error);
      toast.error('Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/salon/services')}
              icon={<ArrowLeft />}
            >
              Back to Services
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Service</h1>
          <p className="text-gray-600">Create a new service for your salon</p>
        </div>

        {/* Form */}
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Hair Cut & Style, Manicure, Facial Treatment"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Service Category (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Category (optional)
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a category</option>
                {(categories || []).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.name} {category.isGlobal ? '(Global)' : '(Custom)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Minutes) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹ Rupees) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            {/* Service Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'MALE' | 'FEMALE' | 'UNISEX' }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="UNISEX">🚻 Unisex (For Everyone)</option>
                <option value="MALE">👨 Male</option>
                <option value="FEMALE">👩 Female</option>
              </select>
            </div>

            {/* Service Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Service description..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Service Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Images
              </label>
              
              {/* Image Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadingImages}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-lg font-medium text-gray-900 mb-2">
                    {uploadingImages ? 'Uploading...' : 'Upload service images'}
                  </div>
                  <div className="text-sm text-gray-500">
                    PNG, JPG, GIF up to 10MB each
                  </div>
                </label>
              </div>

              {/* Uploaded Images */}
              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Service image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Service */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active Service
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/salon/services')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                disabled={submitting}
              >
                {submitting ? 'Creating Service...' : 'Create Service'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AddServicePage;
