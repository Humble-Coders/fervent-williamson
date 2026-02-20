'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import Link from 'next/link'; // import { Link } from 'next/navigation';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Star,
  Eye,
  Filter,
  Sparkles,
  TrendingUp,
  Building2,
  Crown
} from 'lucide-react';
import Button from '../../components/ui/Button';
// import Input from '../../components/ui/Input'; // Removed unused import
import { adminSalonService } from '../../services/adminSalonService';
import { SalonWithRelations } from '../../types';
// import LoadingSpinner from '../../components/ui/LoadingSpinner'; // Removed unused import

const SalonsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salons, setSalons] = useState<SalonWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch salons from API
  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminSalonService.getAllSalons();
      logger.info('Fetched salons:', data);
      setSalons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch salons');
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteSalon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this salon?')) return;

    try {
      await adminSalonService.deleteSalon(id);
      fetchSalons(); // Refresh the list
    } catch (err: any) {
      alert(err.message || 'Failed to delete salon');
    }
  };

  const filteredSalons = salons.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         salon.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && salon.isOpen) ||
                         (statusFilter === 'inactive' && !salon.isOpen) ||
                         (statusFilter === 'featured' && salon.featured);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-neutral-200/50 shadow-lg animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-48"></div>
              <div className="h-4 bg-neutral-200 rounded-lg w-64"></div>
            </div>
          </div>
        </div>

        {/* Loading Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-neutral-200/50 shadow-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-20"></div>
                  <div className="h-8 bg-neutral-300 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-neutral-200 to-neutral-300 rounded-2xl"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Content */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-neutral-200/50 shadow-lg">
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto animate-spin">
                  <div className="absolute inset-2 bg-white rounded-xl"></div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-text-primary">Loading Salons</h3>
                <p className="text-text-secondary">Please wait while we fetch the latest data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-red-200/50 shadow-lg max-w-md mx-auto text-center">
          <div className="p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl w-fit mx-auto mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">Error Loading Salons</h3>
          <p className="text-text-secondary mb-6">{error}</p>
          <Button
            onClick={fetchSalons}
            variant="primary"
            className="rounded-2xl bg-gradient-to-r from-red-500 to-pink-500"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-neutral-200/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Salon Management
                  </h1>
                  <p className="text-text-secondary flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-pink-500" />
                    <span>Manage registered salons and their status</span>
                  </p>
                </div>
              </div>
            </div>
            <Link href="/admin/salons/new">
              <Button
                variant="primary"
                className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Salon
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            name: 'Total Salons',
            value: salons.length,
            icon: Building2,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50'
          },
          {
            name: 'Active Salons',
            value: salons.filter(s => s.isOpen).length,
            icon: Eye,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50'
          },
          {
            name: 'Featured',
            value: salons.filter(s => s.featured).length,
            icon: Crown,
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'bg-yellow-50'
          },
          {
            name: 'Avg Rating',
            value: salons.length > 0 ? (salons.reduce((acc, s) => acc + s.rating, 0) / salons.length).toFixed(1) : '0.0',
            icon: Star,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="group bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-neutral-200/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:transform hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-text-secondary">{stat.name}</p>
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                </div>
                <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">+5.2% this month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-neutral-200/50 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
            <div className="relative flex-1 max-w-md">
              <div className="hidden md:flex absolute inset-y-0 left-0 pl-4 items-center pointer-events-none">
                <Search className="h-5 w-5 text-text-secondary" />
              </div>
              <input
                type="text"
                placeholder="Search salons by name, address, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 md:pl-12 pr-4 py-3 bg-white/60 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 placeholder-text-secondary"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-text-secondary" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-12 pr-8 py-3 bg-white/60 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active Salons</option>
                <option value="inactive">Inactive Salons</option>
                <option value="featured">Featured Salons</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-text-secondary">
              {filteredSalons.length} of {salons.length} salons
            </div>
          </div>
        </div>
      </div>

      {/* Salons Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-neutral-200/50 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-neutral-200/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Salon
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Services
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/50">
              {filteredSalons.map((salon, index) => (
                <tr
                  key={salon.id}
                  className="hover:bg-purple-50/50 transition-colors duration-200 animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/salons/${salon.id}`}
                            className="text-sm font-semibold text-text-primary truncate hover:text-purple-600 transition-colors"
                          >
                            {salon.name}
                          </Link>
                          {salon.featured && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-text-secondary truncate flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{salon.address}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-text-primary">
                        {salon.owner?.name || 'Unassigned'}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {salon.owner?.email || 'No email'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                        salon.isOpen
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {salon.isOpen ? 'Active' : 'Inactive'}
                      </span>
                      {salon.featured && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 w-fit">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-text-primary">{salon.rating}</span>
                      <span className="text-xs text-text-secondary">({salon.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-text-primary">
                      0 bookings
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-text-secondary">
                      {new Date(salon.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/admin/salons/${salon.id}`}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-300"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/salons/${salon.id}/edit`}
                        className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 transition-all duration-300"
                        title="Edit Salon"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteSalon(salon.id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-300"
                        title="Delete Salon"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredSalons.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-neutral-200/50 shadow-lg max-w-md mx-auto">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl w-fit mx-auto mb-6">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No salons found</h3>
            <p className="text-text-secondary mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first salon to the platform.'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Link href="/admin/salons/new">
                <Button
                  variant="primary"
                  className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Salon
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonsPage;
