import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render, createMockUser, createMockBooking, mockApiResponse } from '../../../test/utils/testUtils';
import CustomerDashboard from '../CustomerDashboard';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CustomerDashboard', () => {
  const mockUser = createMockUser({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'CUSTOMER',
  });

  const mockBookings = [
    createMockBooking({
      id: 'booking-1',
      date: new Date('2024-12-01'),
      startTime: '10:00',
      status: 'CONFIRMED',
      service: { name: 'Hair Cut', price: 50 },
      salon: { name: 'Hair Studio' },
      stylist: { name: 'Sarah Johnson' },
    }),
    createMockBooking({
      id: 'booking-2',
      date: new Date('2024-11-15'),
      startTime: '14:00',
      status: 'COMPLETED',
      service: { name: 'Hair Color', price: 120 },
      salon: { name: 'Beauty Salon' },
      stylist: { name: 'Mike Davis' },
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    server.use(
      http.get('*/bookings', () => {
        return HttpResponse.json(mockApiResponse({ bookings: mockBookings }));
      }),
      http.get('*/users/user-1/favorites', () => {
        return HttpResponse.json(mockApiResponse({ favorites: [] }));
      }),
      http.get('*/users/user-1/reviews', () => {
        return HttpResponse.json(mockApiResponse({ reviews: [] }));
      })
    );
  });

  it('renders dashboard with welcome message', async () => {
    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    expect(screen.getByText(/welcome back, john/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('displays upcoming appointments section', async () => {
    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByText(/upcoming appointments/i)).toBeInTheDocument();
      expect(screen.getByText('Hair Cut')).toBeInTheDocument();
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });
  });

  it('displays appointment history section', async () => {
    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByText(/appointment history/i)).toBeInTheDocument();
      expect(screen.getByText('Hair Color')).toBeInTheDocument();
      expect(screen.getByText('Beauty Salon')).toBeInTheDocument();
      expect(screen.getByText('Mike Davis')).toBeInTheDocument();
    });
  });

  it('shows quick action buttons', () => {
    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    expect(screen.getByRole('button', { name: /book appointment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /find salons/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view profile/i })).toBeInTheDocument();
  });

  it('navigates to booking page when book appointment is clicked', async () => {
    const { user } = render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    const bookButton = screen.getByRole('button', { name: /book appointment/i });
    await user.click(bookButton);

    expect(mockNavigate).toHaveBeenCalledWith('/salons');
  });

  it('navigates to salons page when find salons is clicked', async () => {
    const { user } = render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    const findSalonsButton = screen.getByRole('button', { name: /find salons/i });
    await user.click(findSalonsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/salons');
  });

  it('navigates to profile page when view profile is clicked', async () => {
    const { user } = render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    const profileButton = screen.getByRole('button', { name: /view profile/i });
    await user.click(profileButton);

    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('displays appointment status correctly', async () => {
    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });
  });

  it('shows appointment details when appointment card is clicked', async () => {
    const { user } = render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByText('Hair Cut')).toBeInTheDocument();
    });

    const appointmentCard = screen.getByText('Hair Cut').closest('div');
    await user.click(appointmentCard!);

    expect(mockNavigate).toHaveBeenCalledWith('/bookings/booking-1');
  });

  it('displays empty state when no appointments exist', async () => {
    server.use(
      http.get('*/bookings', () => {
        return HttpResponse.json(mockApiResponse({ bookings: [] }));
      })
    );

    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByText(/no appointments yet/i)).toBeInTheDocument();
      expect(screen.getByText(/book your first appointment/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching data', () => {
    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('handles error state gracefully', async () => {
    server.use(
      http.get('*/bookings', () => {
        return HttpResponse.error();
      })
    );

    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByText(/error loading appointments/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('retries loading data when try again is clicked', async () => {
    server.use(
      http.get('*/bookings', () => {
        return HttpResponse.error();
      })
    );

    const { user } = render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    // Mock successful response for retry
    server.use(
      http.get('*/bookings', () => {
        return HttpResponse.json(mockApiResponse({ bookings: mockBookings }));
      })
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Hair Cut')).toBeInTheDocument();
    });
  });

  it('displays favorite salons section', async () => {
    const mockFavorites = [
      { id: 'salon-1', name: 'Hair Studio', rating: 4.5 },
      { id: 'salon-2', name: 'Beauty Salon', rating: 4.8 },
    ];

    server.use(
      http.get('*/users/user-1/favorites', () => {
        return HttpResponse.json(mockApiResponse({ favorites: mockFavorites }));
      })
    );

    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByText(/favorite salons/i)).toBeInTheDocument();
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
      expect(screen.getByText('Beauty Salon')).toBeInTheDocument();
    });
  });

  it('displays recent reviews section', async () => {
    const mockReviews = [
      {
        id: 'review-1',
        rating: 5,
        comment: 'Great service!',
        salon: { name: 'Hair Studio' },
        createdAt: new Date('2024-11-20'),
      },
    ];

    server.use(
      http.get('*/users/user-1/reviews', () => {
        return HttpResponse.json(mockApiResponse({ reviews: mockReviews }));
      })
    );

    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByText(/recent reviews/i)).toBeInTheDocument();
      expect(screen.getByText('Great service!')).toBeInTheDocument();
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    });
  });

  it('shows appointment actions for upcoming appointments', async () => {
    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reschedule/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it('shows review action for completed appointments', async () => {
    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /write review/i })).toBeInTheDocument();
    });
  });

  it('handles appointment cancellation', async () => {
    server.use(
      http.delete('*/bookings/booking-1', () => {
        return HttpResponse.json(mockApiResponse({ message: 'Booking cancelled' }));
      })
    );

    const { user } = render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Should show confirmation dialog
    expect(screen.getByText(/cancel appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /yes, cancel/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/appointment cancelled/i)).toBeInTheDocument();
    });
  });

  it('displays dashboard statistics', async () => {
    render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByText(/total appointments/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText(/upcoming/i)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation', async () => {
    const { user } = render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    const bookButton = screen.getByRole('button', { name: /book appointment/i });
    const findSalonsButton = screen.getByRole('button', { name: /find salons/i });
    const profileButton = screen.getByRole('button', { name: /view profile/i });

    await user.tab();
    expect(bookButton).toHaveFocus();

    await user.tab();
    expect(findSalonsButton).toHaveFocus();

    await user.tab();
    expect(profileButton).toHaveFocus();
  });

  it('refreshes data when page becomes visible', async () => {
    const { rerender } = render(<CustomerDashboard />, {
      authUser: mockUser,
    });

    // Simulate page becoming visible
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });

    const visibilityEvent = new Event('visibilitychange');
    document.dispatchEvent(visibilityEvent);

    // Should trigger data refresh
    await waitFor(() => {
      expect(screen.getByText('Hair Cut')).toBeInTheDocument();
    });
  });
});
