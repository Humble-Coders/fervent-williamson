import React from 'react';
import { Trash2, Clock, User, Plus, Minus } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  emoji: string;
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

interface ServiceCartProps {
  services: SelectedServiceItem[];
  onRemoveService: (serviceId: string, subServiceId?: string) => void;
  onUpdateQuantity?: (serviceId: string, subServiceId: string | undefined, quantity: number) => void;
  onAddMore?: () => void;
  showAddMore?: boolean;
}

const ServiceCart: React.FC<ServiceCartProps> = ({
  services,
  onRemoveService,
  onUpdateQuantity,
  onAddMore,
  showAddMore = false,
}) => {
  // Calculate totals
  const totalPrice = services.reduce((sum, item) => {
    const price = item.subService ? item.subService.price : item.service.price;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);

  const totalDuration = services.reduce((sum, item) => {
    const duration = item.subService ? item.subService.duration : item.service.duration;
    const quantity = item.quantity || 1;
    return sum + (duration * quantity);
  }, 0);

  if (services.length === 0) {
    return null;
  }

  return (
    <Card padding="md" className="mb-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-text-primary">
            Selected Services ({services.length})
          </h3>
          {showAddMore && onAddMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddMore}
            >
              + Add More
            </Button>
          )}
        </div>

        {/* Service List */}
        <div className="space-y-2">
          {services.map((item, index) => {
            const displayName = item.subService?.name || item.service.name;
            const displayPrice = item.subService ? item.subService.price : item.service.price;
            const displayDuration = item.subService ? item.subService.duration : item.service.duration;
            const quantity = item.quantity || 1;

            return (
              <div
                key={`${item.service.id}-${item.subService?.id || 'main'}-${index}`}
                className="flex items-start gap-3 p-3 bg-background-secondary rounded-lg"
              >
                <span className="text-2xl">{item.service.emoji}</span>

                <div className="flex-1 min-w-0">
                  {/* First Row: Service/SubService Name */}
                  <h4 className="font-medium text-text-primary text-sm">
                    {displayName}
                  </h4>

                  {/* Second Row: Parent Service Name (if subservice) + Time + Price + Stylist */}
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {/* Show parent service name if subservice is selected */}
                    {item.subService && (
                      <span className="text-[10px] text-text-muted uppercase">
                        {item.service.name}
                      </span>
                    )}

                    {/* Time, Price, and Stylist */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{displayDuration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>₹{displayPrice}</span>
                      </div>
                      {item.stylist && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{item.stylist.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls */}
                {onUpdateQuantity && (
                  <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1">
                    <button
                      onClick={() => {
                        if (quantity > 1) {
                          onUpdateQuantity(item.service.id, item.subService?.id, quantity - 1);
                        }
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3 text-primary-600" />
                    </button>
                    <span className="text-sm font-semibold text-text-primary min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.service.id, item.subService?.id, quantity + 1)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3 text-primary-600" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => onRemoveService(item.service.id, item.subService?.id)}
                  className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                  aria-label="Remove service"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Total Duration:</span>
            <span className="font-semibold text-text-primary">{totalDuration} min</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-text-secondary">Total Price:</span>
            <span className="font-semibold text-primary-600 text-lg">₹{totalPrice}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ServiceCart;

