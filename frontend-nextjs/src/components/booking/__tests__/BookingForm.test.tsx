import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render, createMockSalon, createMockService, createMockStylist, mockApiResponse, mockApiError } from '../../../test/utils/testUtils';
import BookingForm from '../BookingForm';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ salonId: 'salon-1' }),
  };
});

describe('BookingForm', () => {
  const mockSalon = createMockSalon({
    id: 'salon-1',
    name: 'Hair Studio',
    workingHours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '20:00', isOpen: true },
      saturday: { open: '08:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false },
    }
  });

  const mockServices = [
    createMockService({ id: 'service-1', name: 'Hair Cut', price: 50, duration: 60 }),
    createMockService({ id: 'service-2', name: 'Hair Color', price: 120, duration: 120 }),
  ];

  const mockStylists = [
    createMockStylist({ id: 'stylist-1', name: 'Sarah Johnson' }),
    createMockStylist({ id: 'stylist-2', name: 'Mike Davis' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses
    server.use(
      http.get('*/salons/salon-1', () => {
        return HttpResponse.json(mockApiResponse({ salon: mockSalon }));
      }),
      http.get('*/salons/salon-1/services', () => {
        return HttpResponse.json(mockApiResponse({ services: mockServices }));
      }),
      http.get('*/salons/salon-1/stylists', () => {
        return HttpResponse.json(mockApiResponse({ stylists: mockStylists }));
      }),
      http.get('*/salons/salon-1/availability', () => {
        return HttpResponse.json(mockApiResponse({ 
          availability: {
            '2024-12-01': {
              'stylist-1': ['09:00', '10:00', '11:00', '14:00', '15:00'],
              'stylist-2': ['09:00', '10:00', '13:00', '14:00', '16:00'],
            }
          }
        }));
      })
    );
  });

  it('renders booking form with all required fields', async () => {
    render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByText(/book appointment/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select service/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select stylist/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select time/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /book appointment/i })).toBeInTheDocument();
    });
  });

  it('loads salon data on mount', async () => {
    render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    });
  });

  it('loads services and stylists', async () => {
    render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByText('Hair Cut')).toBeInTheDocument();
      expect(screen.getByText('Hair Color')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Mike Davis')).toBeInTheDocument();
    });
  });

  it('shows service details when service is selected', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select service/i)).toBeInTheDocument();
    });

    const serviceSelect = screen.getByLabelText(/select service/i);
    await user.selectOptions(serviceSelect, 'service-1');

    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('60 minutes')).toBeInTheDocument();
  });

  it('updates available times when date and stylist are selected', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select stylist/i)).toBeInTheDocument();
    });

    const stylistSelect = screen.getByLabelText(/select stylist/i);
    await user.selectOptions(stylistSelect, 'stylist-1');

    const dateInput = screen.getByLabelText(/select date/i);
    await user.type(dateInput, '2024-12-01');

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      expect(screen.getByText('11:00 AM')).toBeInTheDocument();
    });
  });

  it('validates required fields before submission', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /book appointment/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /book appointment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please select a service/i)).toBeInTheDocument();
      expect(screen.getByText(/please select a stylist/i)).toBeInTheDocument();
      expect(screen.getByText(/please select a date/i)).toBeInTheDocument();
      expect(screen.getByText(/please select a time/i)).toBeInTheDocument();
    });
  });

  it('prevents booking on closed days', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select date/i)).toBeInTheDocument();
    });

    const dateInput = screen.getByLabelText(/select date/i);
    // Try to select Sunday (closed day)
    await user.type(dateInput, '2024-12-08');

    expect(screen.getByText(/salon is closed on this day/i)).toBeInTheDocument();
  });

  it('prevents booking in the past', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select date/i)).toBeInTheDocument();
    });

    const dateInput = screen.getByLabelText(/select date/i);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    await user.type(dateInput, yesterdayString);

    expect(screen.getByText(/cannot book appointments in the past/i)).toBeInTheDocument();
  });

  it('calculates total price correctly', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select service/i)).toBeInTheDocument();
    });

    const serviceSelect = screen.getByLabelText(/select service/i);
    await user.selectOptions(serviceSelect, 'service-1');

    await waitFor(() => {
      expect(screen.getByText(/total: ₹50/i)).toBeInTheDocument();
    });
  });

  it('submits booking with valid data', async () => {
    server.use(
      http.post('*/bookings', () => {
        return HttpResponse.json(mockApiResponse({ 
          booking: { 
            id: 'booking-1', 
            status: 'PENDING' 
          } 
        }));
      })
    );

    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select service/i)).toBeInTheDocument();
    });

    // Fill out the form
    const serviceSelect = screen.getByLabelText(/select service/i);
    await user.selectOptions(serviceSelect, 'service-1');

    const stylistSelect = screen.getByLabelText(/select stylist/i);
    await user.selectOptions(stylistSelect, 'stylist-1');

    const dateInput = screen.getByLabelText(/select date/i);
    await user.type(dateInput, '2024-12-01');

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    const timeSlot = screen.getByText('9:00 AM');
    await user.click(timeSlot);

    const notesInput = screen.getByLabelText(/notes/i);
    await user.type(notesInput, 'First time customer');

    const submitButton = screen.getByRole('button', { name: /book appointment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/booking-confirmation/booking-1');
    });
  });

  it('shows loading state during submission', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select service/i)).toBeInTheDocument();
    });

    // Fill out the form
    const serviceSelect = screen.getByLabelText(/select service/i);
    await user.selectOptions(serviceSelect, 'service-1');

    const stylistSelect = screen.getByLabelText(/select stylist/i);
    await user.selectOptions(stylistSelect, 'stylist-1');

    const dateInput = screen.getByLabelText(/select date/i);
    await user.type(dateInput, '2024-12-01');

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    const timeSlot = screen.getByText('9:00 AM');
    await user.click(timeSlot);

    const submitButton = screen.getByRole('button', { name: /book appointment/i });
    await user.click(submitButton);

    expect(screen.getByText(/booking appointment/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('handles booking error gracefully', async () => {
    server.use(
      http.post('*/bookings', () => {
        return HttpResponse.json(
          mockApiError('Time slot no longer available'),
          { status: 400 }
        );
      })
    );

    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select service/i)).toBeInTheDocument();
    });

    // Fill out the form
    const serviceSelect = screen.getByLabelText(/select service/i);
    await user.selectOptions(serviceSelect, 'service-1');

    const stylistSelect = screen.getByLabelText(/select stylist/i);
    await user.selectOptions(stylistSelect, 'stylist-1');

    const dateInput = screen.getByLabelText(/select date/i);
    await user.type(dateInput, '2024-12-01');

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    const timeSlot = screen.getByText('9:00 AM');
    await user.click(timeSlot);

    const submitButton = screen.getByRole('button', { name: /book appointment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/time slot no longer available/i)).toBeInTheDocument();
    });

    expect(submitButton).toBeEnabled();
  });

  it('shows stylist availability for selected date', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select date/i)).toBeInTheDocument();
    });

    const dateInput = screen.getByLabelText(/select date/i);
    await user.type(dateInput, '2024-12-01');

    await waitFor(() => {
      expect(screen.getByText(/sarah johnson/i)).toBeInTheDocument();
      expect(screen.getByText(/5 slots available/i)).toBeInTheDocument();
      expect(screen.getByText(/mike davis/i)).toBeInTheDocument();
      expect(screen.getByText(/5 slots available/i)).toBeInTheDocument();
    });
  });

  it('filters stylists by selected service', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select service/i)).toBeInTheDocument();
    });

    const serviceSelect = screen.getByLabelText(/select service/i);
    await user.selectOptions(serviceSelect, 'service-1');

    // Should only show stylists who can perform the selected service
    await waitFor(() => {
      const stylistOptions = screen.getAllByRole('option');
      const availableStylists = stylistOptions.filter(option => 
        option.textContent?.includes('Sarah') || option.textContent?.includes('Mike')
      );
      expect(availableStylists.length).toBeGreaterThan(0);
    });
  });

  it('shows working hours for selected date', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select date/i)).toBeInTheDocument();
    });

    const dateInput = screen.getByLabelText(/select date/i);
    await user.type(dateInput, '2024-12-01'); // Monday

    await waitFor(() => {
      expect(screen.getByText(/open 9:00 am - 6:00 pm/i)).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation through time slots', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select stylist/i)).toBeInTheDocument();
    });

    const stylistSelect = screen.getByLabelText(/select stylist/i);
    await user.selectOptions(stylistSelect, 'stylist-1');

    const dateInput = screen.getByLabelText(/select date/i);
    await user.type(dateInput, '2024-12-01');

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    const firstTimeSlot = screen.getByText('9:00 AM');
    firstTimeSlot.focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('10:00 AM')).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByText('10:00 AM')).toHaveClass('selected');
  });

  it('shows booking summary before confirmation', async () => {
    const { user } = render(<BookingForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select service/i)).toBeInTheDocument();
    });

    // Fill out the form
    const serviceSelect = screen.getByLabelText(/select service/i);
    await user.selectOptions(serviceSelect, 'service-1');

    const stylistSelect = screen.getByLabelText(/select stylist/i);
    await user.selectOptions(stylistSelect, 'stylist-1');

    const dateInput = screen.getByLabelText(/select date/i);
    await user.type(dateInput, '2024-12-01');

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    const timeSlot = screen.getByText('9:00 AM');
    await user.click(timeSlot);

    // Should show booking summary
    expect(screen.getByText(/booking summary/i)).toBeInTheDocument();
    expect(screen.getByText('Hair Cut')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('December 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
  });
});
