import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render, createMockSalon, mockApiResponse } from '../../test/utils/testUtils';
import HomePage from '../HomePage';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useRouter: () => mockNavigate,
  };
});

describe('HomePage', () => {
  const mockFeaturedSalons = [
    createMockSalon({
      id: 'salon-1',
      name: 'Hair Studio',
      rating: 4.8,
      featured: true,
      images: ['salon1.jpg'],
    }),
    createMockSalon({
      id: 'salon-2',
      name: 'Beauty Salon',
      rating: 4.6,
      featured: true,
      images: ['salon2.jpg'],
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    server.use(
      http.get('*/salons', ({ request }) => {
        const url = new URL(request.url);
        const featured = url.searchParams.get('featured');
        
        if (featured === 'true') {
          return HttpResponse.json(mockApiResponse({ salons: mockFeaturedSalons }));
        }
        
        return HttpResponse.json(mockApiResponse({ salons: [] }));
      })
    );
  });

  it('renders hero section with main heading', () => {
    render(<HomePage />);

    expect(screen.getByText(/book your perfect appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/discover amazing salons/i)).toBeInTheDocument();
  });

  it('renders search bar in hero section', () => {
    render(<HomePage />);

    expect(screen.getByPlaceholderText(/search salons, services/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('handles search submission', async () => {
    const { user } = render(<HomePage />);

    const searchInput = screen.getByPlaceholderText(/search salons, services/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'hair salon');
    await user.click(searchButton);

    expect(mockNavigate).toHaveBeenCalledWith('/salons?search=hair salon');
  });

  it('handles search with Enter key', async () => {
    const { user } = render(<HomePage />);

    const searchInput = screen.getByPlaceholderText(/search salons, services/i);

    await user.type(searchInput, 'beauty salon');
    await user.keyboard('{Enter}');

    expect(mockNavigate).toHaveBeenCalledWith('/salons?search=beauty salon');
  });

  it('displays featured salons section', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/featured salons/i)).toBeInTheDocument();
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
      expect(screen.getByText('Beauty Salon')).toBeInTheDocument();
    });
  });

  it('navigates to salon details when featured salon is clicked', async () => {
    const { user } = render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    });

    const salonCard = screen.getByText('Hair Studio').closest('div');
    await user.click(salonCard!);

    expect(mockNavigate).toHaveBeenCalledWith('/salons/salon-1');
  });

  it('displays how it works section', () => {
    render(<HomePage />);

    expect(screen.getByText(/how it works/i)).toBeInTheDocument();
    expect(screen.getByText(/search & discover/i)).toBeInTheDocument();
    expect(screen.getByText(/book appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/enjoy service/i)).toBeInTheDocument();
  });

  it('displays services section', () => {
    render(<HomePage />);

    expect(screen.getByText(/popular services/i)).toBeInTheDocument();
    expect(screen.getByText(/hair cut/i)).toBeInTheDocument();
    expect(screen.getByText(/hair color/i)).toBeInTheDocument();
    expect(screen.getByText(/manicure/i)).toBeInTheDocument();
    expect(screen.getByText(/facial/i)).toBeInTheDocument();
  });

  it('navigates to services when service category is clicked', async () => {
    const { user } = render(<HomePage />);

    const hairCutService = screen.getByText(/hair cut/i);
    await user.click(hairCutService);

    expect(mockNavigate).toHaveBeenCalledWith('/salons?service=hair-cut');
  });

  it('displays testimonials section', () => {
    render(<HomePage />);

    expect(screen.getByText(/what our customers say/i)).toBeInTheDocument();
    expect(screen.getByText(/amazing experience/i)).toBeInTheDocument();
    expect(screen.getByText(/professional service/i)).toBeInTheDocument();
  });

  it('displays call-to-action section', () => {
    render(<HomePage />);

    expect(screen.getByText(/ready to book/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });

  it('navigates to salons page when get started is clicked', async () => {
    const { user } = render(<HomePage />);

    const getStartedButton = screen.getByRole('button', { name: /get started/i });
    await user.click(getStartedButton);

    expect(mockNavigate).toHaveBeenCalledWith('/salons');
  });

  it('handles location-based search', async () => {
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

    const { user } = render(<HomePage />);

    const nearMeButton = screen.getByRole('button', { name: /near me/i });
    await user.click(nearMeButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/salons?lat=40.7128&lng=-74.0060');
    });
  });

  it('shows loading state for featured salons', () => {
    render(<HomePage />);

    expect(screen.getByTestId('featured-salons-loading')).toBeInTheDocument();
  });

  it('handles error loading featured salons', async () => {
    server.use(
      http.get('*/salons', () => {
        return HttpResponse.error();
      })
    );

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/error loading featured salons/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no featured salons', async () => {
    server.use(
      http.get('*/salons', () => {
        return HttpResponse.json(mockApiResponse({ salons: [] }));
      })
    );

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/no featured salons available/i)).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation in search', async () => {
    const { user } = render(<HomePage />);

    const searchInput = screen.getByPlaceholderText(/search salons, services/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.tab();
    expect(searchInput).toHaveFocus();

    await user.tab();
    expect(searchButton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalledWith('/salons?search=');
  });

  it('displays statistics section', () => {
    render(<HomePage />);

    expect(screen.getByText(/1000\+/)).toBeInTheDocument();
    expect(screen.getByText(/salons/i)).toBeInTheDocument();
    expect(screen.getByText(/50000\+/)).toBeInTheDocument();
    expect(screen.getByText(/happy customers/i)).toBeInTheDocument();
    expect(screen.getByText(/4\.8/)).toBeInTheDocument();
    expect(screen.getByText(/average rating/i)).toBeInTheDocument();
  });

  it('displays download app section', () => {
    render(<HomePage />);

    expect(screen.getByText(/download our app/i)).toBeInTheDocument();
    expect(screen.getByText(/app store/i)).toBeInTheDocument();
    expect(screen.getByText(/google play/i)).toBeInTheDocument();
  });

  it('handles app store links', async () => {
    const { user } = render(<HomePage />);

    const appStoreLink = screen.getByText(/app store/i).closest('a');
    const googlePlayLink = screen.getByText(/google play/i).closest('a');

    expect(appStoreLink).toHaveAttribute('href', expect.stringContaining('apple.com'));
    expect(googlePlayLink).toHaveAttribute('href', expect.stringContaining('play.google.com'));
  });

  it('displays newsletter signup', () => {
    render(<HomePage />);

    expect(screen.getByText(/stay updated/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('handles newsletter subscription', async () => {
    server.use(
      http.post('*/newsletter/subscribe', () => {
        return HttpResponse.json(mockApiResponse({ message: 'Subscribed successfully' }));
      })
    );

    const { user } = render(<HomePage />);

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const subscribeButton = screen.getByRole('button', { name: /subscribe/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(subscribeButton);

    await waitFor(() => {
      expect(screen.getByText(/subscribed successfully/i)).toBeInTheDocument();
    });
  });

  it('validates newsletter email format', async () => {
    const { user } = render(<HomePage />);

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const subscribeButton = screen.getByRole('button', { name: /subscribe/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(subscribeButton);

    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
  });

  it('displays social media links', () => {
    render(<HomePage />);

    expect(screen.getByLabelText(/facebook/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/twitter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/instagram/i)).toBeInTheDocument();
  });

  it('is responsive on mobile devices', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<HomePage />);

    const heroSection = screen.getByTestId('hero-section');
    expect(heroSection).toHaveClass('px-4'); // Mobile padding
  });

  it('lazy loads images for performance', async () => {
    render(<HomePage />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });
  });

  it('has proper SEO meta tags', () => {
    render(<HomePage />);

    expect(document.title).toContain('SalonBook');
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      expect.stringContaining('book appointments')
    );
  });
});
