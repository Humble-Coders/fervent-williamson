import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render, createMockSalon, mockApiResponse } from '../../test/utils/testUtils';
import SalonListPage from '../SalonListPage';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useRouter: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
  };
});

describe('SalonListPage', () => {
  const mockSalons = [
    createMockSalon({
      id: 'salon-1',
      name: 'Hair Studio',
      rating: 4.8,
      reviewCount: 25,
      address: '123 Main St, Downtown',
      isOpen: true,
    }),
    createMockSalon({
      id: 'salon-2',
      name: 'Beauty Salon',
      rating: 4.6,
      reviewCount: 18,
      address: '456 Oak Ave, Uptown',
      isOpen: false,
    }),
    createMockSalon({
      id: 'salon-3',
      name: 'Style Center',
      rating: 4.9,
      reviewCount: 32,
      address: '789 Pine St, Midtown',
      isOpen: true,
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
    
    server.use(
      http.get('*/salons', () => {
        return HttpResponse.json(mockApiResponse({ 
          salons: mockSalons,
          pagination: {
            page: 1,
            limit: 10,
            total: 3,
            totalPages: 1,
          }
        }));
      })
    );
  });

  it('renders salon list page with search and filters', async () => {
    render(<SalonListPage />);

    expect(screen.getByText(/find businesses/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search businesses/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sort/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
      expect(screen.getByText('Beauty Salon')).toBeInTheDocument();
      expect(screen.getByText('Style Center')).toBeInTheDocument();
    });
  });

  it('displays salon cards with correct information', async () => {
    render(<SalonListPage />);

    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('(25 reviews)')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, Downtown')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    const { user } = render(<SalonListPage />);

    const searchInput = screen.getByPlaceholderText(/search businesses/i);
    await user.type(searchInput, 'hair');

    await waitFor(() => {
      // Should trigger API call with search parameter
      expect(screen.getByDisplayValue('hair')).toBeInTheDocument();
    });
  });

  it('opens filter panel when filter button is clicked', async () => {
    const { user } = render(<SalonListPage />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    expect(screen.getByText(/filter salons/i)).toBeInTheDocument();
    expect(screen.getByText(/location/i)).toBeInTheDocument();
    expect(screen.getByText(/rating/i)).toBeInTheDocument();
    expect(screen.getByText(/price range/i)).toBeInTheDocument();
  });

  it('applies location filter', async () => {
    const { user } = render(<SalonListPage />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    const locationInput = screen.getByPlaceholderText(/enter location/i);
    await user.type(locationInput, 'Downtown');

    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);

    // Should update URL and trigger new API call
    await waitFor(() => {
      expect(screen.getByDisplayValue('Downtown')).toBeInTheDocument();
    });
  });

  it('applies rating filter', async () => {
    const { user } = render(<SalonListPage />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    const ratingSlider = screen.getByRole('slider', { name: /minimum rating/i });
    await user.click(ratingSlider);

    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);

    // Should filter salons by rating
    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    });
  });

  it('changes sort order', async () => {
    const { user } = render(<SalonListPage />);

    const sortButton = screen.getByRole('button', { name: /sort/i });
    await user.click(sortButton);

    expect(screen.getByText(/sort by/i)).toBeInTheDocument();
    
    const ratingSort = screen.getByRole('button', { name: /rating/i });
    await user.click(ratingSort);

    // Should re-sort the salons
    await waitFor(() => {
      const salonCards = screen.getAllByTestId('salon-card');
      expect(salonCards[0]).toHaveTextContent('Style Center'); // Highest rating first
    });
  });

  it('navigates to salon details when salon card is clicked', async () => {
    const { user } = render(<SalonListPage />);

    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    });

    const salonCard = screen.getByText('Hair Studio').closest('[data-testid="salon-card"]');
    await user.click(salonCard!);

    expect(mockNavigate).toHaveBeenCalledWith('/salons/salon-1');
  });

  it('displays loading state', () => {
    server.use(
      http.get('*/salons', () => {
        return new Promise(() => {}); // Never resolves to simulate loading
      })
    );

    render(<SalonListPage />);

    expect(screen.getByTestId('salon-list-loading')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    server.use(
      http.get('*/salons', () => {
        return HttpResponse.error();
      })
    );

    render(<SalonListPage />);

    await waitFor(() => {
      expect(screen.getByText(/error loading salons/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('retries loading when try again is clicked', async () => {
    server.use(
      http.get('*/salons', () => {
        return HttpResponse.error();
      })
    );

    const { user } = render(<SalonListPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    // Mock successful response for retry
    server.use(
      http.get('*/salons', () => {
        return HttpResponse.json(mockApiResponse({ salons: mockSalons }));
      })
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    });
  });

  it('displays empty state when no salons found', async () => {
    server.use(
      http.get('*/salons', () => {
        return HttpResponse.json(mockApiResponse({ salons: [] }));
      })
    );

    render(<SalonListPage />);

    await waitFor(() => {
      expect(screen.getByText(/no salons found/i)).toBeInTheDocument();
      expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    server.use(
      http.get('*/salons', ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get('page') || '1';
        
        return HttpResponse.json(mockApiResponse({ 
          salons: mockSalons,
          pagination: {
            page: parseInt(page),
            limit: 2,
            total: 3,
            totalPages: 2,
          }
        }));
      })
    );

    const { user } = render(<SalonListPage />);

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
    });
  });

  it('toggles between grid and list view', async () => {
    const { user } = render(<SalonListPage />);

    const gridToggle = screen.getByRole('button', { name: /grid view/i });
    const listToggle = screen.getByRole('button', { name: /list view/i });

    // Default should be grid view
    expect(gridToggle).toHaveClass('active');

    await user.click(listToggle);
    expect(listToggle).toHaveClass('active');
    expect(gridToggle).not.toHaveClass('active');

    // Should change layout
    const salonContainer = screen.getByTestId('salon-container');
    expect(salonContainer).toHaveClass('list-view');
  });

  it('shows salon count and results info', async () => {
    render(<SalonListPage />);

    await waitFor(() => {
      expect(screen.getByText(/3 salons found/i)).toBeInTheDocument();
    });
  });

  it('handles geolocation for nearby search', async () => {
    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        });
      })
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    });

    const { user } = render(<SalonListPage />);

    const nearbyButton = screen.getByRole('button', { name: /near me/i });
    await user.click(nearbyButton);

    await waitFor(() => {
      // Should update search with location
      expect(screen.getByText(/salons near you/i)).toBeInTheDocument();
    });
  });

  it('preserves search params in URL', async () => {
    mockSearchParams.set('search', 'hair');
    mockSearchParams.set('location', 'downtown');

    render(<SalonListPage />);

    expect(screen.getByDisplayValue('hair')).toBeInTheDocument();
    expect(screen.getByDisplayValue('downtown')).toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const { user } = render(<SalonListPage />);

    // Apply some filters first
    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    const locationInput = screen.getByPlaceholderText(/enter location/i);
    await user.type(locationInput, 'Downtown');

    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear all/i });
    await user.click(clearButton);

    expect(screen.getByPlaceholderText(/enter location/i)).toHaveValue('');
  });

  it('supports keyboard navigation', async () => {
    const { user } = render(<SalonListPage />);

    const searchInput = screen.getByPlaceholderText(/search salons/i);
    const filterButton = screen.getByRole('button', { name: /filters/i });

    await user.tab();
    expect(searchInput).toHaveFocus();

    await user.tab();
    expect(filterButton).toHaveFocus();
  });

  it('is responsive on mobile devices', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<SalonListPage />);

    const container = screen.getByTestId('salon-list-container');
    expect(container).toHaveClass('mobile-layout');
  });

  it('shows map view toggle', async () => {
    const { user } = render(<SalonListPage />);

    const mapToggle = screen.getByRole('button', { name: /map view/i });
    await user.click(mapToggle);

    expect(screen.getByTestId('salon-map')).toBeInTheDocument();
  });
});
