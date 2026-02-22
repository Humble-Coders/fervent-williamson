'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { Plus, Edit, Trash2, Search, Package, Tag, Sparkles } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { salonCategoryService, SalonServiceCategory, CreateSalonCategoryData } from '../../services/salonCategoryService';
// import { useAuthStore } from '../../store/authStore'; // Removed unused import
import { toast } from 'react-hot-toast';

const ServiceCategoriesPage: React.FC = () => {
  // const { user } = useAuthStore(); // Removed unused variable
  const [categories, setCategories] = useState<SalonServiceCategory[]>([]);
  const [salonCategories, setSalonCategories] = useState<SalonServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SalonServiceCategory | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const [allCategories, customCategories] = await Promise.all([
        salonCategoryService.getAvailableCategories(),
        salonCategoryService.getSalonCategories()
      ]);
      setCategories(allCategories || []);
      setSalonCategories(customCategories || []);
    } catch (error) {
      logger.error('Error loading categories:', error);
      toast.error('Failed to load categories');
      // Set empty arrays as fallback
      setCategories([]);
      setSalonCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData: CreateSalonCategoryData) => {
    try {
      await salonCategoryService.createCategory(categoryData);
      await loadCategories();
      setShowCreateModal(false);
      setEditingCategory(null);
      toast.success('Category created successfully');
    } catch (error) {
      logger.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleUpdateCategory = async (id: string, categoryData: Partial<CreateSalonCategoryData>) => {
    try {
      await salonCategoryService.updateCategory(id, categoryData);
      await loadCategories();
      setShowCreateModal(false);
      setEditingCategory(null);
      toast.success('Category updated successfully');
    } catch (error) {
      logger.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await salonCategoryService.deleteCategory(id);
        await loadCategories();
        toast.success('Category deleted successfully');
      } catch (error) {
        logger.error('Error deleting category:', error);
        toast.error('Failed to delete category');
      }
    }
  };

  const handleEditCategory = (category: SalonServiceCategory) => {
    setEditingCategory(category);
    setShowCreateModal(true);
  };

  const filteredSalonCategories = (salonCategories || []).filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const globalCategories = (categories || []).filter(cat => cat.isGlobal);

  if (!mounted || loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
          <p className="text-gray-600">Manage your service categories and organization</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingCategory(null);
              setShowCreateModal(true);
            }}
            icon={<Plus />}
          >
            Add Category
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}

          />
        </div>
      </div>

      {/* Global Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-medium text-gray-900">Global Categories</h3>
          <Badge variant="info">Available to all salons</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {globalCategories.map((category) => (
            <Card key={category.id} padding="md">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: category.color }}
                >
                  <span className="text-lg">{category.emoji}</span>
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{category.name}</h5>
                  {category.description && (
                    <p className="text-sm text-gray-500">{category.description}</p>
                  )}
                  <Badge variant="info" size="sm">Global</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-medium text-gray-900">Your Custom Categories</h3>
          <Badge variant="success">Salon-specific</Badge>
        </div>

        {filteredSalonCategories.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="No custom categories"
            description="Create custom service categories specific to your salon."
            actionLabel="Add Your First Category"
            onAction={() => {
              setEditingCategory(null);
              setShowCreateModal(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSalonCategories.map((category) => (
              <Card key={category.id} padding="md" hover="lift">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      <span className="text-lg">{category.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{category.name}</h5>
                      {category.description && (
                        <p className="text-sm text-gray-500">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="sm">Custom</Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Category Modal */}
      <CategoryModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSave={editingCategory ?
          (data) => handleUpdateCategory(editingCategory.id, data) :
          handleCreateCategory
        }
      />

    </div>
  );
};

// Category Modal Component
interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: SalonServiceCategory | null;
  onSave: (data: CreateSalonCategoryData) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, category, onSave }) => {
  const [formData, setFormData] = useState<CreateSalonCategoryData>({
    name: '',
    icon: 'package',
    emoji: '📦',
    color: '#6366f1',
    description: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon,
        emoji: category.emoji,
        color: category.color || '#6366f1',
        description: category.description || ''
      });
    } else {
      setFormData({
        name: '',
        icon: 'package',
        emoji: '📦',
        color: '#6366f1',
        description: ''
      });
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      await onSave(formData);
    } catch (error) {
      logger.error('Error saving category:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const colorOptions = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#10b981', '#06b6d4', '#3b82f6'
  ];

  const emojiOptions = [
    '📦', '✂️', '💅', '💆‍♀️', '💄', '🧴', '🌸', '💇‍♀️',
    '🧖‍♀️', '💎', '🌟', '🎨', '🌺', '🦋', '💫', '🌙'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Create Category'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Name
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter category name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter category description (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emoji
          </label>
          <div className="grid grid-cols-8 gap-2">
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormData({ ...formData, emoji })}
                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg hover:bg-gray-50 ${
                  formData.emoji === emoji ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
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
          <div className="grid grid-cols-5 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-10 h-10 rounded-lg border-2 ${
                  formData.color === color ? 'border-gray-800' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={!formData.name.trim()}
          >
            {category ? 'Update' : 'Create'} Category
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceCategoriesPage;
