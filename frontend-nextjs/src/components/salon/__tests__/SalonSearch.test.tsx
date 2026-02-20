import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../../test/utils/testUtils';
import SalonSearch from '../SalonSearch';

describe('SalonSearch', () => {
  const mockOnSearch = vi.fn();
  const mockOnFilterChange = vi.fn();

  const defaultProps = {
    onSearch: mockOnSearch,
    onFilterChange: mockOnFilterChange,
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and filter controls', () => {
    render(<SalonSearch {...defaultProps} />);

    expect(screen.getByPlaceholderText(/search businesses/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sort/i })).toBeInTheDocument();
  });

  it('calls onSearch when typing in search input', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search businesses/i);
    await user.type(searchInput, 'hair salon');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('hair salon');
    });
  });

  it('debounces search input to avoid excessive API calls', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search salons/i);
    
    // Type quickly
    await user.type(searchInput, 'h');
    await user.type(searchInput, 'a');
    await user.type(searchInput, 'i');
    await user.type(searchInput, 'r');

    // Should only call onSearch once after debounce delay
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('hair');
    });
  });

  it('clears search when clear button is clicked', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search salons/i);
    await user.type(searchInput, 'hair salon');

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearButton);

    expect(searchInput).toHaveValue('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('opens filter panel when filter button is clicked', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    expect(screen.getByText(/filter salons/i)).toBeInTheDocument();
    expect(screen.getByText(/location/i)).toBeInTheDocument();
    expect(screen.getByText(/rating/i)).toBeInTheDocument();
    expect(screen.getByText(/price range/i)).toBeInTheDocument();
    expect(screen.getByText(/amenities/i)).toBeInTheDocument();
  });

  it('applies location filter', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    const locationInput = screen.getByPlaceholderText(/enter location/i);
    await user.type(locationInput, 'Downtown');

    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'Downtown'
      })
    );
  });

  it('applies rating filter', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    const ratingSlider = screen.getByRole('slider', { name: /minimum rating/i });
    await user.click(ratingSlider);
    // Simulate setting rating to 4
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');

    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        minRating: expect.any(Number)
      })
    );
  });

  it('applies price range filter', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    const priceRangeSelect = screen.getByLabelText(/price range/i);
    await user.selectOptions(priceRangeSelect, '$50-$100');

    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        priceRange: '$50-$100'
      })
    );
  });

  it('applies amenities filter', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    const wifiCheckbox = screen.getByLabelText(/wifi/i);
    const parkingCheckbox = screen.getByLabelText(/parking/i);

    await user.click(wifiCheckbox);
    await user.click(parkingCheckbox);

    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        amenities: expect.arrayContaining(['WiFi', 'Parking'])
      })
    );
  });

  it('clears all filters when clear filters button is clicked', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    // Apply some filters first
    const locationInput = screen.getByPlaceholderText(/enter location/i);
    await user.type(locationInput, 'Downtown');

    const wifiCheckbox = screen.getByLabelText(/wifi/i);
    await user.click(wifiCheckbox);

    const clearFiltersButton = screen.getByRole('button', { name: /clear filters/i });
    await user.click(clearFiltersButton);

    expect(locationInput).toHaveValue('');
    expect(wifiCheckbox).not.toBeChecked();
    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });

  it('changes sort order', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const sortButton = screen.getByRole('button', { name: /sort/i });
    await user.click(sortButton);

    expect(screen.getByText(/sort by/i)).toBeInTheDocument();
    expect(screen.getByText(/rating/i)).toBeInTheDocument();
    expect(screen.getByText(/distance/i)).toBeInTheDocument();
    expect(screen.getByText(/price/i)).toBeInTheDocument();
    expect(screen.getByText(/newest/i)).toBeInTheDocument();

    const ratingSort = screen.getByRole('button', { name: /rating/i });
    await user.click(ratingSort);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'rating'
      })
    );
  });

  it('shows loading state', () => {
    render(<SalonSearch {...defaultProps} loading={true} />);

    const searchInput = screen.getByPlaceholderText(/search salons/i);
    expect(searchInput).toBeDisabled();
    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
  });

  it('shows active filter count', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    // Apply multiple filters
    const locationInput = screen.getByPlaceholderText(/enter location/i);
    await user.type(locationInput, 'Downtown');

    const wifiCheckbox = screen.getByLabelText(/wifi/i);
    await user.click(wifiCheckbox);

    const parkingCheckbox = screen.getByLabelText(/parking/i);
    await user.click(parkingCheckbox);

    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);

    // Should show filter count badge
    expect(screen.getByText('3')).toBeInTheDocument(); // 1 location + 2 amenities
  });

  it('supports keyboard navigation', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search salons/i);
    const filterButton = screen.getByRole('button', { name: /filters/i });
    const sortButton = screen.getByRole('button', { name: /sort/i });

    // Tab through controls
    await user.tab();
    expect(searchInput).toHaveFocus();

    await user.tab();
    expect(filterButton).toHaveFocus();

    await user.tab();
    expect(sortButton).toHaveFocus();

    // Open filter panel with Enter
    await user.keyboard('{Enter}');
    expect(screen.getByText(/filter salons/i)).toBeInTheDocument();
  });

  it('closes filter panel when clicking outside', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    expect(screen.getByText(/filter salons/i)).toBeInTheDocument();

    // Click outside the panel
    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText(/filter salons/i)).not.toBeInTheDocument();
    });
  });

  it('closes filter panel when pressing Escape', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    expect(screen.getByText(/filter salons/i)).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText(/filter salons/i)).not.toBeInTheDocument();
    });
  });

  it('preserves search term when filters are applied', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search salons/i);
    await user.type(searchInput, 'hair salon');

    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);

    const locationInput = screen.getByPlaceholderText(/enter location/i);
    await user.type(locationInput, 'Downtown');

    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);

    expect(searchInput).toHaveValue('hair salon');
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'hair salon',
        location: 'Downtown'
      })
    );
  });

  it('shows recent searches dropdown', async () => {
    const { user } = render(<SalonSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search salons/i);
    await user.click(searchInput);

    expect(screen.getByText(/recent searches/i)).toBeInTheDocument();
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

    const { user } = render(<SalonSearch {...defaultProps} />);

    const nearbyButton = screen.getByRole('button', { name: /near me/i });
    await user.click(nearbyButton);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 40.7128,
          longitude: -74.0060
        })
      );
    });
  });
});
