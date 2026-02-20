'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Star,
  Users,
  Scissors,
  Calendar,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import Button from '../../components/ui/Button';
// import Input from '../../components/ui/Input'; // Removed unused import
import { adminSalonService } from '../../services/adminSalonService';
import { Salon } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { extractErrorMessage } from '../../utils/errorHandler';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  isActive: boolean;
}

interface Stylist {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  experience: number;
  rating: number;
  isActive: boolean;
}

const SalonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'stylists' | 'schedule' | 'settings'>('overview');

  useEffect(() => {
    if (id) {
      fetchSalonDetails();
    }
  }, [id]);

  const fetchSalonDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const salonData = await adminSalonService.getSalonById(id!);
      setSalon(salonData);
      
      // Load actual services and stylists from the salon data
      if (salonData.services) {
        setServices(salonData.services.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: typeof service.price === 'string' ? parseFloat(service.price) : service.price,
          category: service.categoryId || 'Hair',
          isActive: service.isActive
        })));
      } else {
        setServices([]);
      }

      if (salonData.stylists) {
        setStylists(salonData.stylists.map(stylist => ({
          id: stylist.id,
          name: stylist.name,
          email: stylist.email,
          phone: stylist.phone || '',
          specialties: stylist.specialties || [],
          experience: stylist.experience || 0,
          rating: 4.5, // Default rating - could be calculated from reviews
          isActive: stylist.isActive
        })));
      } else {
        setStylists([]);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl w-fit mx-auto mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">Salon Not Found</h3>
          <p className="text-text-secondary mb-4">{error || 'The salon you\'re looking for doesn\'t exist.'}</p>
          <Button onClick={() => router.push('/admin/salons')} variant="primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Salons
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Building2 },
    { id: 'services', name: 'Services', icon: Scissors },
    { id: 'stylists', name: 'Staff', icon: Users },
    { id: 'schedule', name: 'Schedule', icon: Calendar },
    { id: 'settings', name: 'Settings', icon: Edit }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin/salons')}
            className="p-2 rounded-2xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{salon.name}</h1>
            <p className="text-text-secondary flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>{salon.address}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="font-semibold">{salon.rating}</span>
              <span className="text-sm text-text-secondary">({salon.reviewCount} reviews)</span>
            </div>
            <p className="text-sm text-text-secondary">
              {salon.isOpen ? 'Currently Open' : 'Currently Closed'}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${salon.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-neutral-200/50 shadow-lg">
        <div className="border-b border-neutral-200/50">
          <nav className="flex space-x-8 px-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-neutral-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-text-primary">Basic Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-purple-500" />
                      <span>{salon.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-purple-500" />
                      <span>{salon.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-purple-500" />
                      <span>Open 7 days a week</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-text-primary">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4">
                      <div className="flex items-center space-x-2">
                        <Scissors className="h-5 w-5 text-blue-500" />
                        <span className="font-bold text-text-primary">{services.length}</span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">Services</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-green-500" />
                        <span className="font-bold text-text-primary">{stylists.length}</span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">Staff</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Description</h3>
                <p className="text-text-secondary leading-relaxed">{salon.description}</p>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Services ({services.length})</h3>
                <Button variant="primary" className="rounded-2xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>

              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-text-primary">{service.name}</h4>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {service.category}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-text-secondary text-sm mb-3">{service.description}</p>
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-purple-500" />
                            <span>{service.duration} min</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>{service.price}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 rounded-xl bg-white hover:bg-purple-100 text-purple-600 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-xl bg-white hover:bg-red-100 text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'stylists' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Staff Members ({stylists.length})</h3>
                <Button variant="primary" className="rounded-2xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stylist
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stylists.map((stylist) => (
                  <div key={stylist.id} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary">{stylist.name}</h4>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-sm text-text-secondary">{stylist.rating}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        stylist.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {stylist.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span>{stylist.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-blue-500" />
                        <span>{stylist.phone}</span>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary mb-2">Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {stylist.specialties.map((specialty, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary">{stylist.experience} years experience</p>
                    </div>

                    <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-blue-200">
                      <button className="p-2 rounded-xl bg-white hover:bg-blue-100 text-blue-600 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-xl bg-white hover:bg-red-100 text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">Working Hours</h3>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                <p className="text-center text-text-secondary">Schedule management coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">Salon Settings</h3>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6">
                <p className="text-center text-text-secondary">Settings panel coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalonDetailPage;
