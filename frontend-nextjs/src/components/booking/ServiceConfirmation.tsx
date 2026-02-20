import React from 'react';
import { Clock, Star, MapPin, Phone, Plus, Minus } from 'lucide-react';
import Card from '../ui/Card';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category?: string;
  emoji?: string;
}

interface SubService {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
}

interface Stylist {
  id: string;
  name: string;
  avatar?: string;
}

interface SelectedServiceItem {
  service: Service;
  subService?: SubService | null;
  stylist?: Stylist | null;
  quantity?: number;
}

interface Salon {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  rating: number;
  reviewCount: number;
  image: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  emoji: string;
  icon?: string;
}

interface ServiceConfirmationProps {
  service?: Service; // Legacy single service (optional)
  services?: SelectedServiceItem[]; // New multi-service support
  salon: Salon;
  enabledPaymentMethods?: PaymentMethod[];
  onRemoveService?: (serviceId: string, subServiceId?: string) => void;
  onUpdateQuantity?: (serviceId: string, subServiceId: string | undefined, quantity: number) => void;
}

const ServiceConfirmation: React.FC<ServiceConfirmationProps> = ({
  service,
  services = [],
  salon,
  enabledPaymentMethods = [],
  onRemoveService,
  onUpdateQuantity,
}) => {
  // Default payment methods if none provided
  const defaultPaymentMethods: PaymentMethod[] = [
    { id: '1', name: 'Card', type: 'card', emoji: '💳' },
    { id: '2', name: 'Wallet', type: 'wallet', emoji: '📱' },
    { id: '3', name: 'Cash', type: 'cash', emoji: '💰' },
  ];

  // Use enabled payment methods if available, otherwise show defaults
  const paymentMethodsToShow = enabledPaymentMethods.length > 0
    ? enabledPaymentMethods
    : defaultPaymentMethods;

  // Determine which services to display
  const displayServices = services.length > 0 ? services : (service ? [{
    service,
    subService: null,
    stylist: null,
    quantity: 1
  }] : []);

  // Calculate totals
  const totalPrice = displayServices.reduce((sum, item) => {
    const price = item.subService ? item.subService.price : item.service.price;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);

  const totalDuration = displayServices.reduce((sum, item) => {
    const duration = item.subService ? item.subService.duration : item.service.duration;
    const quantity = item.quantity || 1;
    return sum + (duration * quantity);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Salon Info Card */}
      <Card padding="sm">
        <div className="flex gap-3">
          {/* Salon Image */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={salon.image}
              alt={salon.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Salon Details */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-1">
              {salon.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < Math.floor(salon.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs text-text-muted">
                {salon.rating} ({salon.reviewCount})
              </span>
            </div>

            {/* Address & Phone */}
            {salon.address && (
              <div className="flex items-start gap-1 text-[10px] sm:text-xs text-text-secondary mb-0.5">
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{salon.address}</span>
              </div>
            )}
            {salon.phone && (
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-text-secondary">
                <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                <span>{salon.phone}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Services Summary Card */}
      <Card padding="sm">
        <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-2">
          Selected Services ({displayServices.length})
        </h3>

        {/* Service List */}
        <div className="space-y-1.5 mb-3">
          {displayServices.map((item, index) => {
            const displayName = item.subService?.name || item.service.name;
            const displayPrice = item.subService ? item.subService.price : item.service.price;
            const displayDuration = item.subService ? item.subService.duration : item.service.duration;
            const quantity = item.quantity || 1;

            return (
              <div
                key={`${item.service.id}-${item.subService?.id || 'main'}-${index}`}
                className="flex items-center gap-2 p-2 bg-background-secondary rounded-lg"
              >
                <span className="text-xl sm:text-2xl flex-shrink-0">{item.service.emoji || '✨'}</span>

                <div className="flex-1 min-w-0">
                  {/* First Row: Service/SubService Name */}
                  <h4 className="font-medium text-text-primary text-xs sm:text-sm">
                    {displayName}
                  </h4>

                  {/* Second Row: Parent Service Name (if subservice) + Time + Price */}
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Show parent service name if subservice is selected */}
                    {item.subService && (
                      <span className="text-[9px] sm:text-[10px] text-text-muted uppercase">
                        {item.service.name}
                      </span>
                    )}

                    {/* Time and Price */}
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-text-secondary">
                      <div className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>{displayDuration} min</span>
                      </div>
                      <span>₹{displayPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Controls - Auto-delete when quantity reaches 0 */}
                {onUpdateQuantity && (
                  <div className="flex items-center gap-0 bg-white rounded-md overflow-hidden flex-shrink-0">
                    <button
                      onClick={() => {
                        const newQuantity = quantity - 1;
                        if (newQuantity === 0 && onRemoveService) {
                          // Auto-delete when quantity reaches 0
                          onRemoveService(item.service.id, item.subService?.id);
                        } else if (newQuantity > 0) {
                          onUpdateQuantity(item.service.id, item.subService?.id, newQuantity);
                        }
                      }}
                      className="px-2 py-1 hover:bg-gray-100 transition-colors flex items-center justify-center"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3 text-primary-600" />
                    </button>
                    <span className="text-xs font-semibold text-text-primary min-w-[24px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.service.id, item.subService?.id, quantity + 1)}
                      className="px-2 py-1 hover:bg-gray-100 transition-colors flex items-center justify-center"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3 text-primary-600" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="pt-2 border-t border-gray-200 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-2.5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs sm:text-sm text-text-secondary">Total Duration:</span>
            <span className="font-semibold text-text-primary text-xs sm:text-sm">{totalDuration} min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-text-secondary">Total Price:</span>
            <span className="font-bold text-primary-600 text-lg sm:text-xl">₹{totalPrice}</span>
          </div>

          {/* Payment Methods */}
          {paymentMethodsToShow.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-200">
              <span className="text-[10px] sm:text-xs text-text-muted">Accepts:</span>
              <div className="flex gap-1">
                {paymentMethodsToShow.map((method) => (
                  <div
                    key={method.id}
                    className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-md flex items-center justify-center shadow-soft text-[10px] sm:text-xs"
                    title={method.name}
                  >
                    {method.emoji}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ServiceConfirmation;