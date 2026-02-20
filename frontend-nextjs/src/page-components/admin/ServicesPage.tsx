'use client';
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  Clock,
  Tag,
  Loader2,
  AlertCircle,
  X,
  Upload
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { serviceService, Service, CreateServiceData, ServiceCategory } from '../../services/serviceService';
import { adminSalonService } from '../../services/adminSalonService';
import { uploadService } from '../../services/uploadService';
import { categoryService } from '../../services/categoryService';

interface Salon {
  id: string;
  name: string;
}

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalon, setSelectedSalon] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateServiceData>({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    popular: false,
    emoji: '',
    gender: 'UNISEX',
    images: [],
    salonId: '',
    categoryId: '',
    isActive: true,
  });

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [servicesData, salonsData, categoriesData] = await Promise.all([
        serviceService.getAllServices(),
        adminSalonService.getAllSalons(),
        categoryService.getAllCategories()
      ]);

      setServices(servicesData);
      setSalons(salonsData.map(salon => ({ id: salon.id, name: salon.name })));
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let iconUrl = formData.emoji;

      // Upload icon file if provided
      if (iconFile) {
        const uploadedFile = await uploadService.uploadFile(iconFile, 'service-icons');
        iconUrl = uploadedFile.url;
      }

      const serviceData = {
        ...formData,
        emoji: iconUrl,
      };

      if (editingService) {
        await serviceService.updateService(editingService.id, serviceData);
      } else {
        await serviceService.createService(serviceData);
      }

      await loadData();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      popular: service.popular,
      emoji: service.emoji || '',
      gender: service.gender || 'UNISEX',
      salonId: service.salonId,
      categoryId: service.categoryId,
      isActive: service.isActive,
    });
    setIconPreview(service.emoji || '');
    setShowEditModal(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await serviceService.deleteService(serviceId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      duration: 60,
      price: 0,
      popular: false,
      emoji: '',
      salonId: '',
      categoryId: '',
      isActive: true,
    });
    setIconFile(null);
    setIconPreview('');
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSalon = !selectedSalon || service.salonId === selectedSalon;
    const matchesCategory = !selectedCategory || service.categoryId === selectedCategory;
    
    return matchesSearch && matchesSalon && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-2 text-text-secondary">Loading services...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Services Management</h1>
          <p className="text-text-secondary">Manage salon services and categories</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="hidden md:block absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3 md:pl-10"
            />
          </div>
          
          <select
            value={selectedSalon}
            onChange={(e) => setSelectedSalon(e.target.value)}
            className="input"
          >
            <option value="">All Salons</option>
            {salons.map(salon => (
              <option key={salon.id} value={salon.id}>{salon.name}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedSalon('');
              setSelectedCategory('');
            }}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <Card key={service.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {service.emoji ? (
                  service.emoji.startsWith('http') ? (
                    <img src={service.emoji} alt="" className="w-8 h-8 rounded" />
                  ) : (
                    <span className="text-2xl">{service.emoji}</span>
                  )
                ) : (
                  <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                    <Tag className="w-4 h-4 text-primary-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-text-primary">{service.name}</h3>
                  <p className="text-sm text-text-muted">{service.salon?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge
                  variant={service.isActive ? 'success' : 'error'}
                  size="sm"
                >
                  {service.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {service.popular && (
                  <Badge variant="warning" size="sm">
                    <Star className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-text-secondary text-sm mb-4 line-clamp-2">
              {service.description}
            </p>

            <div className="flex items-center justify-between text-sm text-text-muted mb-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {serviceService.formatDuration(service.duration)}
              </div>
              <div className="flex items-center gap-1">
                {serviceService.formatPrice(service.price)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-text-muted">
                {service._count?.bookings || 0} bookings
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(service)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(service.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No services found</h3>
          <p className="text-text-secondary">
            {searchTerm || selectedSalon || selectedCategory
              ? 'Try adjusting your filters'
              : 'Get started by adding your first service'
            }
          </p>
        </div>
      )}

      {/* Create/Edit Service Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={handleCloseModal}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Service Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Hair Cut & Style"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Salon *
              </label>
              <select
                value={formData.salonId}
                onChange={(e) => setFormData({ ...formData, salonId: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">Select a salon</option>
                {salons.map(salon => (
                  <option key={salon.id} value={salon.id}>{salon.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Duration (minutes) *
              </label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Price (₹) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Service Icon
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  {iconPreview && (
                    <div className="w-12 h-12 border rounded-lg flex items-center justify-center bg-gray-50">
                      {iconPreview.startsWith('http') ? (
                        <img src={iconPreview} alt="Preview" className="w-8 h-8 rounded" />
                      ) : (
                        <span className="text-xl">{iconPreview}</span>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconFileChange}
                      className="hidden"
                      id="icon-upload"
                    />
                    <label
                      htmlFor="icon-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Icon
                    </label>
                  </div>
                </div>
                <div className="text-sm text-text-muted">
                  Or enter an emoji:
                </div>
                <Input
                  value={iconFile ? '' : formData.emoji}
                  onChange={(e) => {
                    setFormData({ ...formData, emoji: e.target.value });
                    setIconPreview(e.target.value);
                  }}
                  placeholder="e.g., ✂️"
                  disabled={!!iconFile}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the service..."
              rows={3}
              className="input w-full resize-none"
              required
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.popular}
                onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-text-primary">Mark as popular</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-text-primary">Active</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingService ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServicesPage;
