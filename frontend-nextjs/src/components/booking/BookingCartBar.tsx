import React from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  emoji?: string;
}

interface SubService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Stylist {
  id: string;
  name: string;
}

interface SelectedServiceItem {
  service: Service;
  subService?: SubService | null;
  stylist?: Stylist | null;
}

interface BookingCartBarProps {
  services: SelectedServiceItem[];
  onBookNow: () => void;
  onClearCart?: () => void;
  onViewCart?: () => void;
}

const BookingCartBar: React.FC<BookingCartBarProps> = ({
  services,
  onBookNow,
  onClearCart,
}) => {
  if (services.length === 0) {
    return null;
  }

  const totalItems = services.length;

  // Get service names for display
  const serviceNames = services.slice(0, 2).map(item =>
    item.subService?.name || item.service.name
  );
  const remainingCount = totalItems - 2;

  return (
    <div className="fixed left-0 right-0 z-50 px-3 sm:px-4 md:bottom-4" style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-primary-500 rounded-full sm:rounded-2xl shadow-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Left Section - Cart Icon & Info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 text-primary-500" />
              </div>
              {totalItems > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] sm:text-xs font-bold">{totalItems}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-xs sm:text-sm">
                {totalItems} selected
              </div>
              <div className="text-white/80 text-[10px] sm:text-xs truncate hidden sm:block">
                {serviceNames.join(', ')}
                {remainingCount > 0 && ` +${remainingCount} more`}
              </div>
            </div>
          </div>

          {/* Right Section - Clear & Book Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onClearCart && (
              <button
                onClick={onClearCart}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors flex items-center justify-center flex-shrink-0"
                aria-label="Clear cart"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              onClick={onBookNow}
              className="bg-white text-primary-600 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full sm:rounded-xl font-semibold text-xs sm:text-sm hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCartBar;

