// Integration tests for FeaturedSalons component
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test/utils/testUtils';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import FeaturedSalons from '../FeaturedSalons';
import { createMockSalon } from '../../../test/utils/testUtils';
import { env } from '../../../config/env';

describe('FeaturedSalons Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders featured salons list', async () => {
    const mockSalons = [
      createMockSalon({ 
        id: 'salon-1', 
        name: 'Hair Studio', 
        featured: true,
        rating: 4.5,
        reviewCount: 25 
      }),
      createMockSalon({ 
        id: 'salon-2', 
        name: 'Beauty Lounge', 
        featured: true,
        rating: 4.8,
        reviewCount: 42 
      }),
    ];

    server.use(
      http.get(`${env.API_URL}/salons`, () => {
        return HttpResponse.json({
          success: true,
          data: mockSalons,
        });
      })
    );

    render(<FeaturedSalons />);

    // Check loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for salons to load
    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
      expect(screen.getByText('Beauty Lounge')).toBeInTheDocument();
    });

    // Check salon details
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('25 reviews')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('42 reviews')).toBeInTheDocument();
  });

  it('displays empty state when no featured salons', async () => {
    server.use(
      http.get(`${env.API_URL}/salons`, () => {
        return HttpResponse.json({
          success: true,
          data: [],
        });
      })
    );

    render(<FeaturedSalons />);

    await waitFor(() => {
      expect(screen.getByText(/no featured salons/i)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    server.use(
      http.get(`${env.API_URL}/salons`, () => {
        return HttpResponse.json(
          {
            success: false,
            message: 'Failed to fetch salons',
          },
          { status: 500 }
        );
      })
    );

    render(<FeaturedSalons />);

    await waitFor(() => {
      expect(screen.getByText(/error loading salons/i)).toBeInTheDocument();
    });
  });

  it('navigates to salon detail on salon click', async () => {
    const mockSalons = [
      createMockSalon({
        id: 'salon-1',
        displayId: 1,
        name: 'Hair Studio',
        featured: true
      }),
    ];

    server.use(
      http.get(`${env.API_URL}/salons`, () => {
        return HttpResponse.json({
          success: true,
          data: mockSalons,
        });
      })
    );

    const { user } = render(<FeaturedSalons />);

    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    });

    const salonCard = screen.getByText('Hair Studio').closest('a');
    expect(salonCard).toHaveAttribute('href', '/salons/1');
  });

  it('displays salon images', async () => {
    const mockSalons = [
      createMockSalon({ 
        id: 'salon-1', 
        name: 'Hair Studio', 
        featured: true,
        images: ['salon1.jpg', 'salon2.jpg']
      }),
    ];

    server.use(
      http.get(`${env.API_URL}/salons`, () => {
        return HttpResponse.json({
          success: true,
          data: mockSalons,
        });
      })
    );

    render(<FeaturedSalons />);

    await waitFor(() => {
      const image = screen.getByAltText('Hair Studio');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', expect.stringContaining('salon1.jpg'));
    });
  });

  it('shows fallback image when no images available', async () => {
    const mockSalons = [
      createMockSalon({ 
        id: 'salon-1', 
        name: 'Hair Studio', 
        featured: true,
        images: []
      }),
    ];

    server.use(
      http.get(`${env.API_URL}/salons`, () => {
        return HttpResponse.json({
          success: true,
          data: mockSalons,
        });
      })
    );

    render(<FeaturedSalons />);

    await waitFor(() => {
      const image = screen.getByAltText('Hair Studio');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'));
    });
  });

  it('displays salon specialties', async () => {
    const mockSalons = [
      createMockSalon({ 
        id: 'salon-1', 
        name: 'Hair Studio', 
        featured: true,
        specialties: ['Hair Cut', 'Hair Color', 'Styling']
      }),
    ];

    server.use(
      http.get(`${env.API_URL}/salons`, () => {
        return HttpResponse.json({
          success: true,
          data: mockSalons,
        });
      })
    );

    render(<FeaturedSalons />);

    await waitFor(() => {
      expect(screen.getByText('Hair Cut')).toBeInTheDocument();
      expect(screen.getByText('Hair Color')).toBeInTheDocument();
      expect(screen.getByText('Styling')).toBeInTheDocument();
    });
  });

  it('shows distance when available', async () => {
    const mockSalons = [
      createMockSalon({ 
        id: 'salon-1', 
        name: 'Hair Studio', 
        featured: true,
        distance: '2.5 km'
      }),
    ];

    server.use(
      http.get(`${env.API_URL}/salons`, () => {
        return HttpResponse.json({
          success: true,
          data: mockSalons,
        });
      })
    );

    render(<FeaturedSalons />);

    await waitFor(() => {
      expect(screen.getByText('2.5 km')).toBeInTheDocument();
    });
  });

  it('handles favorite toggle', async () => {
    const mockSalons = [
      createMockSalon({ 
        id: 'salon-1', 
        name: 'Hair Studio', 
        featured: true 
      }),
    ];

    server.use(
      http.get(`${env.API_URL}/salons`, () => {
        return HttpResponse.json({
          success: true,
          data: mockSalons,
        });
      }),
      http.post(`${env.API_URL}/favorites`, () => {
        return HttpResponse.json({
          success: true,
          data: { id: 'favorite-1', salonId: 'salon-1' },
        });
      })
    );

    const { user } = render(<FeaturedSalons />);

    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    });

    const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
    await user.click(favoriteButton);

    // Should show success feedback
    await waitFor(() => {
      expect(screen.getByText(/added to favorites/i)).toBeInTheDocument();
    });
  });

  it('supports grid view toggle', async () => {
    const mockSalons = [
      createMockSalon({ id: 'salon-1', name: 'Hair Studio', featured: true }),
      createMockSalon({ id: 'salon-2', name: 'Beauty Lounge', featured: true }),
    ];

    server.use(
      http.get(`${env.API_URL}/salons`, () => {
        return HttpResponse.json({
          success: true,
          data: mockSalons,
        });
      })
    );

    const { user } = render(<FeaturedSalons />);

    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    });

    // Toggle to 2-column view
    const gridToggle = screen.getByRole('button', { name: /2 columns/i });
    await user.click(gridToggle);

    // Check if grid layout changed
    const salonGrid = screen.getByTestId('salons-grid');
    expect(salonGrid).toHaveClass('grid-cols-2');
  });

  it('shows loading skeleton', () => {
    render(<FeaturedSalons />);

    // Should show loading skeletons
    expect(screen.getAllByTestId('salon-skeleton')).toHaveLength(3);
  });

  it('retries on error', async () => {
    let callCount = 0;
    server.use(
      http.get(`${env.API_URL}/salons`, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
          );
        }
        return HttpResponse.json({
          success: true,
          data: [createMockSalon({ name: 'Hair Studio', featured: true })],
        });
      })
    );

    const { user } = render(<FeaturedSalons />);

    await waitFor(() => {
      expect(screen.getByText(/error loading salons/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  });
});
