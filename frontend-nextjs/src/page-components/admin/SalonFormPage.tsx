'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Users,
  Scissors,
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Image,
  Map,
  Clock,
  Mail,
  Phone
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { adminSalonService, CreateSalonData, Service as ServiceType } from '../../services/adminSalonService';
import { WorkingHours, BackendWorkingHours } from '../../types';
import { getAbsoluteImageUrl } from '../../utils/imageUtils';
import { extractErrorMessage } from '../../utils/errorHandler';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Use types from service
type Service = ServiceType;

// Form data type that uses frontend format (closed: boolean)
type FormSalonData = Omit<CreateSalonData, 'workingHours'> & {
  workingHours?: WorkingHours;
  mapsLink?: string;
  slotDuration?: number;
  breakDuration?: number;
  advanceBookingDays?: number;
  minimumNoticeHours?: number;
  yearsInBusiness?: number;
  rating?: number;
  certifications?: string[];
};

// Local interface for new service form (before creation)
interface NewServiceForm {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  isActive: boolean;
  images?: string[];
}

// Local interface for form stylist with services array
interface FormStylist {
  id?: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  specialties: string[];
  services: string[];
  experience: number;
  isActive: boolean;
}

const SalonFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isEdit = Boolean(id);
  
  const [activeTab, setActiveTab] = useState<'basic' | 'services' | 'stylist' | 'schedule' | 'settings'>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Basic salon data
  const [salonData, setSalonData] = useState<FormSalonData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    latitude: undefined,
    longitude: undefined,
    specialties: [],
    amenities: [],
    images: [],
    certifications: [],
    workingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true }
    },
    mapsLink: '',
    slotDuration: 30,
    breakDuration: 0,
    advanceBookingDays: 30,
    minimumNoticeHours: 2,
    yearsInBusiness: 1,
    teamSize: 1,
    rating: 4.5,
    featured: false,
    isOpen: true,
  });

  // Services and stylists
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<FormStylist[]>([]);

  // Form states
  const [newService, setNewService] = useState<NewServiceForm>({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    category: 'Hair',
    gender: 'UNISEX',
    isActive: true,
    images: []
  });

  const [newStylist, setNewStylist] = useState<FormStylist>({
    name: '',
    email: '',
    phone: '',
    avatar: undefined,
    specialties: [],
    services: [],
    experience: 0,
    isActive: true
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newAmenity, setNewAmenity] = useState('');
  // const [newImage, setNewImage] = useState(''); // Removed unused state

  // Edit states
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [editingService, setEditingService] = useState<NewServiceForm | null>(null);
  const [editingStylistIndex, setEditingStylistIndex] = useState<number | null>(null);
  const [editingStylist, setEditingStylist] = useState<FormStylist | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      fetchSalonData();
    }
  }, [id, isEdit]);

  // Debug effect to monitor newService.images changes
  useEffect(() => {
    logger.info('🔍 [FRONTEND] newService.images changed:', {
      serviceName: newService.name,
      imageCount: newService.images?.length || 0,
      images: newService.images || []
    });
  }, [newService.images]);

  // Debug effect to monitor newService state changes
  useEffect(() => {
    logger.info('🔍 [FRONTEND] newService state changed:', {
      name: newService.name,
      imageCount: newService.images?.length || 0,
      hasImages: Boolean(newService.images && newService.images.length > 0)
    });
  }, [newService]);

  // Create stable callback functions to avoid re-renders
  const updateServiceImages = React.useCallback((newImages: string[]) => {
    logger.info('🔄 [FRONTEND] updateServiceImages called with:', newImages);
    setNewService(prevService => {
      const updatedService = {
        ...prevService,
        images: [...(prevService.images || []), ...newImages]
      };
      logger.info('✅ [FRONTEND] Service images updated via callback:', {
        serviceName: updatedService.name,
        imageCount: updatedService.images.length
      });
      return updatedService;
    });
  }, []);

  const resetStylistForm = React.useCallback(() => {
    logger.info('🔄 [FRONTEND] resetStylistForm called');
    setNewStylist({
      name: '',
      email: '',
      phone: '',
      avatar: undefined,
      specialties: [],
      services: [],
      experience: 0,
      isActive: true
    });
  }, []);

  const fetchSalonData = async () => {
    try {
      setLoading(true);
      logger.info('🔄 [FRONTEND] Fetching salon data for ID:', id);
      const salon = await adminSalonService.getSalonById(id!);
      logger.info('✅ [FRONTEND] Salon data fetched successfully:', salon);
      setSalonData({
        name: salon.name,
        description: salon.description,
        address: salon.address,
        phone: salon.phone,
        email: salon.email,
        latitude: salon.latitude,
        longitude: salon.longitude,
        specialties: salon.specialties || [],
        amenities: salon.amenities || [],
        images: salon.images || [],
        workingHours: salon.workingHours || {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '09:00', close: '18:00', closed: false },
          sunday: { open: '09:00', close: '18:00', closed: true }
        },
        featured: salon.featured,
        isOpen: salon.isOpen,
        teamSize: salon.teamSize || 0,
        yearsInBusiness: salon.yearsInBusiness || 1,
        certifications: salon.certifications || [],
      });

      // Load existing services and stylists
      if (salon.services) {
        logger.info('🔄 [FRONTEND] Loading existing services from salon:', salon.services.map(s => ({
          name: s.name,
          imageCount: s.images?.length || 0,
          images: s.images
        })));

        setServices(salon.services.map(service => ({
          ...service,
          // Ensure all required fields are present and have correct types
          displayId: service.displayId || 0,
          salonId: service.salonId || salon.id,
          images: service.images || [],
          gender: service.gender || 'UNISEX', // Default to UNISEX for existing services
          price: typeof service.price === 'string' ? parseFloat(service.price) : service.price,
          createdAt: service.createdAt || new Date().toISOString(),
          updatedAt: service.updatedAt || new Date().toISOString()
        })));

        logger.info('✅ [FRONTEND] Services loaded into state');
      }

      if (salon.stylists) {
        setStylists(salon.stylists.map(stylist => ({
          id: stylist.id,
          name: stylist.name,
          email: stylist.email,
          phone: stylist.phone || '',
          avatar: stylist.avatar,
          specialties: stylist.specialties || [],
          services: [], // Initialize as empty array for form
          experience: stylist.experience || 0,
          isActive: stylist.isActive
        })));
      }
    } catch (err: any) {
      logger.error('❌ [FRONTEND] Error fetching salon data:', err);
      setError(err.message || 'Failed to fetch salon data');
    } finally {
      setLoading(false);
    }
  };

  const handleSalonDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Handle different input types and convert to appropriate data types
    let processedValue: any = value;

    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      // Convert numeric fields to numbers
      const numericFields = ['yearsInBusiness', 'rating', 'slotDuration', 'breakDuration', 'advanceBookingDays', 'minimumNoticeHours'];
      if (numericFields.includes(name)) {
        processedValue = value === '' ? undefined : parseFloat(value);
      }
    }

    setSalonData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !salonData.specialties?.includes(newSpecialty.trim())) {
      setSalonData(prev => ({
        ...prev,
        specialties: [...(prev.specialties || []), newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index: number) => {
    setSalonData(prev => ({
      ...prev,
      specialties: prev.specialties?.filter((_, i) => i !== index) || []
    }));
  };

  const addCertification = () => {
    if (newSpecialty.trim() && !salonData.certifications?.includes(newSpecialty.trim())) {
      setSalonData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeCertification = (index: number) => {
    setSalonData(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || []
    }));
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !salonData.amenities?.includes(newAmenity.trim())) {
      setSalonData(prev => ({
        ...prev,
        amenities: [...(prev.amenities || []), newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (index: number) => {
    setSalonData(prev => ({
      ...prev,
      amenities: prev.amenities?.filter((_, i) => i !== index) || []
    }));
  };

  // const addImage = () => {
  //   if (newImage.trim() && !salonData.images?.includes(newImage.trim())) {
  //     setSalonData(prev => ({
  //       ...prev,
  //       images: [...(prev.images || []), newImage.trim()]
  //     }));
  //     setNewImage('');
  //   }
  // };

  const removeImage = (index: number) => {
    setSalonData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const addService = () => {
    if (newService.name.trim()) {
      // Create service without ID - let backend generate UUID
      const serviceToAdd = {
        id: `temp-${Date.now()}`, // Temporary ID, backend will generate real UUID
        name: newService.name,
        description: newService.description,
        duration: newService.duration,
        price: newService.price,
        categoryId: 'default-category', // Will be handled by backend
        gender: newService.gender,
        isActive: newService.isActive,
        displayId: 0, // Temporary, backend will assign
        salonId: '', // Will be set by backend
        images: [...(newService.images || [])], // Create a copy to avoid reference issues
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      logger.info('Gender field debug:', { gender: newService.gender, serviceToAdd });

      logger.info('🔄 [FRONTEND] Adding service to salon form:', {
        serviceName: serviceToAdd.name,
        imageCount: serviceToAdd.images.length,
        images: serviceToAdd.images
      });

      setServices(prev => [...prev, serviceToAdd]);

      // Reset service form with a fresh object
      const resetServiceForm = {
        name: '',
        description: '',
        duration: 60,
        price: 0,
        category: 'Hair',
        gender: 'UNISEX' as const,
        isActive: true,
        images: []
      };

      logger.info('🔄 [FRONTEND] Resetting service form');
      setNewService(resetServiceForm);
    }
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const startEditingService = (index: number) => {
    const service = services[index];
    setEditingServiceIndex(index);
    setEditingService({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: typeof service.price === 'string' ? parseFloat(service.price) : service.price,
      category: service.categoryId || 'Hair',
      gender: service.gender || 'UNISEX',
      isActive: service.isActive,
      images: service.images || []
    });
  };

  const cancelEditingService = () => {
    setEditingServiceIndex(null);
    setEditingService(null);
  };

  const saveEditingService = () => {
    if (editingServiceIndex !== null && editingService) {
      setServices(prev => prev.map((service, index) =>
        index === editingServiceIndex
          ? {
              ...service,
              name: editingService.name,
              description: editingService.description,
              duration: editingService.duration,
              price: editingService.price,
              categoryId: editingService.category,
              gender: editingService.gender,
              isActive: editingService.isActive,
              images: editingService.images || []
            }
          : service
      ));
      cancelEditingService();
    }
  };

  const addStylistSpecialty = () => {
    if (newSpecialty.trim() && !newStylist.specialties.includes(newSpecialty.trim())) {
      setNewStylist(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeStylistSpecialty = (index: number) => {
    setNewStylist(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  const addStylistMember = React.useCallback(() => {
    if (newStylist.name.trim() && newStylist.email.trim()) {
      // Don't assign ID for new stylists - let backend generate UUID
      const stylistToAdd = { ...newStylist };
      delete stylistToAdd.id; // Remove any existing ID

      logger.info('🔄 [FRONTEND] Adding stylist to salon form:', {
        stylistName: stylistToAdd.name,
        avatar: stylistToAdd.avatar
      });

      setStylists(prev => [...prev, stylistToAdd]);
      resetStylistForm();

      logger.info('✅ [FRONTEND] Stylist added and form reset');
    }
  }, [newStylist, resetStylistForm]);

  const removeStylistMember = (index: number) => {
    setStylists(prev => prev.filter((_, i) => i !== index));
  };

  const startEditingStylist = (index: number) => {
    const stylist = stylists[index];
    setEditingStylistIndex(index);
    setEditingStylist({ ...stylist });
  };

  const cancelEditingStylist = () => {
    setEditingStylistIndex(null);
    setEditingStylist(null);
  };

  const saveEditingStylist = () => {
    if (editingStylistIndex !== null && editingStylist) {
      setStylists(prev => prev.map((stylist, index) =>
        index === editingStylistIndex ? editingStylist : stylist
      ));
      cancelEditingStylist();
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info('🔄 [FRONTEND] handleSave - Current services state:', services.map(s => ({
        name: s.name,
        imageCount: s.images?.length || 0,
        images: s.images
      })));

      // Transform working hours from frontend format (closed) to backend format (isOpen)
      // Frontend uses: { closed: boolean } where true = closed
      // Backend expects: { isOpen: boolean } where true = open
      const transformedWorkingHours: BackendWorkingHours = {};

      if (salonData.workingHours) {
        Object.entries(salonData.workingHours).forEach(([day, schedule]) => {
          transformedWorkingHours[day as keyof BackendWorkingHours] = {
            open: schedule.open,
            close: schedule.close,
            isOpen: !schedule.closed // Convert closed to isOpen
          };
        });
      }

      // Prepare complete salon data with proper formatting
      const completeData: CreateSalonData = {
        ...salonData,
        workingHours: transformedWorkingHours,
        services: services.map(service => {
          logger.info('🔄 [FRONTEND] Processing service for salon data:', {
            name: service.name,
            imageCount: service.images?.length || 0,
            images: service.images
          });
          return {
            name: service.name,
            description: service.description,
            duration: service.duration,
            price: typeof service.price === 'string' ? parseFloat(service.price) : service.price,
            category: 'Hair', // Default category - backend will handle proper categorization
            gender: service.gender || 'UNISEX',
            isActive: service.isActive,
            images: service.images || [],
            id: service.id // Include ID for existing services
          };
        }),
        stylists: stylists.map(stylist => {
          const stylistData: any = {
            name: stylist.name,
            email: stylist.email,
            phone: stylist.phone,
            specialties: stylist.specialties || [],
            experience: stylist.experience || 0,
            isActive: stylist.isActive,
            services: stylist.services || []
          };

          // Only include avatar if it's not undefined
          if (stylist.avatar !== undefined) {
            stylistData.avatar = stylist.avatar;
          }

          return stylistData;
        }),
      };

      logger.info('🔄 [FRONTEND] Final salon data being sent:', {
        ...completeData,
        services: completeData.services.map((s: any) => ({
          name: s.name,
          imageCount: s.images?.length || 0,
          images: s.images
        }))
      });

      let result;
      if (isEdit) {
        result = await adminSalonService.updateSalon(id!, completeData);
      } else {
        result = await adminSalonService.createSalon(completeData);
      }

      logger.info('Salon saved successfully:', result);

      // Note: Image organization for services and stylists is now handled automatically by the backend
      // during salon creation/update, so no additional frontend processing is needed.

      router.push('/admin/salons');
    } catch (err: any) {
      logger.error('Salon save error:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: Building2 },
    { id: 'services', name: 'Services', icon: Scissors },
    { id: 'stylist', name: 'Stylist', icon: Users },
    { id: 'schedule', name: 'Schedule', icon: Calendar },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  if (loading && isEdit) {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-text-primary">
              {isEdit ? 'Edit Salon' : 'Add New Salon'}
            </h1>
            <p className="text-text-secondary">
              {isEdit ? 'Update salon information and settings' : 'Create a new salon profile'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/salons')}
            className="rounded-2xl"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              logger.info('🔄 [FRONTEND] Save button clicked - Current services state:', services.map(s => ({
                name: s.name,
                imageCount: s.images?.length || 0,
                images: s.images
              })));
              handleSave();
            }}
            disabled={loading || !salonData.name.trim()}
            className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (isEdit ? 'Update Salon' : 'Create Salon')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-xl border border-red-200 rounded-2xl p-4">
          <div className="text-red-800 text-sm font-medium whitespace-pre-line">{error}</div>
        </div>
      )}

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
          {activeTab === 'basic' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">Basic Information</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Input
                    label="Salon Name"
                    name="name"
                    value={salonData.name}
                    onChange={handleSalonDataChange}
                    required
                    className="rounded-2xl"
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={salonData.email}
                    onChange={handleSalonDataChange}
                    required
                    className="rounded-2xl"
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    value={salonData.phone}
                    onChange={handleSalonDataChange}
                    required
                    className="rounded-2xl"
                  />
                  <Input
                    label="Address"
                    name="address"
                    value={salonData.address}
                    onChange={handleSalonDataChange}
                    required
                    className="rounded-2xl"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={salonData.description}
                    onChange={handleSalonDataChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                    placeholder="Describe your salon, services, and what makes it special..."
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">Location & Maps</h3>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Google Maps Shareable Link
                  </label>
                  <input
                    type="url"
                    name="mapsLink"
                    value={salonData.mapsLink || ''}
                    onChange={handleSalonDataChange}
                    placeholder="Paste Google Maps shareable link (e.g., https://maps.app.goo.gl/...)"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  />
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <Map className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">How to get Google Maps link:</p>
                      <ol className="text-sm text-blue-700 mt-1 list-decimal list-inside space-y-1">
                        <li>Open Google Maps and search for your salon</li>
                        <li>Click &quot;Share&quot; button</li>
                        <li>Copy the shareable link</li>
                        <li>Paste it in the field above</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">Salon Images</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Upload Images
                    </label>
                    <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-6 text-center hover:border-purple-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            try {
                              setLoading(true);
                              let uploadedUrls: string[];

                              if (isEdit && id) {
                                // For existing salon, upload directly to salon folder
                                uploadedUrls = await adminSalonService.uploadImages(files, {
                                  type: 'salon',
                                  salonId: id
                                });
                              } else {
                                // For new salon, upload to temp folder first
                                uploadedUrls = await adminSalonService.uploadTempImages(files);
                              }

                              logger.info('Uploaded image URLs:', uploadedUrls); // Debug log
                              setSalonData(prev => ({
                                ...prev,
                                images: [...(prev.images || []), ...uploadedUrls]
                              }));
                            } catch (error: any) {
                              logger.error('Image upload error:', error); // Debug log
                              setError(error.message || 'Failed to upload images');
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Image className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <p className="text-text-primary font-medium">Click to upload images</p>
                        <p className="text-sm text-text-secondary mt-1">
                          PNG, JPG, GIF up to 10MB each
                        </p>
                      </label>
                    </div>
                  </div>

                  {salonData.images && salonData.images.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {salonData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={getAbsoluteImageUrl(image)}
                            alt={`Salon image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-2xl border border-neutral-200"
                            onError={(_e) => {
                              logger.error('Image failed to load:', getAbsoluteImageUrl(image));
                              logger.error('Original image URL:', image);
                            }}
                            onLoad={() => {
                              logger.info('Image loaded successfully:', getAbsoluteImageUrl(image));
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 bg-yellow-50 rounded-2xl">
                    <div className="flex items-start space-x-3">
                      <Image className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Image Guidelines</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Upload high-quality images of your salon interior, exterior, and work samples.
                          Images should be clear, well-lit, and showcase your salon&apos;s best features.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">Specialties</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      placeholder="Add specialty (e.g., Hair Coloring, Bridal Makeup)"
                      className="flex-1 px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    />
                    <Button type="button" onClick={addSpecialty} variant="outline" className="rounded-2xl">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {salonData.specialties && salonData.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {salonData.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 text-sm rounded-full"
                        >
                          {specialty}
                          <button
                            type="button"
                            onClick={() => removeSpecialty(index)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">Amenities</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      placeholder="Add amenity (e.g., Free WiFi, Parking, Air Conditioning)"
                      className="flex-1 px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                    />
                    <Button type="button" onClick={addAmenity} variant="outline" className="rounded-2xl">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {salonData.amenities && salonData.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {salonData.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 text-sm rounded-full"
                        >
                          {amenity}
                          <button
                            type="button"
                            onClick={() => removeAmenity(index)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Years in Business
                    </label>
                    <input
                      type="number"
                      name="yearsInBusiness"
                      value={salonData.yearsInBusiness || ''}
                      onChange={handleSalonDataChange}
                      min="0"
                      max="100"
                      placeholder="e.g., 5"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Starting Rating (1-5)
                    </label>
                    <input
                      type="number"
                      name="rating"
                      value={salonData.rating || ''}
                      onChange={handleSalonDataChange}
                      min="1"
                      max="5"
                      step="0.1"
                      placeholder="e.g., 4.5"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">Certifications & Awards</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      placeholder="Add certification (e.g., Licensed Cosmetology, Organic Products Certified)"
                      className="flex-1 px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    />
                    <Button type="button" onClick={addCertification} variant="outline" className="rounded-2xl">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {salonData.certifications && salonData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {salonData.certifications.map((certification, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 text-sm rounded-full"
                        >
                          🏆 {certification}
                          <button
                            type="button"
                            onClick={() => removeCertification(index)}
                            className="text-yellow-600 hover:text-yellow-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Settings */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">Status Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={salonData.featured}
                        onChange={handleSalonDataChange}
                        className="w-5 h-5 rounded border-2 border-neutral-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-semibold text-text-primary">Featured Salon</span>
                        <p className="text-xs text-text-secondary mt-1">
                          Show this salon prominently in search results and homepage
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isOpen"
                        checked={salonData.isOpen}
                        onChange={handleSalonDataChange}
                        className="w-5 h-5 rounded border-2 border-neutral-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-semibold text-text-primary">Currently Open</span>
                        <p className="text-xs text-text-secondary mt-1">
                          Allow customers to book appointments at this salon
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">Add New Service</h3>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Service Name
                      </label>
                      <input
                        type="text"
                        value={newService.name}
                        onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Hair Cut & Style, Manicure, Facial Treatment"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Service Category
                      </label>
                      <select
                        value={newService.category}
                        onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Hair Services">💇‍♀️ Hair Services (Cut, Color, Style)</option>
                        <option value="Nail Services">💅 Nail Services (Manicure, Pedicure)</option>
                        <option value="Facial & Skincare">🧴 Facial & Skincare</option>
                        <option value="Massage & Spa">💆‍♀️ Massage & Spa</option>
                        <option value="Makeup & Beauty">💄 Makeup & Beauty</option>
                        <option value="Eyebrow & Lashes">👁️ Eyebrow & Lashes</option>
                        <option value="Hair Removal">🪒 Hair Removal (Waxing, Threading)</option>
                        <option value="Bridal Services">👰 Bridal Services</option>
                        <option value="Men's Grooming">🧔 Men&apos;s Grooming</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        value={newService.duration}
                        onChange={(e) => setNewService(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                        placeholder="e.g., 60"
                        min="15"
                        max="480"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Price (₹ Rupees)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary">₹</span>
                        <input
                          type="number"
                          value={newService.price}
                          onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          placeholder="500"
                          min="0"
                          className="w-full pl-8 pr-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Service Gender
                      </label>
                      <select
                        value={newService.gender}
                        onChange={(e) => setNewService(prev => ({ ...prev, gender: e.target.value as 'MALE' | 'FEMALE' | 'UNISEX' }))}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="UNISEX">🚻 Unisex (For Everyone)</option>
                        <option value="MALE">👨 Male Only</option>
                        <option value="FEMALE">👩 Female Only</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    value={newService.description}
                    onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Service description..."
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  />

                  {/* Service Image Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Service Images
                    </label>
                    <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-4 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          logger.info('🔄 [FRONTEND] Service image upload triggered with files:', files.map(f => ({ name: f.name, size: f.size })));
                          if (files.length > 0) {
                            try {
                              setLoading(true);
                              logger.info('🔄 [FRONTEND] Uploading service images to temp...');
                              const uploadedUrls = await adminSalonService.uploadTempImages(files);
                              logger.info('✅ [FRONTEND] Service images uploaded, URLs:', uploadedUrls);
                              updateServiceImages(uploadedUrls);
                            } catch (error: unknown) {
                              logger.error('❌ [FRONTEND] Service image upload failed:', error);
                              setError((error as Error).message || 'Failed to upload service images');
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                        className="hidden"
                        id="service-image-upload"
                      />
                      <label htmlFor="service-image-upload" className="cursor-pointer">
                        <Image className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                        <p className="text-sm text-text-primary font-medium">Upload service images</p>
                        <p className="text-xs text-text-secondary mt-1">PNG, JPG, GIF up to 10MB each</p>
                      </label>
                    </div>

                    {/* Display uploaded service images */}
                    {newService.images && newService.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                        {newService.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={getAbsoluteImageUrl(image)}
                              alt={`Service image ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-neutral-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setNewService(prev => ({
                                  ...prev,
                                  images: prev.images?.filter((_, i) => i !== index) || []
                                }));
                              }}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newService.isActive}
                        onChange={(e) => setNewService(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-text-secondary">Active Service</span>
                    </label>
                    <Button
                      type="button"
                      onClick={addService}
                      disabled={!newService.name.trim()}
                      className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  </div>
                </div>
              </div>

              {/* Edit Service Modal */}
              {editingServiceIndex !== null && editingService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-text-primary">Edit Service</h3>
                      <button
                        type="button"
                        onClick={cancelEditingService}
                        className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Service Name</label>
                        <input
                          type="text"
                          value={editingService.name}
                          onChange={(e) => setEditingService(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
                        <textarea
                          value={editingService.description}
                          onChange={(e) => setEditingService(prev => prev ? { ...prev, description: e.target.value } : null)}
                          rows={3}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-2">Duration (Minutes)</label>
                          <input
                            type="number"
                            value={editingService.duration}
                            onChange={(e) => setEditingService(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 0 } : null)}
                            min="15"
                            max="480"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-2">Price (₹)</label>
                          <input
                            type="number"
                            value={editingService.price}
                            onChange={(e) => setEditingService(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                            min="0"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Service Gender</label>
                        <select
                          value={editingService.gender}
                          onChange={(e) => setEditingService(prev => prev ? { ...prev, gender: e.target.value as 'MALE' | 'FEMALE' | 'UNISEX' } : null)}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="UNISEX">🚻 Unisex (For Everyone)</option>
                          <option value="MALE">👨 Male Only</option>
                          <option value="FEMALE">👩 Female Only</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editingService.isActive}
                            onChange={(e) => setEditingService(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                            className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-text-secondary">Active Service</span>
                        </label>
                      </div>

                      <div className="flex items-center space-x-3 pt-4">
                        <Button
                          type="button"
                          onClick={saveEditingService}
                          className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          onClick={cancelEditingService}
                          variant="outline"
                          className="rounded-2xl"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Services List */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">
                  Services ({services.length})
                </h3>
                {services.length === 0 ? (
                  <div className="text-center py-12 bg-neutral-50 rounded-2xl">
                    <Scissors className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-text-secondary">No services added yet</p>
                    <p className="text-sm text-text-secondary mt-1">Add your first service above</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service, index) => (
                      <div key={service.id || index} className="bg-white rounded-2xl p-6 border border-neutral-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-text-primary">{service.name}</h4>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {service.categoryId || 'Hair'}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {service.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-text-secondary text-sm mb-3">{service.description}</p>

                            {/* Service Images */}
                            {service.images && service.images.length > 0 && (
                              <div className="flex space-x-2 mb-3">
                                {service.images.slice(0, 3).map((image, imgIndex) => (
                                  <img
                                    key={imgIndex}
                                    src={getAbsoluteImageUrl(image)}
                                    alt={`${service.name} image ${imgIndex + 1}`}
                                    className="w-12 h-12 object-cover rounded-lg border border-neutral-200"
                                  />
                                ))}
                                {service.images.length > 3 && (
                                  <div className="w-12 h-12 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center justify-center">
                                    <span className="text-xs text-neutral-500">+{service.images.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center space-x-6 text-sm">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span>{service.duration} minutes</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-green-600 font-semibold">₹{service.price}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-600">
                                  {service.gender === 'MALE' ? '👨 Male' :
                                   service.gender === 'FEMALE' ? '👩 Female' :
                                   '🚻 Unisex'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => startEditingService(index)}
                              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeService(index)}
                              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stylist' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">Add New Stylist</h3>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <input
                      type="text"
                      value={newStylist.name}
                      onChange={(e) => setNewStylist(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Stylist name"
                      className="px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <input
                      type="email"
                      value={newStylist.email}
                      onChange={(e) => setNewStylist(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email address"
                      className="px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <input
                      type="tel"
                      value={newStylist.phone}
                      onChange={(e) => setNewStylist(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone number"
                      className="px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Stylist Avatar Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Stylist Avatar
                    </label>
                    <div className="flex items-center space-x-4">
                      {newStylist.avatar ? (
                        <div className="relative">
                          <img
                            src={getAbsoluteImageUrl(newStylist.avatar)}
                            alt="Stylist avatar"
                            className="w-20 h-20 object-cover rounded-full border-2 border-neutral-200"
                          />
                          <button
                            type="button"
                            onClick={() => setNewStylist(prev => ({ ...prev, avatar: undefined }))}
                            className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center border-2 border-dashed border-neutral-300">
                          <Users className="h-8 w-8 text-neutral-400" />
                        </div>
                      )}

                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                setLoading(true);
                                const uploadedUrls = await adminSalonService.uploadTempImages([file]);
                                setNewStylist(prev => ({
                                  ...prev,
                                  avatar: uploadedUrls[0]
                                }));
                              } catch (error: unknown) {
                                setError((error as Error).message || 'Failed to upload avatar');
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                          className="hidden"
                          id="stylist-avatar-upload"
                        />
                        <label htmlFor="stylist-avatar-upload" className="cursor-pointer">
                          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-3 text-center hover:border-green-400 transition-colors">
                            <Image className="h-6 w-6 text-neutral-400 mx-auto mb-1" />
                            <p className="text-sm text-text-primary font-medium">Upload Avatar</p>
                            <p className="text-xs text-text-secondary">PNG, JPG up to 5MB</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={newStylist.experience}
                      onChange={(e) => setNewStylist(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                      placeholder="Years of experience"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Services This Stylist Can Perform
                    </label>
                    <div className="space-y-3">
                      {services.length === 0 ? (
                        <div className="p-4 bg-yellow-50 rounded-2xl">
                          <p className="text-sm text-yellow-800">
                            Please add services first before assigning them to stylists.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                          {services.map((service, index) => (
                            <label key={service.id || index} className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-neutral-200 hover:bg-green-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newStylist.services.includes(service.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewStylist(prev => ({
                                      ...prev,
                                      services: [...prev.services, service.name]
                                    }));
                                  } else {
                                    setNewStylist(prev => ({
                                      ...prev,
                                      services: prev.services.filter(s => s !== service.name)
                                    }));
                                  }
                                }}
                                className="w-4 h-4 rounded border-neutral-300 text-green-600 focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-text-primary">{service.name}</span>
                                <p className="text-xs text-text-secondary">{service.categoryId || 'Hair'} • ₹{service.price}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Additional Specialties
                    </label>
                    <div className="flex gap-3 mb-3">
                      <input
                        type="text"
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        placeholder="Add specialty (e.g., Bridal Makeup, Advanced Color Techniques)"
                        className="flex-1 px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStylistSpecialty())}
                      />
                      <Button type="button" onClick={addStylistSpecialty} variant="outline" className="rounded-2xl">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {newStylist.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newStylist.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                          >
                            {specialty}
                            <button
                              type="button"
                              onClick={() => removeStylistSpecialty(index)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newStylist.isActive}
                        onChange={(e) => setNewStylist(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 rounded border-neutral-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-text-secondary">Active Stylist</span>
                    </label>
                    <Button
                      type="button"
                      onClick={addStylistMember}
                      disabled={!newStylist.name.trim() || !newStylist.email.trim()}
                      className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stylist
                    </Button>
                  </div>
                </div>
              </div>

              {/* Edit Stylist Modal */}
              {editingStylistIndex !== null && editingStylist && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-text-primary">Edit Stylist</h3>
                      <button
                        type="button"
                        onClick={cancelEditingStylist}
                        className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <input
                          type="text"
                          value={editingStylist.name}
                          onChange={(e) => setEditingStylist(prev => prev ? { ...prev, name: e.target.value } : null)}
                          placeholder="Stylist name"
                          className="px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <input
                          type="email"
                          value={editingStylist.email}
                          onChange={(e) => setEditingStylist(prev => prev ? { ...prev, email: e.target.value } : null)}
                          placeholder="Email address"
                          className="px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <input
                          type="tel"
                          value={editingStylist.phone}
                          onChange={(e) => setEditingStylist(prev => prev ? { ...prev, phone: e.target.value } : null)}
                          placeholder="Phone number"
                          className="px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Experience (Years)</label>
                        <input
                          type="number"
                          value={editingStylist.experience}
                          onChange={(e) => setEditingStylist(prev => prev ? { ...prev, experience: parseInt(e.target.value) || 0 } : null)}
                          placeholder="Years of experience"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editingStylist.isActive}
                            onChange={(e) => setEditingStylist(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                            className="w-4 h-4 rounded border-neutral-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-text-secondary">Active Stylist</span>
                        </label>
                      </div>

                      <div className="flex items-center space-x-3 pt-4">
                        <Button
                          type="button"
                          onClick={saveEditingStylist}
                          className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          onClick={cancelEditingStylist}
                          variant="outline"
                          className="rounded-2xl"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stylist List */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">
                  Stylists ({stylists.length})
                </h3>
                {stylists.length === 0 ? (
                  <div className="text-center py-12 bg-neutral-50 rounded-2xl">
                    <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-text-secondary">No stylists added yet</p>
                    <p className="text-sm text-text-secondary mt-1">Add your first stylist above</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {stylists.map((member, index) => (
                      <div key={member.id || index} className="bg-white rounded-2xl p-6 border border-neutral-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {member.avatar ? (
                              <img
                                src={getAbsoluteImageUrl(member.avatar)}
                                alt={`${member.name} avatar`}
                                className="w-12 h-12 object-cover rounded-full border-2 border-neutral-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-white" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-text-primary">{member.name}</h4>
                              <p className="text-sm text-text-secondary">{member.experience} years experience</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {member.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditingStylist(index)}
                              className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStylistMember(index)}
                              className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4 text-green-500" />
                            <span>{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Phone className="h-4 w-4 text-green-500" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.services.length > 0 && (
                            <div>
                              <p className="text-sm text-text-secondary mb-2">Can Perform:</p>
                              <div className="flex flex-wrap gap-1">
                                {member.services.map((service, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {service}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {member.specialties.length > 0 && (
                            <div>
                              <p className="text-sm text-text-secondary mb-2">Additional Specialties:</p>
                              <div className="flex flex-wrap gap-1">
                                {member.specialties.map((specialty, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    {specialty}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-6">Working Hours & Schedule</h3>

                {/* Working Hours */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 mb-8">
                  <h4 className="text-lg font-semibold text-text-primary mb-4">Daily Working Hours</h4>
                  <div className="space-y-4">
                    {[
                      { day: 'Monday', key: 'monday' },
                      { day: 'Tuesday', key: 'tuesday' },
                      { day: 'Wednesday', key: 'wednesday' },
                      { day: 'Thursday', key: 'thursday' },
                      { day: 'Friday', key: 'friday' },
                      { day: 'Saturday', key: 'saturday' },
                      { day: 'Sunday', key: 'sunday' }
                    ].map(({ day, key }) => {
                      const daySchedule = salonData.workingHours?.[key as keyof typeof salonData.workingHours] || { open: '09:00', close: '18:00', isOpen: true };

                      return (
                        <div key={key} className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-neutral-200">
                          <div className="w-24">
                            <span className="font-medium text-text-primary">{day}</span>
                          </div>

                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={!(daySchedule as any).closed}
                              onChange={(e) => {
                                setSalonData(prev => ({
                                  ...prev,
                                  workingHours: {
                                    ...prev.workingHours,
                                    [key]: {
                                      ...daySchedule,
                                      closed: !e.target.checked
                                    }
                                  }
                                }));
                              }}
                              className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-text-secondary">Open</span>
                          </label>

                          {!(daySchedule as any).closed && (
                            <>
                              <div className="flex items-center space-x-2">
                                <label className="text-sm text-text-secondary">From:</label>
                                <input
                                  type="time"
                                  value={daySchedule.open}
                                  onChange={(e) => {
                                    setSalonData(prev => ({
                                      ...prev,
                                      workingHours: {
                                        ...prev.workingHours,
                                        [key]: {
                                          ...daySchedule,
                                          open: e.target.value
                                        }
                                      }
                                    }));
                                  }}
                                  className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>

                              <div className="flex items-center space-x-2">
                                <label className="text-sm text-text-secondary">To:</label>
                                <input
                                  type="time"
                                  value={daySchedule.close}
                                  onChange={(e) => {
                                    setSalonData(prev => ({
                                      ...prev,
                                      workingHours: {
                                        ...prev.workingHours,
                                        [key]: {
                                          ...daySchedule,
                                          close: e.target.value
                                        }
                                      }
                                    }));
                                  }}
                                  className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </>
                          )}

                          {(daySchedule as any).closed && (
                            <span className="text-sm text-red-600 font-medium">Closed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slot Configuration */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-text-primary mb-4">Booking Time Slots</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Slot Duration (Minutes)
                      </label>
                      <select
                        value={salonData.slotDuration || 30}
                        onChange={(e) => setSalonData(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                      <p className="text-xs text-text-secondary mt-1">
                        How often customers can book appointments
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Break Between Appointments
                      </label>
                      <select
                        value={salonData.breakDuration || 0}
                        onChange={(e) => setSalonData(prev => ({ ...prev, breakDuration: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value={0}>No break</option>
                        <option value={5}>5 minutes</option>
                        <option value={10}>10 minutes</option>
                        <option value={15}>15 minutes</option>
                      </select>
                      <p className="text-xs text-text-secondary mt-1">
                        Buffer time between appointments
                      </p>
                    </div>
                  </div>
                </div>

                {/* Advance Booking */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-text-primary mb-4">Booking Policies</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Advance Booking (Days)
                      </label>
                      <input
                        type="number"
                        value={salonData.advanceBookingDays || 30}
                        onChange={(e) => setSalonData(prev => ({ ...prev, advanceBookingDays: parseInt(e.target.value) || 30 }))}
                        min="1"
                        max="365"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <p className="text-xs text-text-secondary mt-1">
                        How far in advance customers can book
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Minimum Notice (Hours)
                      </label>
                      <input
                        type="number"
                        value={salonData.minimumNoticeHours || 2}
                        onChange={(e) => setSalonData(prev => ({ ...prev, minimumNoticeHours: parseInt(e.target.value) || 2 }))}
                        min="0"
                        max="48"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <p className="text-xs text-text-secondary mt-1">
                        Minimum time before appointment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">Advanced Settings</h3>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
                <Settings className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-text-primary mb-2">Advanced Configuration</h4>
                <p className="text-text-secondary">
                  Configure booking policies, payment settings, and notification preferences. This feature will be available soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalonFormPage;
