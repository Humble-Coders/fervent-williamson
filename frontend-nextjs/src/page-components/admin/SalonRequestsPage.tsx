'use client';
import React, { useState, useEffect } from 'react';
import { Building2, Search, Eye, Check, X, Mail, Phone, MapPin, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import { adminSalonService } from '../../services/adminSalonService';

interface SalonRequest {
  id: string;
  salonName: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const SalonRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<SalonRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [_selectedRequest, setSelectedRequest] = useState<SalonRequest | null>(null);
  const [_showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, statusFilter, searchTerm]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all salons from Firestore and treat them as "requests"
      const allSalons = await adminSalonService.getAllSalons();

      // Map salon data to SalonRequest interface
      let salonRequests: SalonRequest[] = allSalons.map((salon: any) => ({
        id: salon.id,
        salonName: salon.name || '',
        ownerName: salon.ownerName || '',
        email: salon.email || '',
        phone: salon.phone || '',
        address: salon.address || '',
        description: salon.description || '',
        status: salon.isOpen === true ? 'APPROVED' : salon.isOpen === false ? 'PENDING' : 'PENDING',
        adminNotes: salon.adminNotes || '',
        reviewedAt: salon.reviewedAt || '',
        reviewedBy: salon.reviewedBy || '',
        createdAt: salon.createdAt || '',
        updatedAt: salon.updatedAt || '',
      }));

      // Apply status filter
      if (statusFilter !== 'all') {
        salonRequests = salonRequests.filter(r => r.status === statusFilter);
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        salonRequests = salonRequests.filter(r =>
          r.salonName.toLowerCase().includes(searchLower) ||
          r.ownerName.toLowerCase().includes(searchLower) ||
          r.email.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const total = salonRequests.length;
      const pages = Math.ceil(total / pagination.limit);
      const start = (pagination.page - 1) * pagination.limit;
      const paginatedRequests = salonRequests.slice(start, start + pagination.limit);

      setRequests(paginatedRequests);
      setPagination(prev => ({ ...prev, total, pages }));
    } catch (err) {
      setError('Failed to fetch salon requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string) => {
    try {
      setActionLoading(requestId);
      setMessage(null);

      if (status === 'APPROVED') {
        await adminSalonService.approveSalon(requestId);
      } else {
        await adminSalonService.suspendSalon(requestId, adminNotes);
      }

      setMessage({ type: 'success', text: `Salon request ${status.toLowerCase()} successfully` });
      fetchRequests(); // Refresh the list
      setShowModal(false);
      setSelectedRequest(null);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update salon request. Please try again.' });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="success" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="error" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salon requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary-600" />
            Salon Requests
          </h1>
          <p className="text-gray-600 mt-1">Manage salon registration requests</p>
        </div>
      </div>

      {message && (
        <Alert
          type={message.type}
          message={message.text}
          onDismiss={() => setMessage(null)}
          dismissible={true}
        />
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="hidden md:block absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3 md:pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </Card>

      {/* Requests List */}
      <Card className="overflow-hidden">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchRequests} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No salon requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salon Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.salonName}</div>
                        {request.address && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {request.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{request.ownerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {request.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {request.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {request.status === 'PENDING' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, 'APPROVED')}
                            disabled={actionLoading === request.id}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, 'REJECTED')}
                            disabled={actionLoading === request.id}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonRequestsPage;
