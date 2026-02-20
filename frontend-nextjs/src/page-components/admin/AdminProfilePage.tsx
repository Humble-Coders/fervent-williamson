'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { 
  User, 
  Mail, 
  Phone,
  Shield,
  Edit, 
  Save, 
  X, 
  Camera,
  AlertCircle,
  CheckCircle,
  Key,
  Lock
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { authService } from '../../services/authService';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

const AdminProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await authService.getProfile();
      setProfile(profileData);
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
      logger.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await authService.updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      await fetchProfile(); // Refresh profile data
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccess('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    });
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-600">Unable to load your profile information.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
          <p className="text-gray-600">Manage your account information and settings</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowPasswordModal(true)}
          >
            <Key className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary-600 font-bold text-3xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <p className="text-primary-100 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Administrator
              </p>
              <p className="text-primary-100 text-sm mt-1">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              
              <div>
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />
              </div>

              <div>
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />
              </div>

              <div>
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  leftIcon={<Phone className="w-4 h-4" />}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Account Status</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Role</span>
                  <span className="text-sm text-gray-900 font-medium">{profile.role}</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">
                    {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                leftIcon={<Lock className="w-4 h-4" />}
                helperText="Must be at least 8 characters long"
                required
              />

              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={saving}
              >
                {saving ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Change Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfilePage;
