const express = require("express");
const request = require("supertest");
const axios = require("axios");

jest.mock("axios");

const hotelApiService = require("../hotelAPIService");

// mount search api
function buildApp() {
  const app = express();
  app.get("/api/hotelproxy/hotels", (req, res) =>
    hotelApiService.getHotels(req, res)
  );
  app.get("/api/hotelproxy/hotels/:uid", (req, res) =>
    hotelApiService.getHotelsByUid(req, res)
  );
  return app;
}

describe("Hotel Integration: /api/hotelproxy/hotels", () => {
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("200 + payload for valid query", async () => {
    const fake = [{ id: "H1", name: "Test Hotel", price: 123 }];
    axios.get.mockResolvedValueOnce({ data: fake });

    const res = await request(app).get("/api/hotelproxy/hotels").query({
      destination_id: "RsBU",
      checkin: "2025-08-10",
      checkout: "2025-08-12",
      guests: "2|2",
    });

    expect(axios.get).toHaveBeenCalledWith(
      "https://hotelapi.loyalty.dev/api/hotels",
      {
        params: {
          destination_id: "RsBU",
          checkin: "2025-08-10",
          checkout: "2025-08-12",
          guests: "2|2",
        },
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fake);
  });

  it("200 + [] when upstream returns empty", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    const res = await request(app)
      .get("/api/hotelproxy/hotels")
      .query({ destination_id: "X" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("500 on upstream error with message passthrough", async () => {
    axios.get.mockRejectedValueOnce(new Error("network oops"));

    const res = await request(app)
      .get("/api/hotelproxy/hotels")
      .query({ destination_id: "RsBU" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: "Failed to fetch hotel data",
      details: "network oops",
    });
  });
});

describe("Hotel Integration: /api/hotelproxy/hotels/:uid (getHotelsByUid)", () => {
  let app;
  let logSpy, errSpy;

  beforeAll(() => {
    app = buildApp();
  });

  beforeEach(() => {
    // silence polling logs in test output
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("200 + merged payload when polling completes immediately", async () => {
    const meta = [
      {
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
      },
    ];
    const pricesPayload = {
      completed: true,
      hotels: [
        {
          id: "H1",
          converted_price: 123.45,
          lowest_converted_price: 120.0,
          rooms_available: 5,
          free_cancellation: true,
        },
      ],
    };

    // 1) metadata, 2) prices (completed)
    axios.get
      .mockResolvedValueOnce({ data: meta })
      .mockResolvedValueOnce({ data: pricesPayload });

    const res = await request(app).get("/api/hotelproxy/hotels/RsBU").query({
      checkin: "2025-08-10",
      checkout: "2025-08-12",
      guests: "2|2",
    });

    // verify calls
    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      "https://hotelapi.loyalty.dev/api/hotels",
      { params: { destination_id: "RsBU" } }
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      "https://hotelapi.loyalty.dev/api/hotels/prices",
      {
        params: expect.objectContaining({
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
        }),
      }
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      expect.objectContaining({
        id: "H1",
        name: "Hotel One",
        address: "1 Test Street",
        rating: 4.3,
        trustyouScore: 4.6,
        price: 123.45,
        lowestPrice: 120.0,
        roomsAvailable: 5,
        freeCancellation: true,
        latitude: 1.23,
        longitude: 4.56,
      }),
    ]);
  });

  it("200 + [] when metadata is empty", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] }) // metadata
      .mockResolvedValueOnce({
        data: { completed: true, hotels: [{ id: "H1" }] },
      }); // prices

    const res = await request(app).get("/api/hotelproxy/hotels/RsBU").query({
      checkin: "2025-08-10",
      checkout: "2025-08-12",
      guests: "2|2",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("200 + [] when prices payload has no hotels", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [{ id: "H1", name: "Hotel One" }] }) // metadata
      .mockResolvedValueOnce({ data: { completed: true, hotels: [] } }); // prices

    const res = await request(app).get("/api/hotelproxy/hotels/RsBU").query({
      checkin: "2025-08-10",
      checkout: "2025-08-12",
      guests: "2|2",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("200 + merged payload after polling retries (instant timers)", async () => {
    // make setTimeout run the callback immediately (no 5s waits).
    const setTimeoutSpy = jest
      .spyOn(global, "setTimeout")
      .mockImplementation((cb, ms, ...args) => {
        // call on next tick to keep async semantics, but no delay
        process.nextTick(() => cb(...args));
        return 0; // fake timer id
      });

    // 1) metadata
    // 2) prices attempt #1 -> not completed
    // 3) prices attempt #2 -> not completed
    // 4) prices attempt #3 -> completed with hotels
    axios.get
      .mockResolvedValueOnce({ data: [{ id: "H1", name: "Hotel One" }] })
      .mockResolvedValueOnce({ data: { completed: false } })
      .mockResolvedValueOnce({ data: { completed: false } })
      .mockResolvedValueOnce({
        data: {
          completed: true,
          hotels: [
            { id: "H1", converted_price: 200, lowest_converted_price: 180 },
          ],
        },
      });

    const res = await request(app).get("/api/hotelproxy/hotels/RsBU").query({
      checkin: "2025-08-10",
      checkout: "2025-08-12",
      guests: "2|2",
    });

    expect(axios.get).toHaveBeenCalledTimes(4);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      expect.objectContaining({ id: "H1", price: 200, lowestPrice: 180 }),
    ]);

    setTimeoutSpy.mockRestore();
  }, 10000);
});
