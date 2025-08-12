// This file tests how all the pieces of the HotelDetails page work together
import '@testing-library/jest-dom'; 
import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HotelDetails from '../src/pages/HotelDetails/HotelDetails.jsx';
import axios from 'axios';

// Mock axios so we don't make real API calls during tests
jest.mock('axios');

// The react-leaflet map library doesn't play nice with Jest, so we need to mock it
// We replace the map components with simple div elements that we can check in our tests
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
}));

// Instead of testing the actual components, we create simplified versions
// that help us verify that:
// 1. The right data is being passed down
// 2. User interactions work correctly
// 3. Components render in the right order with the right info

// Mock of the hotel overview section - shows hotel name and has a "See Rooms" button
jest.mock('../src/components/HotelOverview/HotelOverview.jsx', () => (props) => (
  <div data-testid="hotel-overview">
    HotelOverview: {props.hotel?.name}
    {props.hotelMetadata && (
      <span data-testid="hotel-metadata">Meta for {props.hotelMetadata.id}</span>
    )}
    <button onClick={props.onSelectRoom} aria-label="see-rooms">See Rooms</button>
  </div>
));

// Simple version of the rooms section - just shows which hotel's rooms we're looking at
jest.mock('../src/pages/HotelRooms', () => (props) => (
  <div data-testid="hotel-rooms">HotelRooms for {props.hotelDetails?.name}</div>
));

// Mock gallery that just shows the hotel name - enough to verify it got the right data
jest.mock('../src/components/PhotoGallery/PhotoGallery.jsx', () => (props) => (
  <div data-testid="photo-gallery">PhotoGallery: {props.hotel?.name}</div>
));

// This helper function makes our tests cleaner and more readable
// Instead of setting up the router in every test, we just call renderAt('/some/path')
// It also lets us pass initial state, just like when a user navigates in the real app
function renderAt(pathname, state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname, state }]}>
      <Routes>
        <Route path="/hotels/:hotelId" element={<HotelDetails />} />
      </Routes>
    </MemoryRouter>
  );
}

// Some environments might not support scrollIntoView (like jsdom)
// So we create a dummy version to avoid errors
beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

// Start fresh before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('HotelDetails Integration Journeys', () => {
  // This test simulates when someone opens a direct link to a hotel page
  // Like if they bookmarked it or got a link from a friend
  test('deep link: fetches hotel by URL param when no state is provided', async () => {
    // Pretend the API returns info about a hotel
    axios.get.mockResolvedValueOnce({ data: { id: 'H123', name: 'Direct Hotel' } });

    // We need to wrap rendering in act() because it triggers async effects
    await act(async () => {
      renderAt('/hotels/H123');
    });

    // Check that all parts of the page show the right hotel name
    // The findByTestId (instead of getByTestId) waits for async content to load
    expect(await screen.findByTestId('photo-gallery')).toHaveTextContent('Direct Hotel');
    expect(screen.getByTestId('hotel-overview')).toHaveTextContent('Direct Hotel');
    expect(screen.getByTestId('hotel-rooms')).toHaveTextContent('Direct Hotel');

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3001/api/hotelproxy/hotels/uid/H123'
    );
  });

  // This test verifies that when a user navigates to the hotel details page with existing state
  // (like clicking a hotel card in search results), we:
  // 1. Use the hotel data from state without making an API call
  // 2. Fetch additional metadata about hotels in the same destination
  // This helps show similar hotels in the area without requiring a separate API call
  test('metadata: fetches destination metadata when destinationId exists in state', async () => {
    // Mock the metadata API to return a list of hotels in the destination
    // Including both the current hotel and others nearby
    axios.get.mockResolvedValueOnce({
      data: [
        { id: 'H999', name: 'Other' },
        { id: 'H321', name: 'Meta Match' }
      ]
    });

    // Simulate navigation from search results by providing initial state
    await act(async () => {
      renderAt('/hotels/H321', {
        hotel: { id: 'H321', name: 'State Hotel' },
        searchParams: { destinationId: 'D55' }
      });
    });

  
    expect(await screen.findByTestId('photo-gallery')).toHaveTextContent('State Hotel');
    expect(screen.getByTestId('hotel-overview')).toHaveTextContent('State Hotel');
    expect(screen.getByTestId('hotel-metadata')).toHaveTextContent('H321');

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3001/api/hotelproxy/hotels',
      { params: { destination_id: 'D55' } }
    );
  });

  // This test verifies that the page handles API failures gracefully by:
  // 1. Showing a user-friendly error message
  // 2. Not rendering any hotel components that would need the API data
  // This prevents showing partial or broken content to users when things go wrong
  test('error state: shows error when API fails', async () => {
    // Silence console.error during this test since we're expecting an error
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Simulate a network failure when trying to fetch hotel data
    axios.get.mockRejectedValueOnce(new Error('Network down'));

    await act(async () => {
      renderAt('/hotels/H777');
    });

    // Verify that:
    // 1. The error message is shown to the user
    // 2. None of the hotel detail components are rendered without data
    expect(await screen.findByText(/failed to load hotel information/i)).toBeInTheDocument();
    expect(screen.queryByTestId('photo-gallery')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hotel-overview')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hotel-rooms')).not.toBeInTheDocument();

    errorSpy.mockRestore();
  });

  // This test verifies that the loading state works correctly by:
  // 1. Showing a loading indicator while data is being fetched
  // 2. Replacing the loading state with content once data arrives
  // This ensures users know something is happening during slow network conditions
  test('loading → content transition', async () => {
    // Create a Promise we can resolve manually to control exactly when the API responds
    let resolveFn;
    const deferred = new Promise((res) => { resolveFn = res; });
    axios.get.mockImplementationOnce(() => deferred);

    await act(async () => {
      renderAt('/hotels/H888');
    });

    // First, verify that the loading state is shown
    expect(await screen.findByText(/loading hotel details/i)).toBeInTheDocument();

    // Simulate the API call completing
    await act(async () => {
      resolveFn({ data: { id: 'H888', name: 'Slow Hotel' } });
    });

    // Verify that:
    // 1. The loading message disappears
    // 2. The actual hotel content is shown
    await waitFor(() => {
      expect(screen.queryByText(/loading hotel details/i)).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('photo-gallery')).toHaveTextContent('Slow Hotel');
  });

  // This test verifies that the "See Rooms" button works correctly by:
  // 1. Loading the hotel details page
  // 2. Finding and clicking the "See Rooms" button
  // 3. Checking that the page scrolls to show the rooms section
  // This ensures the smooth scrolling navigation feature works as expected
  test('interaction: clicking "See Rooms" scrolls to rooms section', async () => {
    // Set up test data and a spy to watch for scrolling behavior
    axios.get.mockResolvedValueOnce({ data: { id: 'H432', name: 'Scroll Hotel' } });
    const scrollSpy = jest.spyOn(Element.prototype, 'scrollIntoView');

    await act(async () => {
      renderAt('/hotels/H432');
    });

    // Wait for the overview section to load since it contains our button
    await screen.findByTestId('hotel-overview');

    // Simulate clicking the "See Rooms" button
    fireEvent.click(screen.getByRole('button', { name: /see-rooms/i }));

    // Verify that the page attempted to scroll to the rooms section
    expect(scrollSpy).toHaveBeenCalled();
  });

  // This test verifies that changing the hotel ID in the URL works correctly by:
  // 1. Loading hotel A's details
  // 2. Changing to hotel B's URL
  // 3. Verifying that hotel B's details are fetched and displayed
  // This simulates a user navigating between different hotel pages
  test('route param change: re-fetches when hotelId changes', async () => {
    // Set up response for the first hotel
    axios.get.mockResolvedValueOnce({ data: { id: 'HA', name: 'Hotel A' } });

    let view;
    await act(async () => {
      view = renderAt('/hotels/HA');
    });
    expect(await screen.findByTestId('photo-gallery')).toHaveTextContent('Hotel A');

    // Set up response for the second hotel
    axios.get.mockResolvedValueOnce({ data: { id: 'HB', name: 'Hotel B' } });

    // Simulate navigation to a different hotel page
    await act(async () => {
      view.unmount();
      view = renderAt('/hotels/HB');
    });

    // Verify that the new hotel's content is shown
    expect(await screen.findByTestId('photo-gallery')).toHaveTextContent('Hotel B');

    // Verify that the correct API calls were made for both hotels
    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3001/api/hotelproxy/hotels/uid/HA'
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3001/api/hotelproxy/hotels/uid/HB'
    );
  });
});
