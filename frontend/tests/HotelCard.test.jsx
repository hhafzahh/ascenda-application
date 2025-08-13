import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HotelCard from "../src/components/HotelCard";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";

// Mocking useNavigate
const mockedUsedNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedUsedNavigate,
}));

const mockHotel = {
  id: "obxM",
  name: "Mercure Singapore Tyrwhitt",
  address: "165 Tyrwhitt Road",
  price: 1679.68,
  rating: 4,
  trustyouScore: 4.3,
  image_details: {
    prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/obxM/",
    suffix: ".jpg",
  },
};

const searchParams = {
  checkin: "2025-10-01",
  checkout: "2025-10-03",
  guests: "2",
};

test("renders hotel card with correct details", () => {
  render(
    <BrowserRouter>
      <HotelCard hotel={mockHotel} searchParams={searchParams} />
    </BrowserRouter>
  );

  // Assert hotel name is displayed
  expect(screen.getByText(/Mercure Singapore Tyrwhitt/)).toBeInTheDocument();

  // Assert hotel address is displayed
  expect(screen.getByText(/165 Tyrwhitt Road/)).toBeInTheDocument();

  // Assert hotel price is displayed
  expect(screen.getByText(/SGD 1679.68/)).toBeInTheDocument();

  // Assert rating (4 full stars and 1 empty star)
  const fullStars = screen.getAllByText("★");
  expect(fullStars).toHaveLength(4); // 4 full stars
  const emptyStars = screen.getAllByText("☆");
  expect(emptyStars).toHaveLength(1); // 1 empty star

  // Assert hotel image is displayed
  const img = screen.getByAltText("Mercure Singapore Tyrwhitt");
  expect(img).toHaveAttribute(
    "src",
    "https://d2ey9sqrvkqdfs.cloudfront.net/obxM/0.jpg"
  );
});

//checks if hotel card naviages to the path with the object
test("clicking on hotel card triggers navigate function", () => {
  render(
    <BrowserRouter>
      <HotelCard hotel={mockHotel} searchParams={searchParams} />
    </BrowserRouter>
  );

  // Find the hotel card div by its dynamic id (e.g., hotel-obxM)
  const hotelCard = screen.getByText(/Mercure Singapore Tyrwhitt/);
  fireEvent.click(hotelCard);

  // Assert that the navigate function is called with the correct path and state
  expect(mockedUsedNavigate).toHaveBeenCalledWith("/hotels/obxM", {
    state: { hotel: mockHotel },
  });
});

test("displays fallback image when hotel image is missing", () => {
  const hotelWithoutImage = {
    id: "obxM",
    name: "Mercure Singapore Tyrwhitt",
    image_details: null,
    price: 1679.68,
    rating: 4,
    trustyouScore: 4.3,
    address: "165 Tyrwhitt Road",
  };

  render(
    <BrowserRouter>
      <HotelCard
        hotel={hotelWithoutImage}
        searchParams={{
          checkin: "2025-10-01",
          checkout: "2025-10-03",
          guests: "2",
        }}
      />
    </BrowserRouter>
  );

  const img = screen.getByAltText("Mercure Singapore Tyrwhitt");
  expect(img).toHaveAttribute(
    "src",
    "https://placehold.co/600x400?text=No\nImage"
  );
});
