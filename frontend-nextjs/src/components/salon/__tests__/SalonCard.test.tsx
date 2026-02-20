import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render, createMockSalon } from '../../../test/utils/testUtils';
import SalonCard from '../SalonCard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SalonCard', () => {
  const mockSalon = createMockSalon({
    id: 'salon-1',
    displayId: 1,
    name: 'Hair Studio',
    description: 'Professional hair salon with expert stylists',
    address: '123 Main St, Downtown',
    rating: 4.5,
    reviewCount: 25,
    images: ['salon1.jpg'],
    featured: true,
    isOpen: true,
    specialties: ['Hair Cut', 'Hair Color', 'Styling'],
    amenities: ['WiFi', 'Parking', 'AC'],
    teamSize: 5,
    yearsInBusiness: 3,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders salon information correctly', () => {
    render(<SalonCard salon={mockSalon} />);

    expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    expect(screen.getByText(/professional hair salon/i)).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Downtown')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(25 reviews)')).toBeInTheDocument();
  });

  it('displays salon image with alt text', () => {
    render(<SalonCard salon={mockSalon} />);

    const image = screen.getByAltText('Hair Studio');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('salon1.jpg'));
  });

  it('shows featured badge for featured salons', () => {
    render(<SalonCard salon={mockSalon} />);

    expect(screen.getByText(/featured/i)).toBeInTheDocument();
  });

  it('does not show featured badge for non-featured salons', () => {
    const nonFeaturedSalon = createMockSalon({ featured: false });
    render(<SalonCard salon={nonFeaturedSalon} />);

    expect(screen.queryByText(/featured/i)).not.toBeInTheDocument();
  });

  it('displays open/closed status correctly', () => {
    render(<SalonCard salon={mockSalon} />);

    expect(screen.getByText(/open/i)).toBeInTheDocument();
    expect(screen.getByText(/open/i)).toHaveClass('text-green-600');
  });

  it('displays closed status correctly', () => {
    const closedSalon = createMockSalon({ isOpen: false });
    render(<SalonCard salon={closedSalon} />);

    expect(screen.getByText(/closed/i)).toBeInTheDocument();
    expect(screen.getByText(/closed/i)).toHaveClass('text-red-600');
  });

  it('displays specialties correctly', () => {
    render(<SalonCard salon={mockSalon} />);

    expect(screen.getByText('Hair Cut')).toBeInTheDocument();
    expect(screen.getByText('Hair Color')).toBeInTheDocument();
    expect(screen.getByText('Styling')).toBeInTheDocument();
  });

  it('displays amenities correctly', () => {
    render(<SalonCard salon={mockSalon} />);

    expect(screen.getByText('WiFi')).toBeInTheDocument();
    expect(screen.getByText('Parking')).toBeInTheDocument();
    expect(screen.getByText('AC')).toBeInTheDocument();
  });

  it('displays team size and years in business', () => {
    render(<SalonCard salon={mockSalon} />);

    expect(screen.getByText('5 stylists')).toBeInTheDocument();
    expect(screen.getByText('3 years')).toBeInTheDocument();
  });

  it('navigates to salon details when clicked', async () => {
    const { user } = render(<SalonCard salon={mockSalon} />);

    const card = screen.getByRole('article');
    await user.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/salons/1');
  });

  it('navigates to salon details when "View Details" button is clicked', async () => {
    const { user } = render(<SalonCard salon={mockSalon} />);

    const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
    await user.click(viewDetailsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/salons/1');
  });

  it('handles favorite button click', async () => {
    const { user } = render(<SalonCard salon={mockSalon} />);

    const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
    await user.click(favoriteButton);

    // Should not navigate when favorite button is clicked
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('displays rating stars correctly', () => {
    render(<SalonCard salon={mockSalon} />);

    const stars = screen.getAllByTestId('star-icon');
    expect(stars).toHaveLength(5);

    // Check filled stars (4.5 rating should have 4 filled stars and 1 half-filled)
    const filledStars = stars.filter(star => star.classList.contains('text-yellow-400'));
    expect(filledStars).toHaveLength(4);
  });

  it('handles salon with no reviews', () => {
    const salonWithNoReviews = createMockSalon({ 
      rating: 0, 
      reviewCount: 0 
    });
    render(<SalonCard salon={salonWithNoReviews} />);

    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
  });

  it('handles salon with no image', () => {
    const salonWithNoImage = createMockSalon({ images: [] });
    render(<SalonCard salon={salonWithNoImage} />);

    const image = screen.getByAltText('Test Salon');
    expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });

  it('truncates long descriptions', () => {
    const longDescription = 'This is a very long description that should be truncated after a certain number of characters to maintain the card layout and readability';
    const salonWithLongDescription = createMockSalon({ 
      description: longDescription 
    });
    render(<SalonCard salon={salonWithLongDescription} />);

    const description = screen.getByText(/this is a very long description/i);
    expect(description).toHaveClass('line-clamp-2');
  });

  it('displays special offer badge when salon has offers', () => {
    const salonWithOffer = createMockSalon({ 
      specialOffer: '20% OFF First Visit' 
    });
    render(<SalonCard salon={salonWithOffer} />);

    expect(screen.getByText('20% OFF First Visit')).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const { user } = render(<SalonCard salon={mockSalon} />);

    const card = screen.getByRole('article');
    
    await user.tab();
    expect(card).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalledWith('/salons/1');
  });

  it('has proper accessibility attributes', () => {
    render(<SalonCard salon={mockSalon} />);

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Hair Studio'));
  });

  it('displays price range when available', () => {
    const salonWithPriceRange = createMockSalon({ 
      priceRange: '$30 - $150' 
    });
    render(<SalonCard salon={salonWithPriceRange} />);

    expect(screen.getByText('$30 - $150')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalSalon = createMockSalon({
      specialties: [],
      amenities: [],
      teamSize: undefined,
      yearsInBusiness: undefined,
      priceRange: undefined,
    });
    
    render(<SalonCard salon={minimalSalon} />);

    expect(screen.getByText('Test Salon')).toBeInTheDocument();
    expect(screen.queryByText(/stylists/)).not.toBeInTheDocument();
    expect(screen.queryByText(/years/)).not.toBeInTheDocument();
  });

  it('shows loading state for image', () => {
    render(<SalonCard salon={mockSalon} />);

    const image = screen.getByAltText('Hair Studio');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('displays distance when provided', () => {
    const salonWithDistance = createMockSalon({ 
      distance: 2.5 
    });
    render(<SalonCard salon={salonWithDistance} />);

    expect(screen.getByText('2.5 km away')).toBeInTheDocument();
  });

  it('handles click events properly with event propagation', async () => {
    const { user } = render(<SalonCard salon={mockSalon} />);

    const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
    const card = screen.getByRole('article');

    // Click favorite button should not trigger card navigation
    await user.click(favoriteButton);
    expect(mockNavigate).not.toHaveBeenCalled();

    // Click card should trigger navigation
    await user.click(card);
    expect(mockNavigate).toHaveBeenCalledWith('/salons/1');
  });
});
