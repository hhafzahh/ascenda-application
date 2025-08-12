// const axios = require("axios");
// const hotelApiService = require("../hotelAPIService");
// jest.setTimeout(30000); // Increase timeout for long-running tests
// const { pollUntilCompleted } = require("../hotelAPIService");
// jest.mock("axios");

// jest.mock("../hotelAPIService", () => ({
//   ...jest.requireActual("../hotelAPIService"),
//   pollUntilCompleted: jest.fn(), // Mock pollUntilCompleted function
// }));

// const mockHotelMetadata = {
//   id: "1",
//   name: "Hotel 1",
//   address: "Address 1",
//   rating: 4.5,
//   image_details: { prefix: "http://image", suffix: ".jpg" },
//   default_image_index: 0,
//   trustyouScore: 4.3,
//   description: "This is a test hotel",
//   amenities: ["WiFi", "Pool"],
//   price: 1000,
//   lowestPrice: 800,
//   roomsAvailable: 10,
//   freeCancellation: true,
//   latitude: 1.3122,
//   longitude: 103.8606,
// };

// const mockHotelPrices = [
//   {
//     id: "1",
//     converted_price: 1000,
//     lowest_converted_price: 800,
//     rooms_available: 10,
//     free_cancellation: true,
//   },
// ];

// const mockDestinationId = "RsBU";
// const mockCheckin = "2025-08-15";
// const mockCheckout = "2025-08-20";
// const mockGuests = "1";

// // Mock function for Express res object
// const mockRes = () => {
//   const res = {};
//   res.status = jest.fn().mockReturnValue(res);
//   res.json = jest.fn().mockReturnValue(res);
//   return res;
// };

// describe("Hotel API Tests - getHotelsByUid - withprice", () => {
//   beforeAll(() => {
//     jest.setTimeout(30000);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it("successfully fetches hotels and prices and merges data", async () => {
//     const req = {
//       params: { uid: mockDestinationId },
//       query: {
//         checkin: mockCheckin,
//         checkout: mockCheckout,
//         guests: mockGuests,
//       },
//     };

//     const res = mockRes();

//     // Mock the response for hotel metadata (e.g., list of hotels)
//     axios.get.mockResolvedValueOnce({ data: [mockHotelMetadata] });

//     // Mock the pollUntilCompleted function to return hotel prices
//     pollUntilCompleted.mockResolvedValueOnce({ hotels: mockHotelPrices });

//     // Call the function that needs to be tested
//     await hotelApiService.getHotelsByUid(req, res);

//     // Assert that the status code returned is 200
//     expect(res.status).toHaveBeenCalledWith(200);

//     // Assert that the merged hotel data contains the expected properties
//     const mergedHotel = {
//       id: "1",
//       name: "Hotel 1",
//       address: "Address 1",
//       rating: 4.5,
//       image_details: { prefix: "http://image", suffix: ".jpg" },
//       default_image_index: 0,
//       trustyouScore: 4.3,
//       description: "This is a test hotel",
//       amenities: ["WiFi", "Pool"],
//       price: 1000,
//       lowestPrice: 800,
//       roomsAvailable: 10,
//       freeCancellation: true,
//       latitude: 1.3122,
//       longitude: 103.8606,
//     };

//     // Verify the merged data is returned correctly
//     expect(res.json).toHaveBeenCalledWith([mergedHotel]);
//   });
// });
