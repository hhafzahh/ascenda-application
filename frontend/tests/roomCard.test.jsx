import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RoomCard from "../src/components/RoomCard/RoomCard";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom"

const mockedUsedNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedUsedNavigate,
}));

const Room = {
  roomDescription: "Deluxe King Room",
  long_description:
    "<strong>1 King Bed</strong> Enjoy a spacious 400-sq-foot room. Bed type: King",
  free_cancellation: true,
  images: [
    { url: "https://plus.unsplash.com/premium_photo-1661964071015-d97428970584?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aG90ZWx8ZW58MHx8MHx8fDA%3D" },
    { url: "https://media.istockphoto.com/id/104731717/photo/luxury-resort.jpg?s=612x612&w=0&k=20&c=cODMSPbYyrn1FHake1xYz9M8r15iOfGz9Aosy9Db7mI=" },
  ],
  converted_price: 500.0,
  base_rate_in_currency: 550.0,
  points: 1000,
  amenities: [
    "King Bed",
    "Pillow menu",
    "Linen",
    "Two pillows",
    "Private bathroom",
    "Shower",
    "Toiletries",
    "Five showers",
    "WiFi",
    "TV",
    "Desk",
    "Tablet"
  ],
};

const searchParams = {
  checkin: "2025-10-01",
  checkout: "2025-10-03",
  guests: "2",
};

const hotelId = "SG60";

function renderRoomCard(room = Room) {
  return render(
    <BrowserRouter>
      <RoomCard room={Room} searchParams={searchParams} hotelId={hotelId} />
    </BrowserRouter>
  );
}

describe("Rendering RoomCard Component", () => {
  beforeEach(() => {
    mockedUsedNavigate.mockClear();
  });

  test("renders all room info correctly", () => {
    renderRoomCard();
    expect(screen.getByText(/Deluxe King Room/i)).toBeInTheDocument();
    expect(screen.getByText(/1 King Bed/i)).toBeInTheDocument();
    expect(screen.getByText(/Free/i)).toBeInTheDocument();
    expect(screen.getByText(/37.2 m²/i)).toBeInTheDocument(); // 400 * 0.092903 to change to meter square
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.getByText(/1,000 points/i)).toBeInTheDocument();

    expect(screen.getByText("King Bed")).toBeInTheDocument();
    expect(screen.getByText("Pillow menu")).toBeInTheDocument();
    expect(screen.getByText("Linen")).toBeInTheDocument();
    expect(screen.getByText("Private bathroom")).toBeInTheDocument();
    expect(screen.getByText("Shower")).toBeInTheDocument();
    expect(screen.getByText("Toiletries")).toBeInTheDocument();
    expect(screen.getByText("WiFi")).toBeInTheDocument();
    expect(screen.getByText("TV")).toBeInTheDocument();
    expect(screen.getByText("Desk")).toBeInTheDocument();
    
    expect(screen.queryByText("Two pillows")).not.toBeInTheDocument();
    expect(screen.queryByText("Five showers")).not.toBeInTheDocument();
    expect(screen.queryByText("Tablet")).not.toBeInTheDocument();
  });

  test("clicking 'Select Room' navigates with correct data", () => {
    renderRoomCard();

    const button = screen.getByRole("button", { name: /select room/i });
    fireEvent.click(button);

    expect(mockedUsedNavigate).toHaveBeenCalledWith(
  "/booking",
  expect.objectContaining({
    state: expect.objectContaining({
      hotel: expect.objectContaining({ id: "SG60" }),
      room: expect.any(Object),
      searchParams: expect.any(Object),
    }),
  })
)
});

  test("carousel next/prev buttons work correctly", () => {
    renderRoomCard();

    const img = screen.getByAltText(/Image 1/i);
    expect(img).toHaveAttribute("src", Room.images[0].url);

    const nextBtn = screen.getByRole("button", { name: ">" });
    fireEvent.click(nextBtn);

    const updatedImg = screen.getByAltText(/Image 2/i);
    expect(updatedImg).toHaveAttribute("src", Room.images[1].url);

    const prevBtn = screen.getByRole("button", { name: "<" });
    fireEvent.click(prevBtn);

    const backToFirstImg = screen.getByAltText(/Image 1/i);
    expect(backToFirstImg).toHaveAttribute("src", Room.images[0].url);
  });
});

describe("Room Card Dealing with Missing Data", () => {
    test("renders fallback image if image fails to load", () => {
    renderRoomCard();

    const img = screen.getByRole("img");
    fireEvent.error(img);

    expect(img.src).toMatch(/placeholder\.com/);
  });

    test("renders no card if room object is null", () => {
        const { container } = render(<RoomCard room={null} />);
        expect(container.firstChild).toBeNull();
    })
})