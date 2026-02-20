'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { Search, Filter, UserPlus, Mail, Phone, Calendar, Star, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { bookingService } from '../../services/bookingService';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit?: string;
  rating: number;
  status: 'active' | 'inactive';
  joinedDate: string;
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch customers from booking data
        const customersData = await bookingService.getSalonCustomers();
        setCustomers(customersData);
      } catch (error: any) {
        logger.error('Error fetching customers:', error);
        setError(error.message || 'Failed to load customer data');
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <UserPlus className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Customers</h3>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      {/* <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your salon customers</p>
            </div>
            <Button className="mt-3 sm:mt-0 text-sm sm:text-base">
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div> */}

      <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm h-10 rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm h-10 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline" className="text-sm h-10 px-3 rounded-xl lg:px-4">
              <Filter className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Filter</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1">Total Customers</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserPlus className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1">Active Customers</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {customers.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1">Total Bookings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {customers.reduce((sum, c) => sum + c.totalBookings, 0)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1">Avg Rating</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {customers.length > 0
                  ? (customers.reduce((sum, c) => sum + c.rating, 0) / customers.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Customers Table - Desktop */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={customer.avatar || `https://ui-avatars.com/api/?name=${customer.name}&background=6366f1&color=fff`}
                          alt={customer.name}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < Math.floor(customer.rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                  }`}
                              />
                            ))}
                            <span className="ml-1 text-xs text-gray-500">({(Number(customer.rating) || 0).toFixed(1)})</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.totalBookings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(customer.totalSpent) || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${customer.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customers Cards - Mobile */}
        <div className="lg:hidden space-y-3">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
              {/* Header with Avatar and Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <img
                    className="h-14 w-14 rounded-full ring-2 ring-primary-100 flex-shrink-0"
                    src={customer.avatar || `https://ui-avatars.com/api/?name=${customer.name}&background=6366f1&color=fff`}
                    alt={customer.name}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                    <div className="flex items-center mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < Math.floor(customer.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                            }`}
                        />
                      ))}
                      <span className="ml-1 text-xs text-gray-500">({(Number(customer.rating) || 0).toFixed(1)})</span>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${customer.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                  }`}>
                  {customer.status}
                </span>
              </div>

              {/* Contact Info - Full Width */}
              <div className="space-y-2 mb-3 text-xs">
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <p className="text-gray-600 truncate flex-1">{customer.email}</p>
                </div>
                {customer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-600">{customer.phone}</p>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Bookings</p>
                  <p className="text-sm font-semibold text-gray-900">{customer.totalBookings}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Total Spent</p>
                  <p className="text-sm font-semibold text-gray-900">₹{(Number(customer.totalSpent) || 0).toFixed(0)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Last Visit</p>
                  <p className="text-[10px] font-semibold text-gray-900">
                    {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Never'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs py-1.5">
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View
                </Button>
                <Button variant="ghost" size="sm" className="px-3 py-1.5">
                  <Mail className="w-4 h-4 text-primary-600" />
                </Button>
                <Button variant="ghost" size="sm" className="px-3 py-1.5">
                  <Phone className="w-4 h-4 text-primary-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <UserPlus className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 px-4">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Customers will appear here when they book appointments.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
