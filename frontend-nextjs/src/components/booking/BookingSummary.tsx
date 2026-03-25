import React from 'react';
import { logger } from '@/config/logger';
import { Calendar, User, MapPin } from 'lucide-react';
import Button from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import useAuthPrompt from '../../hooks/useAuthPrompt';
import LoginModal from '../auth/LoginModal';

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

interface StylistInfo {
  id: string;
  name: string;
  emoji?: string;
}

interface SelectedServiceItem {
  service: Service;
  subService?: SubService | null;
  stylist?: StylistInfo | null;
  quantity?: number;
}

export interface BookingSummaryProps {
  service?: {
    name: string;
    price: number;
    duration: number;
    emoji?: string;
  };
  services?: SelectedServiceItem[];
  salon: {
    name: string;
    address: string;
  };
  stylist?: {
    name: string;
    emoji?: string;
  };
  selectedDate: string | null;
  selectedTime: string | null;
  paymentMethod?: string | null;
  discount: number;
  onConfirmBooking: () => void;
  onEditBooking: () => void;
  isLoading: boolean;
}

const BOOKING_FEE = 5;

const BookingSummary: React.FC<BookingSummaryProps> = ({
  service,
  services = [],
  salon,
  stylist,
  selectedDate,
  selectedTime,
  paymentMethod,
  discount,
  onConfirmBooking,
  onEditBooking: _onEditBooking,
  isLoading,
}) => {
  const { isAuthenticated } = useAuthStore();
  const {
    isLoginModalOpen,
    promptOptions,
    promptLogin,
    handleLoginSuccess,
    handleLoginCancel
  } = useAuthPrompt();

  // Determine which services to display (multi-service aware)
  const displayServices: SelectedServiceItem[] =
    services && services.length > 0
      ? services
      : service
        ? [{
            service: {
              id: 'single',
              name: service.name,
              price: service.price,
              duration: service.duration,
              emoji: service.emoji,
            },
            subService: null,
            stylist: stylist
              ? {
                  id: 'stylist',
                  name: stylist.name,
                  emoji: stylist.emoji,
                }
              : null,
            quantity: 1,
          }]
        : [];

  const subtotal = displayServices.reduce((sum, item) => {
    const price = item.subService ? item.subService.price : item.service.price;
    const quantity = item.quantity || 1;
    return sum + price * quantity;
  }, 0);

  const total = subtotal - discount + BOOKING_FEE;

  const paymentMethodNames: { [key: string]: string } = {
    card: 'Credit/Debit Card 💳',
    wallet: 'Digital Wallet 📱',
    cash: 'Pay at Salon 💰'
  };

  const isComplete = selectedDate && selectedTime;

  const handleConfirmClick = () => {
    if (isAuthenticated) {
      // User is logged in, proceed with booking
      onConfirmBooking();
    } else {
      // User not logged in, prompt for login
      promptLogin({
        title: "Sign in to place booking",
        message: "Please sign in to complete your booking and receive confirmation details",
        onSuccess: () => {
          // After successful login, proceed with booking
          logger.info('User successfully signed in!');
          onConfirmBooking();
        },
        onCancel: () => {
          logger.info('User cancelled login');
        }
      });
    }
  };

  return (
    <>
      <div className="sticky top-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📋</span>
          <h3 className="text-lg font-semibold text-text-primary">
            Booking Summary
          </h3>
          <span className="text-lg">✨</span>
        </div>

        {/* Service Details (supports multiple services) */}
        <div className="space-y-3 mb-4">
          {displayServices.map((item, index) => {
            const displayName = item.subService?.name || item.service.name;
            const displayPrice = item.subService ? item.subService.price : item.service.price;
            const displayDuration = item.subService ? item.subService.duration : item.service.duration;
            const quantity = item.quantity || 1;

            return (
              <div
                key={`${item.service.id}-${item.subService?.id || 'main'}-${index}`}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg"
              >
                <span className="text-2xl">{item.service.emoji || '✨'}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-text-primary text-sm">{displayName}</h4>
                  <p className="text-xs text-text-muted">{salon.name}</p>
                  {quantity > 1 && (
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Qty: {quantity}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-600 text-sm">₹{displayPrice * quantity}</p>
                  <p className="text-xs text-text-muted">{displayDuration * quantity} min</p>
                </div>
              </div>
            );
          })}

          {/* Booking Details */}
          <div className="space-y-2">
            {stylist && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-secondary">
                  Stylist: {stylist.name} {stylist.emoji}
                </span>
              </div>
            )}

            {selectedDate && selectedTime && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-secondary">
                  {selectedDate} at {selectedTime}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-secondary">
                {salon.address}
              </span>
            </div>

            {paymentMethod && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">
                  {paymentMethodNames[paymentMethod]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-neutral-200 pt-3 mb-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="text-text-primary">₹{subtotal}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-green-600 text-sm">
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Booking Fee</span>
              <span className="text-text-primary">₹{BOOKING_FEE}</span>
            </div>

            <div className="flex justify-between text-base font-semibold text-text-primary border-t border-neutral-200 pt-2">
              <span>Total</span>
              <span className="text-primary-600">₹{total}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleConfirmClick}
            disabled={!isComplete}
            loading={isLoading}
            data-testid="place-booking-button"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Placing...
              </>
            ) : (
              <>
                <span className="mr-2">📅</span>
                Place Booking
                <span className="ml-2">🎉</span>
              </>
            )}
          </Button>

          {/* <Button
          variant="outline"
          size="md"
          className="w-full"
          onClick={onEditBooking}
        >
          <span className="mr-2">✏️</span>
          Edit Details
        </Button> */}
        </div>

        {/* Cancellation Policy */}
        {/* <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-2 text-yellow-800 text-xs">
          <span className="text-lg mt-0.5">⚠️</span>
          <div>
            <p className="font-medium mb-1">Cancellation Policy</p>
            <p>
              Free cancellation up to 24 hours before your appointment. 
              Late cancellations may incur a fee.
            </p>
          </div>
        </div>
      </div> */}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginCancel}
        onSuccess={handleLoginSuccess}
        title={promptOptions.title}
        message={promptOptions.message}
      />
    </>
  );
};

export default BookingSummary;