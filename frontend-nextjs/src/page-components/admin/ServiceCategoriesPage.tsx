'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  X,
  Globe
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { categoryService, ServiceCategory, ServiceCategoryWithSalon } from '../../services/categoryService';

type CreateCategoryData = Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>;

const ServiceCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategoryWithSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'global' | 'salon'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [salonFilter, setSalonFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [visibleCategoryIds, setVisibleCategoryIds] = useState<string[]>([]);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    icon: 'package',
    emoji: '📦',
    color: '#6366f1',
    description: '',
  });

  useEffect(() => {
    loadCategories();
  }, [searchTerm, typeFilter]);

  // Load dashboard visibility when categories change
  useEffect(() => {
    if (categories.length > 0) {
      loadDashboardVisibility();
    }
  }, [categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const searchQuery = searchTerm.trim() || undefined;
      const filterType = typeFilter === 'all' ? undefined : typeFilter;
      const data = await categoryService.getAllCategoriesForAdmin(searchQuery, filterType);
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardVisibility = async () => {
    try {
      // Dashboard visibility is now part of the category data itself
      // No separate API call needed - it's loaded with categories
      const visibleIds = categories
        .filter(cat => cat.isDashboardVisible !== false)
        .map(cat => cat.id);
      setVisibleCategoryIds(visibleIds);
    } catch (err) {
      logger.error('Error loading dashboard visibility:', err);
    }
  };

  const updateDashboardVisibility = async (categoryIds: string[]) => {
    try {
      setIsUpdatingVisibility(true);

      // Create updates array for bulk update
      const updates = categories.map(category => ({
        id: category.id,
        isDashboardVisible: categoryIds.includes(category.id),
        dashboardSortOrder: categoryIds.indexOf(category.id)
      }));

      await categoryService.updateBulkVisibility(updates);
      setVisibleCategoryIds(categoryIds);

      // Reload categories to get updated data
      await loadCategories();
    } catch (err: any) {
      logger.error('Error updating dashboard visibility:', err);
      setError(err.message || 'Failed to update dashboard visibility');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const toggleCategoryVisibility = async (categoryId: string) => {
    const newVisibleIds = visibleCategoryIds.includes(categoryId)
      ? visibleCategoryIds.filter(id => id !== categoryId)
      : [...visibleCategoryIds, categoryId];

    await updateDashboardVisibility(newVisibleIds);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await categoryService.createCategory(formData);
      await loadCategories();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      emoji: category.emoji,
      color: category.color,
      description: category.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      setSubmitting(true);
      await categoryService.updateCategory(editingCategory.id, formData);
      await loadCategories();
      setShowEditModal(false);
      setEditingCategory(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await categoryService.deleteCategory(id);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: 'package',
      emoji: '📦',
      color: '#6366f1',
      description: '',
    });
  };

  // Get unique salons for salon filter
  const uniqueSalons = Array.from(
    new Map(
      categories
        .filter(cat => !cat.isGlobal && cat.salon)
        .map(cat => [cat.salon!.id, cat.salon!])
    ).values()
  );

  const filteredCategories = categories.filter(category => {
    // Search filter
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Type filter (global/salon)
    if (typeFilter === 'global' && !category.isGlobal) return false;
    if (typeFilter === 'salon' && category.isGlobal) return false;

    // Visibility filter
    const isVisible = category.isDashboardVisible !== false;
    if (visibilityFilter === 'visible' && !isVisible) return false;
    if (visibilityFilter === 'hidden' && isVisible) return false;

    // Salon filter
    if (salonFilter !== 'all' && category.salon?.id !== salonFilter) return false;

    return true;
  });

  const colorOptions = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#10b981', '#06b6d4', '#3b82f6'
  ];

  const emojiOptions = [
    '✂️', '💇‍♀️', '💅', '💄', '🧴', '🧖‍♀️', '💆‍♀️', '🌸', '💎', '✨',
    '🎨', '🌺', '🦋', '💫', '🌟', '🎭', '🎪', '🎨', '📦', '🏷️'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
          <p className="text-gray-600">Manage global and salon-specific service categories</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-600 font-medium">Global Categories</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">Salon Categories</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus />}
          >
            Add Global Category
          </Button>
        </div>
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

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'global' | 'salon')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="global">Global Only</option>
              <option value="salon">Salon Only</option>
            </select>

            {/* Visibility Filter */}
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as 'all' | 'visible' | 'hidden')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="all">All Visibility</option>
              <option value="visible">Dashboard Visible</option>
              <option value="hidden">Dashboard Hidden</option>
            </select>

            {/* Salon Filter */}
            {uniqueSalons.length > 0 && (
              <select
                value={salonFilter}
                onChange={(e) => setSalonFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="all">All Salons</option>
                {uniqueSalons.map(salon => (
                  <option key={salon.id} value={salon.id}>
                    {salon.name}
                  </option>
                ))}
              </select>
            )}

            {/* Clear Filters Button */}
            {(searchTerm || typeFilter !== 'all' || visibilityFilter !== 'all' || salonFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setVisibilityFilter('all');
                  setSalonFilter('all');
                }}
                className="ml-auto"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredCategories.length}</span> of <span className="font-medium">{categories.length}</span> categories
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{categories.filter(c => c.isGlobal).length}</span> global
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{categories.filter(c => !c.isGlobal).length}</span> salon-specific
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{visibleCategoryIds.length}</span> visible on dashboard
          </div>
        </div>
      </Card>

      {/* Categories Grid with Dashboard Visibility */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Service Categories</h2>
            <p className="text-sm text-gray-600">Manage categories and their dashboard visibility</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {visibleCategoryIds.length === 0 ? 'All visible on dashboard' : `${visibleCategoryIds.length} visible on dashboard`}
            </span>
            {isUpdatingVisibility && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const isVisible = category.isDashboardVisible !== false;
            return (
              <Card key={category.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Left side - Category Info */}
                  <div className="flex items-start space-x-3 flex-1">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    >
                      <span className="text-xl">{category.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{category.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {category.isGlobal ? (
                          <>
                            <Globe className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-blue-600 font-medium">Global</span>
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-600 font-medium truncate">
                              {category.salon?.name || 'Salon'}
                            </span>
                          </>
                        )}
                        <span className="text-xs text-gray-500">
                          • {category._count.services} {category._count.services === 1 ? 'service' : 'services'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Actions and Dashboard Visibility Checkbox */}
                  <div className="flex flex-col items-end gap-3">
                    {/* Edit/Delete Actions */}
                    {category.isGlobal && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit category"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Dashboard Visibility Checkbox */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => toggleCategoryVisibility(category.id)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          isVisible
                            ? 'border-green-500 bg-green-500 hover:bg-green-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        title={isVisible ? 'Visible on dashboard' : 'Hidden from dashboard'}
                      >
                        {isVisible && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <span className="text-xs text-gray-500 whitespace-nowrap">Dashboard</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {filteredCategories.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600">
            {searchTerm || typeFilter !== 'all' || visibilityFilter !== 'all' || salonFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first category'}
          </p>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Add New Category"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter category name"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter category description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emoji
            </label>
            <div className="grid grid-cols-10 gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, emoji })}
                  className={`p-2 text-lg border rounded-lg hover:bg-gray-50 ${
                    formData.emoji === emoji ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-10 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg border-2 ${
                    formData.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCategory(null);
          resetForm();
        }}
        title="Edit Category"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter category name"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter category description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emoji
            </label>
            <div className="grid grid-cols-10 gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, emoji })}
                  className={`p-2 text-lg border rounded-lg hover:bg-gray-50 ${
                    formData.emoji === emoji ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-10 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg border-2 ${
                    formData.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditModal(false);
                setEditingCategory(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Update Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Import Modal */}
    </div>
  );
};

export default ServiceCategoriesPage;
