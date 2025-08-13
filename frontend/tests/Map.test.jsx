// Tests for the Map component which displays hotel location and details
import '@testing-library/jest-dom';               // Provides DOM-specific test matchers
import React from 'react';
import { render, screen } from '@testing-library/react';

// Import the Map component from its location in the project structure
import Map from '../src/components/MapCard/Map.jsx';

// Create a mock Minimap component to isolate Map component testing
// Stores passed props in data-props attribute for verification
jest.mock('../src/components/Minimap', () => (props) => (
  <div data-testid="minimap-proxy" data-props={JSON.stringify(props)} />
));

describe('Map component', () => {
  // Prevent console.log noise during test execution
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  afterAll(() => logSpy.mockRestore());

  // Verify basic text content renders correctly
  test('renders header text', () => {
    render(<Map lat={1.3} lng={103.8} hotelName="Ritz" price="200.00" />);
    expect(screen.getByText(/On the map/i)).toBeInTheDocument();
    expect(screen.getByText(/See where we're located/i)).toBeInTheDocument();
  });

  // Verify Minimap receives correct props when valid coordinates provided
  test('renders Minimap when valid coordinates are provided', () => {
    render(<Map lat={1.3} lng={103.8} hotelName="Ritz" price="200.00" />);
    // Check if Minimap proxy element exists
    const proxy = screen.getByTestId('minimap-proxy');
    expect(proxy).toBeInTheDocument();

    // Extract and verify props passed to Minimap
    const passed = JSON.parse(proxy.getAttribute('data-props'));
    expect(passed.lat).toBe(1.3);
    expect(passed.lng).toBe(103.8);
    expect(passed.hotelName).toBe('Ritz');
    expect(passed.price).toBe('200.00');
  });

  // Verify fallback behavior when coordinates are not provided
  test('shows fallback and hides Minimap when coordinates are missing', () => {
    const { queryByTestId } = render(<Map hotelName="No Coords" price="150.00" />);
    // Check fallback message appears
    expect(screen.getByText(/No information available/i)).toBeInTheDocument();
    // Ensure Minimap is not rendered
    expect(queryByTestId('minimap-proxy')).toBeNull();
  });

  // Test robustness against various invalid coordinate values
  test('treats non-finite values as missing coordinates (null, undefined, NaN)', () => {
    // Test cases covering all possible invalid coordinate combinations
    const cases = [
      { lat: null, lng: 103.8 },
      { lat: 1.3, lng: null },
      { lat: undefined, lng: 103.8 },
      { lat: 1.3, lng: undefined },
      { lat: NaN, lng: 103.8 },
      { lat: 1.3, lng: NaN },
    ];

    for (const c of cases) {
      // Test each invalid coordinate case
      const { unmount, queryByTestId } = render(
        <Map {...c} hotelName="Weird Coords" price="123.45" />
      );
      // Verify fallback message shows for each case
      expect(screen.getByText(/No information available/i)).toBeInTheDocument();
      // Verify Minimap is hidden for invalid coordinates
      expect(queryByTestId('minimap-proxy')).toBeNull();
      unmount();
    }
  });

  // Verify edge case: zero coordinates are valid
  test('does not render fallback when both coordinates are finite numbers', () => {
    const { queryByText } = render(<Map lat={0} lng={0} hotelName="Origin" price="0.00" />);
    // Check fallback message is not shown for valid coordinates
    expect(queryByText(/No information available/i)).toBeNull();
    // Verify Minimap renders with zero coordinates
    expect(screen.getByTestId('minimap-proxy')).toBeInTheDocument();
  });
});
