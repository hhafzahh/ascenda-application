const axios = require("axios");
jest.mock("axios");

const hotelApiService = require("../hotelAPIService");

// mock express res
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Hotel Unit: hotelApiService.getHotels", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns data and passes query params through to axios", async () => {
    const req = {
      query: { destination_id: "RsBU", checkin: "2025-08-10", checkout: "2025-08-12", guests: "2|2" }
    };
    const res = mockRes();

    const fakeData = [{ id: "H1", name: "Test Hotel" }];
    axios.get.mockResolvedValueOnce({ data: fakeData });

    await hotelApiService.getHotels(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      "https://hotelapi.loyalty.dev/api/hotels",
      { params: req.query }
    );

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeData);
  });

  it("returns [] when API returns empty array", async () => {
    const req = { query: { destination_id: "RsBU" } };
    const res = mockRes();

    axios.get.mockResolvedValueOnce({ data: [] });

    await hotelApiService.getHotels(req, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns 500 with error message when axios fails", async () => {
    const req = { query: { destination_id: "RsBU" } };
    const res = mockRes();

    axios.get.mockRejectedValueOnce(new Error("boom"));

    await hotelApiService.getHotels(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to fetch hotel data",
      details: "boom",
    });
  });
});
describe("Hotel Unit: hotelApiService.getHotelsByUid", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("merges metadata and prices when polling completes immediately", async () => {
    const req = {
      params: { uid: "RsBU" },
      query: { checkin: "2025-08-10", checkout: "2025-08-12", guests: "2|2" },
    };
    const res = mockRes();

    const meta = [{
      id: "H1",
      name: "Hotel One",
      address: "1 Test Street",
      rating: 4.3,
      image_details: [{ url: "x.jpg" }],
      default_image_index: 0,
      trustyou: { score: { kaligo_overall: 4.6 } },
      description: "Nice place",
      amenities: ["WiFi", "Pool"],
      latitude: 1.23,
      longitude: 4.56,
    }];

    const pricesPayload = {
      completed: true,
      hotels: [{
        id: "H1",
        converted_price: 123.45,
        lowest_converted_price: 120.0,
        rooms_available: 5,
        free_cancellation: true,
      }],
    };

    axios.get
      // metadata
      .mockImplementationOnce((url, { params }) => {
        expect(url).toBe("https://hotelapi.loyalty.dev/api/hotels");
        expect(params).toEqual({ destination_id: "RsBU" });
        return Promise.resolve({ data: meta });
      })
      // prices (completed immediately)
      .mockImplementationOnce((url, { params }) => {
        expect(url).toBe("https://hotelapi.loyalty.dev/api/hotels/prices");
        expect(params).toMatchObject({
          destination_id: "RsBU",
          checkin: "2025-08-10",
          checkout: "2025-08-12",
          guests: "2|2",
          partner_id: 1089,
          landing_page: "wl-acme-earn",
          product_type: "earn",
          lang: "en_US",
          currency: "USD",
          country_code: "US",
        });
        return Promise.resolve({ data: pricesPayload });
      });

    await hotelApiService.getHotelsByUid(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledTimes(1);

    const merged = res.json.mock.calls[0][0];
    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(
      expect.objectContaining({
        id: "H1",
        name: "Hotel One",
        address: "1 Test Street",
        rating: 4.3,
        price: 123.45,
        lowestPrice: 120.0,
        roomsAvailable: 5,
        freeCancellation: true,
        trustyouScore: 4.6,
        latitude: 1.23,
        longitude: 4.56,
      })
    );
  });

  it("returns [] when metadata is empty", async () => {
    const req = {
      params: { uid: "RsBU" },
      query: { checkin: "2025-08-10", checkout: "2025-08-12", guests: "2|2" },
    };
    const res = mockRes();

    axios.get
      .mockResolvedValueOnce({ data: [] }) // metadata empty
      .mockResolvedValueOnce({ data: { completed: true, hotels: [{ id: "H1" }] } });

    await hotelApiService.getHotelsByUid(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns [] when prices payload has no hotels (completed but empty)", async () => {
    const req = {
      params: { uid: "RsBU" },
      query: { checkin: "2025-08-10", checkout: "2025-08-12", guests: "2|2" },
    };
    const res = mockRes();

    const meta = [{ id: "H1", name: "Hotel One" }];

    axios.get
      .mockResolvedValueOnce({ data: meta }) // metadata ok
      .mockResolvedValueOnce({ data: { completed: true, hotels: [] } }); // prices empty

    await hotelApiService.getHotelsByUid(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });
  it("polls until completed=true (simulated retries) then returns merged data", async () => {
    jest.useFakeTimers();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => { });

    const req = {
      params: { uid: "RsBU" },
      query: { checkin: "2025-08-10", checkout: "2025-08-12", guests: "2|2" },
    };
    const res = mockRes();

    const meta = [{ id: "H1", name: "Hotel One" }];

    //polling!!
    axios.get
      // 1) metadata
      .mockResolvedValueOnce({ data: meta })
      // 2) prices attempt #1 -> not completed
      .mockResolvedValueOnce({ data: { completed: false } })
      // 3) prices attempt #2 -> not completed
      .mockResolvedValueOnce({ data: { completed: false } })
      // 4) prices attempt #3 -> completed
      .mockResolvedValueOnce({
        data: {
          completed: true,
          hotels: [{ id: "H1", converted_price: 200, lowest_converted_price: 180 }],
        },
      });

    // kick off the call so it doesnt cause timeout between the calls
    const promise = hotelApiService.getHotelsByUid(req, res);

    // advance time to release attempt #2
    await jest.advanceTimersByTimeAsync(5000);
    // advance time to release attempt #3
    await jest.advanceTimersByTimeAsync(5000);

    // await the controller to finish
    await promise;

    expect(axios.get).toHaveBeenCalledTimes(4);
    expect(res.status).toHaveBeenCalledWith(200);
    const merged = res.json.mock.calls[0][0];
    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(
      expect.objectContaining({ id: "H1", price: 200, lowestPrice: 180 })
    );

    logSpy.mockRestore();
    errSpy.mockRestore();
    jest.useRealTimers();
  }, 15000); // optional longer timeout for safety
});