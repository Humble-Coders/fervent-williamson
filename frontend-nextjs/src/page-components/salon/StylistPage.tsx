'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Search, Mail, Phone, User, Upload } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import BulkImportModal from '../../components/ui/BulkImportModal';
import { stylistService, Stylist } from '../../services/stylistService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';

interface StylistMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
  specialties: string[];
  isActive: boolean;
  avatar?: string;
  experience?: number;
  rating?: number;
  reviewCount?: number;
  joinedAt?: string;
  createdAt?: string;
}

const StylistPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stylists, setStylists] = useState<StylistMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  useEffect(() => {
    loadStylists();
  }, []);

  const loadStylists = async () => {
    try {
      logger.info('🔄 Loading stylists...');
      logger.info('👤 Current user:', user);

      const stylistsData = await stylistService.getStylists();
      logger.info('📋 Stylists loaded:', stylistsData);

      // Transform API data to match component interface
      const transformedStylists: StylistMember[] = stylistsData.map((stylist: any) => ({
        id: stylist.id,
        name: stylist.name,
        email: stylist.email,
        phone: stylist.phone,
        role: stylist.role || 'Stylist',
        specialties: stylist.specialties || [],
        isActive: stylist.isActive,
        avatar: stylist.avatar,
        experience: stylist.experience,
        rating: stylist.rating,
        reviewCount: stylist.reviewCount,
        joinedAt: stylist.createdAt,
        createdAt: stylist.createdAt
      }));

      setStylists(transformedStylists);
    } catch (error) {
      logger.error('❌ Error loading stylists:', error);
      toast.error('Failed to load stylists');
      // Fallback to empty array
      setStylists([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStylists = stylists.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.role && member.role.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roles = ['all', ...Array.from(new Set(stylists.map(s => s.role).filter(Boolean)))];

  const handleAddStylist = () => {
    router.push('/salon/stylists/add');
  };

  const handleEditStylist = (stylistMember: StylistMember) => {
    router.push(`/salon/stylists/edit/${stylistMember.id}`);
  };

  const handleDeleteStylist = async (stylistId: string) => {
    if (window.confirm('Are you sure you want to remove this stylist?')) {
      try {
        await stylistService.deleteStylist(stylistId);
        toast.success('Stylist removed successfully');
        loadStylists(); // Reload the list
      } catch (error) {
        logger.error('❌ Error deleting stylist:', error);
        toast.error('Failed to remove stylist');
      }
    }
  };

  const handleToggleActive = async (stylistId: string) => {
    try {
      const stylist = stylists.find(s => s.id === stylistId);
      if (!stylist) return;

      await stylistService.toggleStylistStatus(stylistId, !stylist.isActive);
      toast.success(`Stylist ${!stylist.isActive ? 'activated' : 'deactivated'} successfully`);
      loadStylists(); // Reload the list
    } catch (error) {
      logger.error('❌ Error toggling stylist status:', error);
      toast.error('Failed to update stylist status');
    }
  };

  if (loading) {
    return <Loading text="Loading stylists..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stylist Management</h1>
          <p className="text-gray-600">Manage your salon team members</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowBulkImportModal(true)}
            icon={<Upload />}
          >
            Bulk Import
          </Button>
          <Button onClick={handleAddStylist} icon={<Plus />}>
            Add Stylist
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search stylists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              clearable
              onClear={() => setSearchTerm('')}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Stylist List */}
      {filteredStylists.length === 0 ? (
        <EmptyState
          icon={<User />}
          title="No stylists found"
          description="No stylists match your current filters. Try adjusting your search or filters."
          actionLabel="Add Stylist"
          onAction={handleAddStylist}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStylists.map((member) => (
            <Card key={member.id} padding="md" hover="lift">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.role || 'Stylist'}</p>
                    </div>
                  </div>
                  <Badge variant={member.isActive ? 'success' : 'warning'}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {member.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {member.phone}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Specialties:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditStylist(member)}
                    icon={<Edit />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={member.isActive ? 'warning' : 'success'}
                    onClick={() => handleToggleActive(member.id)}
                  >
                    {member.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteStylist(member.id)}
                    icon={<Trash2 />}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        importType="stylists"
        onImportComplete={() => {
          loadStylists(); // Reload stylists after import
          setShowBulkImportModal(false);
        }}
      />
    </div>
  );
};

export default StylistPage;
