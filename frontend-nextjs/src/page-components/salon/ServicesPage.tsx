'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Search, Filter, Upload, Grid, List, Eye, Package, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import BulkImportModal from '../../components/ui/BulkImportModal';

import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import { serviceService, Service, SubService } from '../../services/serviceService';
import { salonCategoryService, SalonServiceCategory } from '../../services/salonCategoryService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';



const ServicesPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<SalonServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingSubService, setEditingSubService] = useState<SubService | null>(null);
  const [showEditSubServiceModal, setShowEditSubServiceModal] = useState(false);

  // Load services and categories
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      logger.info('🔄 Loading services and categories...');
      logger.info('👤 Current user:', user);

      const [servicesData, categoriesData] = await Promise.all([
        serviceService.getAllServices(),
        salonCategoryService.getAvailableCategories()
      ]);

      logger.info('📋 Services loaded:', servicesData);
      logger.info('🏷️ Categories loaded:', categoriesData);

      setServices(servicesData);
      setCategories(categoriesData);
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...(categories || []).map(cat => ({ value: cat.id, label: cat.name }))
  ];

  const handleAddService = () => {
    router.push('/salon/services/add');
  };

  const handleEditService = (service: Service) => {
    router.push(`/salon/services/edit/${service.id}`);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await serviceService.deleteService(serviceId);
        setServices(services.filter(s => s.id !== serviceId));
        toast.success('Service deleted successfully');
      } catch (error) {
        logger.error('Error deleting service:', error);
        toast.error('Failed to delete service');
      }
    }
  };

  const handleToggleActive = async (serviceId: string) => {
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      const updatedService = await serviceService.updateService(serviceId, {
        isActive: !service.isActive
      });

      setServices(services.map(s =>
        s.id === serviceId ? updatedService : s
      ));
      toast.success(`Service ${updatedService.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      logger.error('Error toggling service status:', error);
      toast.error('Failed to update service status');
    }
  };

  const handleViewService = (service: Service) => {
    setSelectedService(service);
  };

  const handleToggleSubServiceActive = async (subServiceId: string, currentStatus: boolean) => {
    try {
      await serviceService.updateSubService(subServiceId, {
        isActive: !currentStatus
      });

      // Reload the service to get updated subservices
      if (selectedService) {
        const updatedService = await serviceService.getServiceById(selectedService.id);
        setSelectedService(updatedService);

        // Also update in the services list
        setServices(services.map(s =>
          s.id === selectedService.id ? updatedService : s
        ));
      }

      toast.success(`SubService ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      logger.error('Error toggling subservice status:', error);
      toast.error('Failed to update subservice status');
    }
  };

  const handleUpdateSubService = async (subServiceId: string, data: Partial<SubService>) => {
    try {
      await serviceService.updateSubService(subServiceId, data);

      // Reload the service to get updated subservices
      if (selectedService) {
        const updatedService = await serviceService.getServiceById(selectedService.id);
        setSelectedService(updatedService);

        // Also update in the services list
        setServices(services.map(s =>
          s.id === selectedService.id ? updatedService : s
        ));
      }

      setShowEditSubServiceModal(false);
      setEditingSubService(null);
      toast.success('SubService updated successfully');
    } catch (error) {
      logger.error('Error updating subservice:', error);
      toast.error('Failed to update subservice');
    }
  };

  if (loading) {
    return <Loading text="Loading services..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600">Manage your salon services and pricing</p>
        </div>
        <div className="flex gap-3">
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none border-0"
              icon={<Grid />}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-none border-0 border-l border-gray-300"
              icon={<List />}
            >
              Table
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowBulkImportModal(true)}
            icon={<Upload />}
          >
            Bulk Import
          </Button>
          <Button onClick={handleAddService} icon={<Plus />}>
            Add Service
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              clearable
              onClear={() => setSearchTerm('')}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <EmptyState
          icon={<Filter />}
          title="No services found"
          description="No services match your current filters. Try adjusting your search or filters."
          actionLabel="Add Service"
          onAction={handleAddService}
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} padding="md" hover="lift" className="cursor-pointer" onClick={() => handleViewService(service)}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.description}</p>
                  </div>
                  <Badge variant={service.isActive ? 'success' : 'warning'}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{service.duration} min</span>
                  <span className="font-semibold text-lg text-gray-900">₹{service.price}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" size="sm">
                    {service.category?.name || 'Uncategorized'}
                  </Badge>
                  {service.gender && (
                    <Badge variant="outline" size="sm">
                      {service.gender}
                    </Badge>
                  )}
                  {service.subServices && service.subServices.length > 0 && (
                    <Badge variant="primary" size="sm" className="bg-blue-100 text-blue-800">
                      <Package className="w-3 h-3 mr-1" />
                      {service.subServices.length} SubServices
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewService(service)}
                    icon={<Eye />}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditService(service)}
                    icon={<Edit />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={service.isActive ? 'warning' : 'success'}
                    onClick={() => handleToggleActive(service.id)}
                  >
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteService(service.id)}
                    icon={<Trash2 />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SubServices</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewService(service)}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{service.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" size="sm">
                        {service.category?.name || 'Uncategorized'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{service.duration} min</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{service.price}</td>
                    <td className="px-6 py-4">
                      {service.subServices && service.subServices.length > 0 ? (
                        <Badge variant="primary" size="sm" className="bg-blue-100 text-blue-800">
                          <Package className="w-3 h-3 mr-1" />
                          {service.subServices.length} SubServices
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={service.isActive ? 'success' : 'warning'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewService(service)}
                          icon={<Eye />}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditService(service)}
                          icon={<Edit />}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={service.isActive ? 'warning' : 'success'}
                          onClick={() => handleToggleActive(service.id)}
                        >
                          {service.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteService(service.id)}
                          icon={<Trash2 />}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        importType="services"
        onImportComplete={() => {
          loadData(); // Reload services after import
          setShowBulkImportModal(false);
        }}
      />

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedService.name}</h2>
                <p className="text-gray-600 mt-1">{selectedService.description}</p>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Service Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">₹{selectedService.price}</div>
                  <div className="text-sm text-gray-600">Base Price</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedService.duration}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedService.subServices?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">SubServices</div>
                </div>
              </div>

              {/* Service Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Category</h3>
                  <Badge variant="outline">
                    {selectedService.category?.name || 'Uncategorized'}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Gender</h3>
                  <Badge variant="outline">
                    {selectedService.gender || 'UNISEX'}
                  </Badge>
                </div>
              </div>

              {/* SubServices */}
              {selectedService.subServices && selectedService.subServices.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SubServices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedService.subServices.map((subService) => (
                      <Card key={subService.id} padding="md">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{subService.name}</h4>
                              {subService.description && (
                                <p className="text-sm text-gray-600 mt-1">{subService.description}</p>
                              )}
                            </div>
                            <Badge variant={subService.isActive ? 'success' : 'warning'} size="sm">
                              {subService.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{subService.duration} min</span>
                            <span className="font-semibold text-gray-900">₹{subService.price}</span>
                          </div>

                          <div className="text-xs text-gray-500">
                            ID: {subService.displayId}
                          </div>

                          {/* SubService Actions */}
                          <div className="flex gap-2 pt-2 border-t border-gray-200">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSubService(subService);
                                setShowEditSubServiceModal(true);
                              }}
                              icon={<Edit />}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant={subService.isActive ? 'warning' : 'success'}
                              onClick={() => handleToggleSubServiceActive(subService.id, subService.isActive)}
                            >
                              {subService.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setSelectedService(null);
                    handleEditService(selectedService);
                  }}
                  icon={<Edit />}
                >
                  Edit Service
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedService(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit SubService Modal */}
      {showEditSubServiceModal && editingSubService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit SubService</h2>
                <button
                  onClick={() => {
                    setShowEditSubServiceModal(false);
                    setEditingSubService(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Edit Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleUpdateSubService(editingSubService.id, {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    duration: parseInt(formData.get('duration') as string),
                    price: parseFloat(formData.get('price') as string),
                    isActive: formData.get('isActive') === 'true',
                  });
                }}
                className="space-y-6"
              >
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SubService Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingSubService.name}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingSubService.description || ''}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Duration and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      defaultValue={editingSubService.duration}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      defaultValue={editingSubService.price}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="isActive"
                    defaultValue={editingSubService.isActive ? 'true' : 'false'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditSubServiceModal(false);
                      setEditingSubService(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
