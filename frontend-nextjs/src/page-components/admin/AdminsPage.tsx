'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { 
  Users, 
  Plus, 
  Search,
  Edit,
  Trash2, 
  Shield, 
  Mail, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { adminService } from '../../services/adminService';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

const AdminsPage: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [_showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, [searchTerm, statusFilter]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all users with ADMIN role
      const response = await adminService.getUsers({
        page: 1,
        limit: 100,
        search: searchTerm,
        role: 'ADMIN',
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      
      setAdmins(response.users as AdminUser[]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin users');
      logger.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (adminId: string, currentStatus: boolean) => {
    try {
      await adminService.updateUser(adminId, { isActive: !currentStatus });
      await fetchAdmins(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to update admin status');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    try {
      await adminService.deleteUser(adminId);
      await fetchAdmins(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to delete admin');
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && admin.isActive) ||
                         (statusFilter === 'inactive' && !admin.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600">Manage administrator accounts and permissions</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search admins by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admin List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary-600" />
            Administrator Accounts ({filteredAdmins.length})
          </h2>
        </div>

        {filteredAdmins.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No admins found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first admin user.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAdmins.map((admin) => (
              <div key={admin.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      {admin.avatar ? (
                        <img
                          src={admin.avatar}
                          alt={admin.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-primary-600 font-semibold text-lg">
                          {admin.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{admin.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {admin.email}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Joined {new Date(admin.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Status Badge */}
                    <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      admin.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.isActive ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusToggle(admin.id, admin.isActive)}
                      >
                        {admin.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* TODO: Open edit modal */}}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminsPage;
