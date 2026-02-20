import React, { useState } from 'react';
import { logger } from '@/config/logger';
import Link from 'next/link'; import { useRouter } from 'next/navigation';
import { Calendar, Clock, ArrowRight, MapPin, User, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
// import RescheduleModal from '../booking/RescheduleModal'; // Removed unused import
import { Booking } from '../../services/bookingService';

interface Appointment {
  id: string;
  salonName: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  emoji: string;
  stylistName: string;
  location: string;
}

export interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  onReschedule: (appointmentId: string) => void;
  onViewDetails: (appointmentId: string) => void;
  isAuthenticated: boolean;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  appointments,
  onReschedule,
  onViewDetails: _onViewDetails,
  isAuthenticated,
}) => {
  const router = useRouter();
  const [_rescheduleModal, _setRescheduleModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
  }>({ isOpen: false, booking: null });

  // Only show this section if user is authenticated and has appointments
  if (!isAuthenticated || !appointments.length) return null;

  // Handle reschedule button click
  const handleRescheduleClick = async (appointmentId: string) => {
    try {
      // We need to get the full booking data for the reschedule modal
      // For now, we'll call the onReschedule prop and let the parent handle it
      onReschedule(appointmentId);
    } catch (error) {
      logger.error('Error opening reschedule modal:', error);
    }
  };

  // Handle view details button click
  const handleViewDetailsClick = (appointmentId: string) => {
    // Navigate to appointments page with the specific appointment highlighted
    router.push(`/appointments?highlight=${appointmentId}`);
  };

  return (
    <section className="py-8 md:py-16 bg-gradient-to-r from-neutral-50 to-primary-50 relative overflow-hidden">
      {/* Background decorations - hidden on mobile for cleaner look */}
      <div className="hidden md:block absolute top-10 right-10 opacity-10 animate-float">
        <Calendar className="w-12 h-12 text-primary-300" />
      </div>
      <div className="hidden md:block absolute bottom-10 left-10 opacity-10 animate-bounce-soft">
        <Clock className="w-10 h-10 text-primary-300" />
      </div>
      <div className="hidden md:block absolute top-1/2 left-1/3 opacity-5 animate-pulse-soft">
        <CheckCircle className="w-8 h-8 text-primary-200" />
      </div>

      <div className="container-custom relative px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-8 h-8 text-primary-500 animate-pulse-soft" />
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary font-heading">
                Upcoming Appointments
              </h2>
              <CheckCircle className="w-8 h-8 text-primary-500 animate-pulse-soft" style={{ animationDelay: '1s' }} />
            </div>
            <p className="text-sm md:text-base text-text-secondary flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary-400" />
              Your beauty schedule at a glance
              <CheckCircle className="w-4 h-4 text-primary-400" />
            </p>
          </div>
          <Link 
            href="/profile"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center group animate-slide-up text-sm md:text-base"
          >
            <span className="hidden md:inline">View All</span>
            <span className="md:hidden">All</span>
            <span className="ml-1 text-lg">👀</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {appointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="relative overflow-hidden group smooth-transform gpu-accelerated animate-slide-up hover:shadow-hover smooth-hover h-full p-4 md:p-6"

            >
              {/* Header with status */}
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                </div>
                <Badge 
                  variant={appointment.status === 'confirmed' ? 'success' : appointment.status === 'pending' ? 'warning' : 'error'}
                  size="sm"
                  className="flex items-center gap-1 text-xs px-2 py-1"
                >
                  {appointment.status === 'confirmed' && <span>✅</span>}
                  {appointment.status === 'pending' && <span>⏳</span>}
                  {appointment.status === 'cancelled' && <span>❌</span>}
                  {appointment.status}
                </Badge>
              </div>
              
              {/* Appointment details */}
              <div className="mb-3 md:mb-4 space-y-1 md:space-y-2">
                <h3 className="text-base md:text-lg font-semibold text-text-primary line-clamp-1">
                  {appointment.salonName}
                </h3>
                
                <p className="text-text-secondary text-xs md:text-sm flex items-center gap-1">
                  <span>{appointment.emoji}</span>
                  {appointment.service}
                </p>
                
                <div className="text-xs md:text-sm text-text-muted space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>{appointment.date}</span>
                    <Clock className="w-3 h-3 ml-1 md:ml-2 flex-shrink-0" />
                    <span>{appointment.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span>{appointment.stylistName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="line-clamp-1">{appointment.location}</span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-1 md:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center text-xs px-2 py-2"
                  onClick={() => handleRescheduleClick(appointment.id)}
                >
                  <span className="hidden md:inline">Reschedule</span>
                  <span className="md:hidden">Edit</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 flex items-center justify-center text-xs px-2 py-2"
                  onClick={() => handleViewDetailsClick(appointment.id)}
                >
                  <span className="hidden md:inline">Details</span>
                  <span className="md:hidden">View</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick stats */}
        <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="text-center bg-white/50 backdrop-blur-xl rounded-2xl p-3 md:p-4">
            <div className="text-xl md:text-2xl mb-1 md:mb-2">📊</div>
            <div className="text-lg md:text-xl font-bold text-primary-600">{appointments.length}</div>
            <div className="text-xs md:text-sm text-text-muted">This Month</div>
          </div>
          <div className="text-center bg-white/50 backdrop-blur-xl rounded-2xl p-3 md:p-4">
            <div className="text-xl md:text-2xl mb-1 md:mb-2">⭐</div>
            <div className="text-lg md:text-xl font-bold text-primary-600">4.9</div>
            <div className="text-xs md:text-sm text-text-muted">Avg Rating</div>
          </div>
          <div className="text-center bg-white/50 backdrop-blur-xl rounded-2xl p-3 md:p-4">
            <div className="text-xl md:text-2xl mb-1 md:mb-2">💰</div>
            <div className="text-lg md:text-xl font-bold text-green-600">₹240</div>
            <div className="text-xs md:text-sm text-text-muted">Saved</div>
          </div>
          <div className="text-center bg-white/50 backdrop-blur-xl rounded-2xl p-3 md:p-4">
            <div className="text-xl md:text-2xl mb-1 md:mb-2">🎁</div>
            <div className="text-lg md:text-xl font-bold text-purple-600">3</div>
            <div className="text-xs md:text-sm text-text-muted">Rewards</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UpcomingAppointments;