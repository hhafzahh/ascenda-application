// Import testing utilities and the component we're testing
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import HotelOverview from '../src/components/HotelOverview/HotelOverview.jsx';

// Instead of using real components that might be complex or have their own dependencies,
// we create simple mock versions that just show us what props they received.
// This helps us focus on testing just the HotelOverview component's logic.

// Mock the Ratings component - converts its props to a string we can check in our tests
jest.mock('../src/components/Rating/Ratings', () => (props) => (
  <div data-testid="ratings-proxy" data-props={JSON.stringify(props)} />
));

// Mock the Amenities component - same approach as Ratings
jest.mock('../src/components/AmenitiesCard/amenities', () => (props) => (
  <div data-testid="amenities-proxy" data-props={JSON.stringify(props)} />
));

// Mock the Minimap - we don't want to deal with actual maps in our tests
jest.mock('../src/components/Minimap', () => (props) => (
  <div data-testid="minimap-proxy" data-props={JSON.stringify(props)} />
));

// Prevent console.log from cluttering our test output
const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
afterAll(() => spyLog.mockRestore());

// This is our template for a typical hotel object.
// We use this as a base and can override specific properties in our tests.
// It's based on a real hotel (The Fullerton) to make our tests more realistic.
const baseHotel = {
  id: 'diH7',
  imageCount: 167,
  latitude: 1.28624,              // Location coordinates for the hotel
  longitude: 103.852889,          // (these are actual Fullerton Hotel coordinates)
  name: 'The Fullerton Hotel Singapore',
  address: '1 Fullerton Square',
  rating: 5,
  amenities_ratings: [            // Detailed ratings for different aspects of the hotel
    { name: 'Location', score: 96 },
    { name: 'Wellness', score: 95 },
    { name: 'Service', score: 91 },
    { name: 'WiFi', score: 87 },
    { name: 'Vibe', score: 86 },
    { name: 'Breakfast', score: 84 },
    { name: 'Amenities', score: 81 },
    { name: 'Food', score: 80 },
    { name: 'Room', score: 77 },
    { name: 'Comfort', score: 62 }
  ],
  description: `Pamper yourself with a visit to the spa, which offers massages and facials. You're sure to appreciate the recreational amenities, including an outdoor pool, a steam room, and a fitness center. Additional features at this Colonial hotel include complimentary wireless internet access, concierge services, and gift shops/newsstands.

Take advantage of the hotel's room service (during limited hours). Full breakfasts are available daily from 6:30 AM to 10:30 AM for a fee. Children aged 5 and younger eat free breakfast.

Featured amenities include express check-out, dry cleaning/laundry services, and a 24-hour front desk. Event facilities at this hotel consist of a conference center and 7 meeting rooms. Free self parking is available onsite.

Make yourself at home in one of the 399 air-conditioned rooms featuring minibars and LCD televisions. Satellite television is provided for your entertainment. Bathrooms with separate bathtubs and showers feature deep soaking bathtubs and complimentary toiletries. Conveniences include phones, as well as laptop-compatible safes and desks.

Distances are displayed to the nearest 0.1 mile and kilometer. <br /> <p>Raffles Place - 0.2 km / 0.1 mi <br /> Asian Civilisations Museum - 0.3 km / 0.2 mi <br /> Merlion - 0.3 km / 0.2 mi <br /> Boat Quay - 0.4 km / 0.3 mi <br /> National Gallery Singapore - 0.5 km / 0.3 mi <br /> Esplanade Theatres - 0.6 km / 0.4 mi <br /> Former City Hall - 0.6 km / 0.4 mi <br /> Peninsula Plaza - 0.9 km / 0.5 mi <br /> Clarke Quay Central - 0.9 km / 0.5 mi <br /> Clarke Quay Mall - 0.9 km / 0.5 mi <br /> Fort Canning Park - 0.9 km / 0.6 mi <br /> Marina Square - 0.9 km / 0.6 mi <br /> Central Fire Station - 0.9 km / 0.6 mi <br /> Raffles City - 1 km / 0.6 mi <br /> Marina Bay Financial Centre - 1.1 km / 0.7 mi <br /> </p><p>The nearest airports are:<br />Seletar Airport (XSP) - 18.8 km / 11.7 mi<br /> Singapore Changi Airport (SIN) - 21.4 km / 13.3 mi<br /> Senai International Airport (JHB) - 68.8 km / 42.7 mi<br /> </p><p>The preferred airport for The Fullerton Hotel Singapore is Singapore Changi Airport (SIN). </p>

With a stay at The Fullerton Hotel Singapore, you'll be centrally located in Singapore, within a 5-minute walk of Raffles Place and Merlion.  This luxury hotel is 0.7 mi (1.1 km) from Bugis Street Shopping District and 1.4 mi (2.2 km) from Marina Bay Sands Skypark.

Near Marina Bay Sands Casino`
};

// Helper function to create hotel objects for our tests
// It takes any overrides we want and merges them with our base hotel data
const mkHotel = (overrides = {}) => ({ ...baseHotel, ...overrides });

describe('HotelOverview (integration, real wiring with proxies)', () => {
  // This test checks that all the basic pieces of the hotel overview are shown correctly
  // and that the "Select Room" button works as expected
  test('renders header, category tag, main description and handles Select Room click', () => {
    // Set up a spy function to make sure the button click handler works
    const onSelectRoom = jest.fn();
    render(<HotelOverview hotel={mkHotel()} onSelectRoom={onSelectRoom} />);

    // First, check that the hotel name appears as a heading
    expect(screen.getByText('The Fullerton Hotel Singapore')).toBeInTheDocument();
    
    // Make sure we show what type of property this is (Hotel vs Resort, etc)
    expect(screen.getByText(/^Hotel$/)).toBeInTheDocument();

    // Verify that key parts of the description are visible
    // We use case-insensitive regex to be more flexible with text changes
    expect(screen.getByText(/Pamper yourself with a visit to the spa/i)).toBeInTheDocument();
    expect(screen.getByText(/With a stay at The Fullerton Hotel Singapore/i)).toBeInTheDocument();

    // Simulate a user clicking the "Select Room" button and verify it triggers the callback
    fireEvent.click(screen.getByRole('button', { name: /Select Room/i }));
    expect(onSelectRoom).toHaveBeenCalledTimes(1);
  });

  // Sometimes we get extra metadata about a hotel (like updated ratings)
  // This test makes sure we use that new data when available, but can fall back
  // to the basic hotel data when it's not
  test('uses hotelMetadata for Ratings when provided; falls back to hotel when absent', () => {
    const hotel = mkHotel();
    // Create some sample metadata with different ratings than our base hotel
    const hotelMetadata = {
      amenities_ratings: [
        { name: 'Pool', score: 88 },
        { name: 'Gym', score: 92 }
      ]
    };

    // First, render with both hotel data and metadata
    const { rerender } = render(
      <HotelOverview hotel={hotel} hotelMetadata={hotelMetadata} />
    );
    
    // Check that we're using the metadata ratings when available
    let ratingsProps = JSON.parse(
      screen.getByTestId('ratings-proxy').getAttribute('data-props')
    );
    expect(ratingsProps.hotel).toEqual(hotelMetadata);

    // Now render again without metadata to check the fallback behavior
    rerender(<HotelOverview hotel={hotel} />);
    ratingsProps = JSON.parse(
      screen.getByTestId('ratings-proxy').getAttribute('data-props')
    );
    // Make sure we fall back to the hotel's own ratings data
    expect(Array.isArray(ratingsProps.hotel.amenities_ratings)).toBe(true);
    expect(ratingsProps.hotel.amenities_ratings.length).toBeGreaterThan(0);
  });

  // The hotel description has different sections (amenities, location, etc)
  // This test checks that we split it correctly and show the right parts
  // in the right places
  test('splitDescription: BOTH markers → Amenities gets nearby chunk containing "Raffles Place"', () => {
    render(<HotelOverview hotel={mkHotel()} />);
    const amenitiesProps = JSON.parse(
      screen.getByTestId('amenities-proxy').getAttribute('data-props')
    );
    // Check that basic info is passed correctly
    expect(amenitiesProps.address).toBe('1 Fullerton Square');
    // Verify we extracted the nearby places section correctly
    expect(amenitiesProps.nearbyAmenities).toMatch(/Raffles Place/i);
    // Make sure we didn't include the airport information in the nearby places
    expect(amenitiesProps.nearbyAmenities).not.toMatch(/The nearest airports are:/i);
  });

  // The minimap is a key feature showing the hotel's location and price
  // This test ensures all that information is passed correctly
  test('Map: valid coordinates render Minimap proxy with correct props (hotelName, coords, price)', () => {
    // Create a hotel with a specific price for testing
    const hotel = mkHotel({ price: '450.00' });
    render(<HotelOverview hotel={hotel} />);
    const mm = screen.getByTestId('minimap-proxy');
    const props = JSON.parse(mm.getAttribute('data-props'));

    // Check all the essential map properties
    expect(props.hotelName).toBe('The Fullerton Hotel Singapore');
    // We use toBeCloseTo for floating point coordinates to avoid precision issues
    expect(props.lat).toBeCloseTo(1.28624, 5);
    expect(props.lng).toBeCloseTo(103.852889, 5);
    expect(props.price).toBe('450.00');
  });

  // Sometimes we might not have location data for a hotel
  // In this case, we should show a friendly message instead of a broken map
  test('Map: missing coordinates shows fallback and no Minimap', () => {
    const hotel = mkHotel({ latitude: undefined, longitude: undefined });
    render(<HotelOverview hotel={hotel} />);
    // Make sure we don't try to render a map without coordinates
    expect(screen.queryByTestId('minimap-proxy')).toBeNull();
    // Verify we show a helpful message instead
    expect(screen.getByText(/No information available/i)).toBeInTheDocument();
  });

  // The coordinates (0,0) are actually valid - they represent a point in the ocean
  // near Africa. We shouldn't treat them as missing coordinates.
  test('Map: zero coordinates (0,0) are valid and render Minimap', () => {
    const hotel = mkHotel({ latitude: 0, longitude: 0 });
    render(<HotelOverview hotel={hotel} />);
    expect(screen.getByTestId('minimap-proxy')).toBeInTheDocument();
  });

  // Sometimes our data might be incomplete. This test makes sure our component
  // handles missing data gracefully instead of crashing
  test('robustness: missing fields (name, rating, address, description) do not crash', () => {
    // Create a hotel missing several important fields
    const hotel = mkHotel({
      name: undefined,
      rating: undefined,
      address: undefined,
      description: '' 
    });
    render(<HotelOverview hotel={hotel} />);

    // Check that we show a fallback name for hotels without one
    expect(screen.getByText(/Unnamed Property/i)).toBeInTheDocument();

    // Make sure the ratings component still gets some data to work with
    const ratingsProps = JSON.parse(
      screen.getByTestId('ratings-proxy').getAttribute('data-props')
    );
    expect(ratingsProps.hotel).toBeTruthy();

    // Verify that the amenities card handles missing data appropriately
    const amenitiesProps = JSON.parse(
      screen.getByTestId('amenities-proxy').getAttribute('data-props')
    );
    expect(amenitiesProps.nearbyAmenities).toBe('');
    expect(amenitiesProps.address).toBeUndefined();
  });

  // The price might not always be available (e.g., sold out rooms)
  // Make sure the map still works without it
  test('price absent: Minimap receives undefined price (still renders)', () => {
    const hotel = mkHotel({ price: undefined });
    render(<HotelOverview hotel={hotel} />);
    const props = JSON.parse(
      screen.getByTestId('minimap-proxy').getAttribute('data-props')
    );
    // The map should still render, just without a price tag
    expect(props.price).toBeUndefined();
  });
});
