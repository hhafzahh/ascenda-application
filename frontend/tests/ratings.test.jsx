import React from 'react';
import { render, screen } from '@testing-library/react';
import Ratings from '../src/components/Rating/Ratings';
import "@testing-library/jest-dom";

describe('Ratings Component Rendering', () => {
  test('renders nothing when hotel is null', () => {
    const { container } = render(<Ratings hotel={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('displays correct overall score and label', () => {
    const mockHotel = {
        name: 'ST Residences Novena',
        rating: 4,
        amenities_ratings: [
            { name: 'Food', score: 100 },
            { name: 'WiFi', score: 100 },
            { name: 'Service', score: 99 },
            { name: 'Amenities', score: 98 },
            { name: 'Location', score: 97 },
            { name: 'Comfort', score: 92 },
            { name: 'Breakfast', score: 80 },
            { name: 'Room', score: 79 },
        ]
        };
    render(<Ratings hotel={mockHotel} />);

    // Overall score is (100 + 100 + 99 +98 + 97 + 92 + 80 + 79) / 8 / 10 = 9.3125 -> toFixed(1), so 9.3
    expect(screen.getByText('9.3')).toBeInTheDocument();
    expect(screen.getByText('/10')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('How guests rated us')).toBeInTheDocument();
  });

  test('renders amenity rating bars correctly', () => {
    const mockHotel = {
      amenities_ratings: [
        { name: 'WiFi', score: 90 },
        { name: 'TV', score: 60 }
      ]
    };
    render(<Ratings hotel={mockHotel} />);
    
    // Check amenity names
    expect(screen.getByText('WiFi')).toBeInTheDocument();
    expect(screen.getByText('TV')).toBeInTheDocument();

    // Check scores (divided by 10 in UI)
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  test('caps score at 10 and does not crash on bad data', () => {
    const mockHotel = {
      amenities_ratings: [
        { name: 'Shower', score: 120 }, // Should cap to 10
        { name: 'Toilet', score: -20 }  // Should floor to 0
      ]
    };
    render(<Ratings hotel={mockHotel} />);

    expect(screen.getByText('10')).toBeInTheDocument(); // capped
    expect(screen.getByText('0')).toBeInTheDocument();  // floored
  });
});

describe("Robust Boundary Value Testing", () => {
    test('rounds overall score correctly at boundary values', () => {
    const mockHotel = {
        amenities_ratings: [
        { name: 'Food', score: 94.94 }, // 9.494 -> should round to 9.5
        { name: 'Service', score: 94.96 }, // 9.496 -> should round to 9.5
        ]
    };
    render(<Ratings hotel={mockHotel} />);
    expect(screen.getByText('9.5')).toBeInTheDocument();
    expect(screen.queryByText('9.4')).not.toBeInTheDocument();
    });

    test('displays correct score at exact 0 and 100', () => {
    const mockHotel = {
        amenities_ratings: [
        { name: 'WiFi', score: 0 },
        { name: 'TV', score: 100 }
        ]
    };
    render(<Ratings hotel={mockHotel} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    });

    test('handles scores just outside valid range gracefully', () => {
    const mockHotel = {
        amenities_ratings: [
        { name: 'Location', score: 100.1 },
        { name: 'Comfort', score: -0.1 }
        ]
    };
    render(<Ratings hotel={mockHotel} />);
    expect(screen.getByText('10')).toBeInTheDocument(); // 100.1 should be capped
    expect(screen.getByText('0')).toBeInTheDocument();  // -0.1 should be floored
    });

    test('handles scores just inside valid range gracefully', () => {
    const mockHotel = {
        amenities_ratings: [
        { name: 'Location', score: 99.9 },
        { name: 'Comfort', score: 0.1 }
        ]
    };
    render(<Ratings hotel={mockHotel} />);
    expect(screen.getByText('9.99')).toBeInTheDocument(); // 99.9 should be capped
    expect(screen.getByText('0.01')).toBeInTheDocument();  // 0.1 should be floored
    });

    test('handles missing amenities_ratings from API (no grid, fallback label)', () => {
      // API returns hotel object without `amenities_ratings`
      const mockHotel = {
        name: 'ST Residences Novena',
        rating: 4,
        // amenities_ratings: undefined
      };

      const { container } = render(<Ratings hotel={mockHotel} />);

      // Should show fallback label for overall rating
      expect(screen.getByText(/No ratings available/i)).toBeInTheDocument();

      // Grid should not render when there are no amenities
      expect(container.querySelector('.amenities-ratings-grid')).toBeNull();

      // Also ensure no individual rating bars are rendered
      expect(container.querySelector('.rating-bar-fill')).toBeNull();

      // The left value should be empty (overall score is null), but the "/10" suffix remains
      expect(screen.getByText('/10')).toBeInTheDocument();
    });


})