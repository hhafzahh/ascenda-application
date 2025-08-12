// This file tests the PhotoGallery component, which shows a hotel's photos in:
// 1. A main preview image
// 2. A grid of thumbnails
// 3. A full-screen gallery modal
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import PhotoGallery from '../src/components/PhotoGallery/PhotoGallery.jsx';

// The real react-image-gallery package is quite heavy and complex
// Instead of using it in tests, we replace it with a simple div that:
// 1. Shows how many images it received (data-count)
// 2. Can be clicked (onClick)
// This lets us test our component's logic without dealing with the gallery's internals
jest.mock('react-image-gallery', () => (props) => (
  <div
    data-testid="image-gallery"
    data-count={props.items?.length ?? 0}
    onClick={props.onClick}
  >
    ImageGallery
  </div>
));

// (Optional) if CSS causes issues despite moduleNameMapper, you can uncomment:
// jest.mock('react-image-gallery/styles/css/image-gallery.css', () => ({}));
// jest.mock('../src/components/PhotoGallery/PhotoGallery.css', () => ({}));

// Helper function to create test hotel data
// Our API returns image URLs in parts (prefix + number + suffix)
// For example: "https://cdn.example.com/hotel/1.jpg"
// This makes it easy to load multiple numbered images
const mkHotel = (overrides = {}) => ({
  image_details: {
    prefix: 'https://cdn.example.com/hotel/',
    suffix: '.jpg',
    count: 10, // Most hotels have at least 10 photos
  },
  ...overrides,
});

describe('PhotoGallery', () => {
  // First, let's handle the error cases.
  // If we don't have a hotel at all, we shouldn't try to render anything
  test('returns null when hotel is missing', () => {
    const { container } = render(<PhotoGallery />);
    expect(container.firstChild).toBeNull();
  });

  // Similarly, we need valid image data to show anything
  // This test checks two cases:
  // 1. No image_details object at all
  // 2. image_details exists but says there are 0 images
  test('returns null when image_details missing or count is 0', () => {
    // Case 1: Empty hotel object
    const { container: c1 } = render(<PhotoGallery hotel={{}} />);
    expect(c1.firstChild).toBeNull();

    // Case 2: Hotel with image_details but no actual images
    const { container: c2 } = render(
      <PhotoGallery hotel={mkHotel({ image_details: { prefix: 'x/', suffix: '.png', count: 0 } })} />
    );
    expect(c2.firstChild).toBeNull();
  });

  // This test verifies our main gallery layout:
  // - A large main preview image (always the first photo)
  // - Up to 6 thumbnail previews on the side
  // - A "See All Photos" overlay on the last thumbnail
  test('renders main image and up to 6 thumbnails with correct URLs', async () => {
    // Create a hotel with plenty of photos to fill the gallery
    const hotel = mkHotel({
      image_details: { prefix: 'https://img.cdn/h/', suffix: '.jpeg', count: 12 },
    });

    render(<PhotoGallery hotel={hotel} />);

    // The gallery might take a moment to load, so we need to wait for it
    // We look for the main preview image as our signal that everything's ready
    const main = await screen.findByAltText('Main Preview');
    // Image 0 should be the main preview
    expect(main).toHaveAttribute('src', 'https://img.cdn/h/0.jpeg');

    // Next to the main image, we should see thumbnails for images 1-6
    // We don't show ALL photos here - just enough to give users a preview
    const thumbs = screen.getAllByAltText(/Preview \d+/);
    expect(thumbs).toHaveLength(6);  // Maximum of 6 thumbnails
    expect(thumbs[0]).toHaveAttribute('src', 'https://img.cdn/h/1.jpeg');  // First thumbnail
    expect(thumbs[5]).toHaveAttribute('src', 'https://img.cdn/h/6.jpeg');  // Last thumbnail

    // Since there are more photos than we can show (12 > 7),
    // we should see a "See All Photos" overlay that users can click
    expect(screen.getByText(/See All Photos/i)).toBeInTheDocument();
  });

  // When we have fewer photos, we should adapt the UI appropriately
  // No need for a "See All" button if you can already see them all!
  test('does not show overlay when fewer than 7 images exist', async () => {
    const hotel = mkHotel({
      image_details: { prefix: '/p/', suffix: '.jpg', count: 5 },
    });

    render(<PhotoGallery hotel={hotel} />);

    // Wait for the gallery to load
    await screen.findByAltText('Main Preview');
    const thumbs = screen.getAllByAltText(/Preview \d+/);
    expect(thumbs).toHaveLength(4); // indices 1..4
    expect(screen.queryByText(/See All Photos/i)).toBeNull();
  });

  // The main interaction in our gallery is opening the full-screen view
  // This should happen when clicking the main image, and users should
  // be able to close it easily
  test('clicking main image opens gallery modal; close button hides it', async () => {
    render(<PhotoGallery hotel={mkHotel()} />);

    // Wait for gallery to load, then click the main image
    const main = await screen.findByAltText('Main Preview');
    fireEvent.click(main);

    // When the modal opens, it should:
    // 1. Show our mocked image gallery component
    const modal = screen.getByTestId('image-gallery');
    expect(modal).toBeInTheDocument();
    // 2. Pass all 10 images to the gallery component
    expect(modal).toHaveAttribute('data-count', '10');

    // Users should be able to close the modal with the ✕ button
    fireEvent.click(screen.getByRole('button', { name: /✕/ }));
    // The modal should smoothly animate out
    await waitFor(() => {
      expect(screen.queryByTestId('image-gallery')).toBeNull();
    });
  });

  // Users should be able to open the full gallery from any photo,
  // not just the main preview
  test('clicking any thumbnail opens gallery modal', async () => {
    render(<PhotoGallery hotel={mkHotel()} />);

    // Wait for gallery to load
    await screen.findByAltText('Main Preview');
    // Find all the thumbnail images
    const thumbs = screen.getAllByAltText(/Preview \d+/);
    // Click the first thumbnail
    fireEvent.click(thumbs[0]);

    // The full gallery modal should open
    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
  });

  // When viewing the full gallery modal, users should be able to click
  // anywhere in the modal to close it (not just the ✕ button)
  test('clicking inside ImageGallery triggers onClick and closes modal', async () => {
    render(<PhotoGallery hotel={mkHotel()} />);

    // First, open the modal
    const main = await screen.findByAltText('Main Preview');
    fireEvent.click(main);
    const gallery = screen.getByTestId('image-gallery');

    // Click anywhere in the gallery component
    // Our mock forwards the click event, which should trigger the modal to close
    fireEvent.click(gallery);

    // The modal should smoothly disappear
    await waitFor(() => {
      expect(screen.queryByTestId('image-gallery')).toBeNull();
    });
  });

  // The gallery should respond properly when the hotel data changes
  // This might happen if:
  // - User navigates to a different hotel
  // - More photos are loaded
  // - Photos are updated
  test('updates when hotel prop changes (image count changes)', async () => {
    // Start with 8 photos
    const { rerender } = render(
      <PhotoGallery hotel={mkHotel({ image_details: { prefix: '/a/', suffix: '.png', count: 8 } })} />
    );

    await screen.findByAltText('Main Preview');
    let thumbs = screen.getAllByAltText(/Preview \d+/);
    // With 8 photos total:
    // - 1 main photo
    // - Up to 6 thumbnails
    // So we should see exactly 6 thumbnails
    expect(thumbs).toHaveLength(6);

    // Now switch to a hotel with fewer photos
    rerender(
      <PhotoGallery hotel={mkHotel({ image_details: { prefix: '/b/', suffix: '.png', count: 3 } })} />
    );

    // Wait for the main image to update to the new URL
    await screen.findByAltText('Main Preview');
    expect(screen.getByAltText('Main Preview')).toHaveAttribute('src', '/b/0.png');

    // With 3 photos total:
    // - 1 main photo
    // - 2 thumbnails (3-1 = 2)
    // And no "See All" overlay since all photos are visible
    thumbs = screen.getAllByAltText(/Preview \d+/);
    expect(thumbs).toHaveLength(2);
    expect(screen.queryByText(/See All Photos/i)).toBeNull();
  });
});
