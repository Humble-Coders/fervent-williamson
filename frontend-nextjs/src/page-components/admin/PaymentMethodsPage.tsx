'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CreditCard, Wallet, IndianRupee, Building2, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { buildApiUrl } from '../../config/env';

interface PaymentMethodConfig {
  id: string;
  name: string;
  type: string;
  icon: string;
  emoji: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface PaymentMethodFormData {
  name: string;
  type: string;
  icon: string;
  emoji: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

const PaymentMethodsPage: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    name: '',
    type: '',
    icon: 'CreditCard',
    emoji: '💳',
    description: '',
    isActive: true,
    sortOrder: 0,
  });

  const iconOptions = [
    { value: 'CreditCard', label: 'Credit Card', icon: CreditCard },
    { value: 'Wallet', label: 'Wallet', icon: Wallet },
    { value: 'IndianRupee', label: 'IndianRupee Sign', icon: IndianRupee },
    { value: 'Building2', label: 'Building', icon: Building2 },
  ];

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('payment-methods/config?includeInactive=true'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingMethod 
        ? buildApiUrl(`payment-methods/config/${editingMethod.id}`)
        : buildApiUrl('payment-methods/config');
      
      const method = editingMethod ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save payment method');
      }

      await fetchPaymentMethods();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment method');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`payment-methods/config/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }

      await fetchPaymentMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment method');
    }
  };

  const handleEdit = (method: PaymentMethodConfig) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      icon: method.icon,
      emoji: method.emoji,
      description: method.description,
      isActive: method.isActive,
      sortOrder: method.sortOrder,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMethod(null);
    setFormData({
      name: '',
      type: '',
      icon: 'CreditCard',
      emoji: '💳',
      description: '',
      isActive: true,
      sortOrder: 0,
    });
  };

  const toggleActive = async (method: PaymentMethodConfig) => {
    try {
      const response = await fetch(buildApiUrl(`payment-methods/config/${method.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ isActive: !method.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment method');
      }

      await fetchPaymentMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment method');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Payment Methods</h1>
          <p className="text-text-secondary mt-1">Manage available payment methods for bookings</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentMethods.map((method) => {
          const IconComponent = iconOptions.find(opt => opt.value === method.icon)?.icon || CreditCard;
          
          return (
            <Card key={method.id} className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{method.emoji}</span>
                    <IconComponent className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{method.name}</h3>
                    <p className="text-sm text-text-muted">{method.type}</p>
                  </div>
                </div>
                <Badge variant={method.isActive ? 'success' : 'default'}>
                  {method.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-sm text-text-secondary mb-4">{method.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Order: {method.sortOrder}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(method)}
                    className="flex items-center gap-1"
                  >
                    {method.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {method.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(method)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(method.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {iconOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Emoji"
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              required
            />
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-text-primary">
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingMethod ? 'Update' : 'Create'} Payment Method
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentMethodsPage;
