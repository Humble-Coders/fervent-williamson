'use client';
import React, { useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBookingStore } from '../store/bookingStore';
import ConfirmationScreen from '../components/booking/ConfirmationScreen';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const BookingConfirmationPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    selectedService,
    selectedSalon,
    selectedStylist,
    selectedDate,
    selectedTime,
    discount,
    bookingId,
    bookingConfirmed,
    verificationCode,
    loadBookingData,
    resetBooking,
  } = useBookingStore();

  // Get booking ID from URL
  const urlBookingId = searchParams.get('bookingId');

  useEffect(() => {
    // If no booking ID in URL or store, redirect to home
    if (!urlBookingId && !bookingId) {
      router.replace('/');
      return;
    }

    // If we have URL booking ID but no store data, this might be a page refresh
    // In a real app, you'd fetch booking data from API using the booking ID
    if (urlBookingId && !bookingConfirmed) {
      // For now, redirect to home since we don't have API
      router.replace('/');
      return;
    }
  }, [urlBookingId, bookingId, bookingConfirmed, router]);

  const handleAddToCalendar = () => {
    if (!selectedService || !selectedSalon || !selectedDate || !selectedTime) return;
    
    const startDate = new Date(`${selectedDate}T${selectedTime}`);
    const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);
    
    const event = {
      title: `${selectedService.name} at ${selectedSalon.name}`,
      start: startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      end: endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      description: `${selectedService.description}\n\nStylist: ${selectedStylist?.name || 'TBD'}\nLocation: ${selectedSalon.address}`,
      location: selectedSalon.address,
    };
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const handleDownloadReceipt = () => {
    logger.info('Downloading receipt...');
    alert('📄 Receipt download started! Check your downloads folder.');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Salon Booking',
        text: `I just booked ${selectedService?.name} at ${selectedSalon?.name} for ${selectedDate} at ${selectedTime}! 💇‍♀️✨`,
        url: window.location.href,
      });
    } else {
      const shareText = `I just booked ${selectedService?.name} at ${selectedSalon?.name} for ${selectedDate} at ${selectedTime}! 💇‍♀️✨`;
      navigator.clipboard.writeText(shareText);
      alert('📋 Booking details copied to clipboard!');
    }
  };

  const handleSetupReminders = () => {
    logger.info('Setting up reminders for booking...');
    alert('🔔 Reminders set! You\'ll receive notifications 24 hours and 1 hour before your appointment.');
  };

  const handleSendConfirmation = () => {
    logger.info('Sending confirmation email and SMS...');
    alert('📧 Confirmation email sent! 📱 SMS notification sent!');
  };

  const handleEditBooking = () => {
    // Navigate back to booking page with current data
    const params = new URLSearchParams({
      salonId: selectedSalon?.id || '',
      serviceId: selectedService?.id || '',
      editMode: 'true'
    });
    router.push(`/booking?${params.toString()}`);
  };

  // Show loading if we're still processing
  if (!selectedService || !selectedSalon || !bookingId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-text-secondary flex items-center justify-center gap-2">
            <span className="text-2xl animate-bounce-soft">📅</span>
            Loading confirmation details...
            <span className="text-2xl animate-bounce-soft" style={{ animationDelay: '1s' }}>✨</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConfirmationScreen
      bookingId={bookingId || urlBookingId || ''}
      service={selectedService}
      salon={selectedSalon}
      stylist={selectedStylist || undefined}
      date={selectedDate || ''}
      time={selectedTime || ''}
      total={selectedService.price - discount + 5}
      verificationCode={verificationCode}
      onAddToCalendar={handleAddToCalendar}
      onDownloadReceipt={handleDownloadReceipt}
      onShare={handleShare}
      onSetupReminders={handleSetupReminders}
      onSendConfirmation={handleSendConfirmation}
      onEditBooking={handleEditBooking}
    />
  );
};

export default BookingConfirmationPage;