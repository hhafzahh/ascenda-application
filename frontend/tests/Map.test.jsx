// tests/Map.test.jsx
import '@testing-library/jest-dom';               // <-- adds toBeInTheDocument, etc.
import React from 'react';
import { render, screen } from '@testing-library/react';

// IMPORTANT: match your real path (stack trace shows MapCard/Map.jsx)
import Map from '../src/components/MapCard/Map.jsx';

// Mock Minimap exactly as Map.jsx imports it: "../Minimap"
jest.mock('../src/components/Minimap', () => (props) => (
  <div data-testid="minimap-proxy" data-props={JSON.stringify(props)} />
));

describe('Map component', () => {
  // Silence console.log from the component during tests
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  afterAll(() => logSpy.mockRestore());

  test('renders header text', () => {
    render(<Map lat={1.3} lng={103.8} hotelName="Ritz" price="200.00" />);
    expect(screen.getByText(/On the map/i)).toBeInTheDocument();
    expect(screen.getByText(/See where we're located/i)).toBeInTheDocument();
  });

  test('renders Minimap when valid coordinates are provided', () => {
    render(<Map lat={1.3} lng={103.8} hotelName="Ritz" price="200.00" />);
    const proxy = screen.getByTestId('minimap-proxy');
    expect(proxy).toBeInTheDocument();

    const passed = JSON.parse(proxy.getAttribute('data-props'));
    expect(passed.lat).toBe(1.3);
    expect(passed.lng).toBe(103.8);
    expect(passed.hotelName).toBe('Ritz');
    expect(passed.price).toBe('200.00');
  });

  test('shows fallback and hides Minimap when coordinates are missing', () => {
    const { queryByTestId } = render(<Map hotelName="No Coords" price="150.00" />);
    expect(screen.getByText(/No information available/i)).toBeInTheDocument();
    expect(queryByTestId('minimap-proxy')).toBeNull();
  });

  test('treats non-finite values as missing coordinates (null, undefined, NaN)', () => {
    const cases = [
      { lat: null, lng: 103.8 },
      { lat: 1.3, lng: null },
      { lat: undefined, lng: 103.8 },
      { lat: 1.3, lng: undefined },
      { lat: NaN, lng: 103.8 },
      { lat: 1.3, lng: NaN },
    ];

    for (const c of cases) {
      const { unmount, queryByTestId } = render(
        <Map {...c} hotelName="Weird Coords" price="123.45" />
      );
      expect(screen.getByText(/No information available/i)).toBeInTheDocument();
      expect(queryByTestId('minimap-proxy')).toBeNull();
      unmount();
    }
  });

  test('does not render fallback when both coordinates are finite numbers', () => {
    const { queryByText } = render(<Map lat={0} lng={0} hotelName="Origin" price="0.00" />);
    expect(queryByText(/No information available/i)).toBeNull();
    expect(screen.getByTestId('minimap-proxy')).toBeInTheDocument();
  });
});
