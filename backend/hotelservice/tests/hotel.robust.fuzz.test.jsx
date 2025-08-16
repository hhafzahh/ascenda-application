const express = require("express");
const request = require("supertest");
const fc = require("fast-check");

jest.mock("axios");
const axios = require("axios");
const hotelApi = require("../hotelAPIService");

// app routes 
function appFactory() {
  const app = express();
  app.get("/api/hotelproxy/hotels", hotelApi.getHotels);
  app.get("/api/hotelproxy/hotels/:uid", hotelApi.getHotelsByUid);
  app.get("/api/hotelproxy/rooms", hotelApi.getRooms);
  app.get("/api/hotelproxy/hotel/:id", hotelApi.getHotelById);
  return app;
}
const app = appFactory();

//runtime limit for fuzz
jest.setTimeout(parseInt(process.env.FUZZ_TEST_TIMEOUT || "20000", 10));

//silence logging for clean test output
const keep = { log: console.log, warn: console.warn, error: console.error };
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});
afterAll(() => {
  console.log = keep.log;
  console.warn = keep.warn;
  console.error = keep.error;
});

// Treat undefined, null, or whitespace-only strings as "missing"
const isBlank = (v) =>
  v == null || (typeof v === "string" && v.trim() === "");
// Strict version: only undefined or "" count as missing (matches controller)
const isMissingStrict = (v) => v === undefined || v === "";

// Safe path segment generator (no slashes)
const safeSegArb = fc
  .string({ minLength: 1, maxLength: 10 })
  .filter((s) => !s.includes("/"));

//prevent leaks
const noLeak = (res) => {
  const s = JSON.stringify(res.body ?? {});
  expect(s).not.toMatch(/stack|node_modules|ObjectId|BSONError|at .*:\d+:\d+/i);
};

//reset axios mocks after each test block
afterEach(() => jest.clearAllMocks());

describe("Robustness: /api/hotelproxy/hotels (getHotels)", () => {
  // default axios behavior for this block
  beforeEach(() => {
    axios.get.mockImplementation((url, { params } = {}) => {
      if (url.endsWith("/api/hotels")) {
        // echo back params just to keep a predictable shape
        return Promise.resolve({ data: [{ id: "H1", echo: params || {} }] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test("fuzz query params => 200 on success, 500 on upstream error; no leaks", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record(
          {
            destination_id: fc.oneof(fc.string({ maxLength: 10 }), fc.constant(undefined)),
            checkin: fc.oneof(fc.string({ maxLength: 12 }), fc.constant(undefined)),
            checkout: fc.oneof(fc.string({ maxLength: 12 }), fc.constant(undefined)),
            guests: fc.oneof(fc.string({ maxLength: 12 }), fc.constant(undefined)),
            simulateDown: fc.boolean(),
          },
          { withDeletedKeys: true }
        ),
        async (q) => {
          axios.get.mockReset();
          if (q.simulateDown === true) {
            axios.get.mockRejectedValueOnce(new Error("boom"));
          } else {
            axios.get.mockResolvedValueOnce({ data: [{ id: "H1" }] });
          }

          const { simulateDown, ...query } = q;
          const res = await request(app).get("/api/hotelproxy/hotels").query(query);

          expect([200, 500]).toContain(res.statusCode);
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_HOTEL || "120", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_HOTEL_MS || "12000", 10),
      }
    );
  });

  test("explicit: upstream empty => 200 []", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    const res = await request(app)
      .get("/api/hotelproxy/hotels")
      .query({ destination_id: "X" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
    noLeak(res);
  });

  test("explicit: upstream error => 500 with message", async () => {
    axios.get.mockRejectedValueOnce(new Error("network oops"));
    const res = await request(app)
      .get("/api/hotelproxy/hotels")
      .query({ destination_id: "RsBU" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: "Failed to fetch hotel data",
      details: "network oops",
    });
    noLeak(res);
  });
});

describe("Robustness: /api/hotelproxy/hotels/:uid (getHotelsByUid)", () => {
  let setTimeoutSpy;

  beforeEach(() => {
    // make polling run instantly (no 5s wait) so fuzz is fast/stable
    jest.useRealTimers();
    setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((cb, ms, ...args) => {
      process.nextTick(() => cb(...args));
      return 0;
    });
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
  });

  // path safe uid generator (no '/') and URL-encode when calling supertest
  const uidArb = fc
    .string({ minLength: 1, maxLength: 12 })
    .filter((s) => !s.includes("/"));

  test("fuzz uid + query => 200 (controller returns [] on failures), no leaks", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record(
          {
            uid: uidArb,
            checkin: fc.oneof(fc.string({ maxLength: 12 }), fc.constant(undefined)),
            checkout: fc.oneof(fc.string({ maxLength: 12 }), fc.constant(undefined)),
            guests: fc.oneof(fc.string({ maxLength: 12 }), fc.constant(undefined)),
            downMeta: fc.boolean(),
            downPrices: fc.boolean(),
            emptyMeta: fc.boolean(),
            emptyPrices: fc.boolean(),
          },
          { withDeletedKeys: true }
        ),
        async (q) => {
          //create mock that can serve any number of calls in any order
          axios.get.mockReset();
          axios.get.mockImplementation((url) => {
            if (url.endsWith("/api/hotels")) {
              if (q.downMeta) return Promise.reject(new Error("meta down"));
              if (q.emptyMeta) return Promise.resolve({ data: [] });
              return Promise.resolve({
                data: [
                  {
                    id: "H1",
                    name: "Mock Hotel",
                    trustyou: { score: { kaligo_overall: 4.5 } },
                  },
                ],
              });
            }
            if (url.endsWith("/api/hotels/prices")) {
              if (q.downPrices) return Promise.reject(new Error("prices down"));
              if (q.emptyPrices) {
                return Promise.resolve({ data: { completed: true, hotels: [] } });
              }
              // complete immediately if one hotel
              return Promise.resolve({
                data: {
                  completed: true,
                  hotels: [
                    {
                      id: "H1",
                      converted_price: 200,
                      lowest_converted_price: 180,
                    },
                  ],
                },
              });
            }
            return Promise.resolve({ data: [] });
          });

          const { uid, ...query } = q;

          // always encode uid to avoid accidental path separators
          const res = await request(app)
            .get(`/api/hotelproxy/hotels/${encodeURIComponent(uid)}`)
            .query(query);

          // always responds 200; returns [] when either side missing/failed
          expect(res.statusCode).toBe(200);
          expect(Array.isArray(res.body)).toBe(true);
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_HOTEL_UID || "120", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_HOTEL_MS || "12000", 10),
      }
    );
  });

  test("explicit: merged payload when both succeed (deterministic)", async () => {
    axios.get.mockReset();
    axios.get.mockImplementation((url) => {
      if (url.endsWith("/api/hotels")) {
        return Promise.resolve({
          data: [
            {
              id: "H1",
              name: "Mock Hotel",
              trustyou: { score: { kaligo_overall: 4.5 } },
            },
          ],
        });
      }
      if (url.endsWith("/api/hotels/prices")) {
        return Promise.resolve({
          data: {
            completed: true,
            hotels: [
              {
                id: "H1",
                converted_price: 111,
                lowest_converted_price: 100,
                rooms_available: 2,
                free_cancellation: true,
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    const res = await request(app)
      .get(`/api/hotelproxy/hotels/${encodeURIComponent("RsBU")}`)
      .query({ checkin: "2025-08-10", checkout: "2025-08-12", guests: "2|2" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      expect.objectContaining({
        id: "H1",
        name: "Mock Hotel",
        price: 111,
        lowestPrice: 100,
        roomsAvailable: 2,
        freeCancellation: true,
        trustyouScore: 4.5,
      }),
    ]);
    noLeak(res);
  });

  test("explicit: [] when metadata empty OR prices empty OR prices down (deterministic)", async () => {
    // case 1: metadata empty
    axios.get.mockReset();
    axios.get.mockImplementation((url) => {
      if (url.endsWith("/api/hotels")) return Promise.resolve({ data: [] });
      if (url.endsWith("/api/hotels/prices")) {
        return Promise.resolve({
          data: { completed: true, hotels: [{ id: "H1", converted_price: 1 }] },
        });
      }
      return Promise.resolve({ data: [] });
    });
    let res = await request(app)
      .get(`/api/hotelproxy/hotels/${encodeURIComponent("RsBU")}`)
      .query({});
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);

    // case 2: prices empty
    axios.get.mockReset();
    axios.get.mockImplementation((url) => {
      if (url.endsWith("/api/hotels")) {
        return Promise.resolve({ data: [{ id: "H1", name: "X" }] });
      }
      if (url.endsWith("/api/hotels/prices")) {
        return Promise.resolve({ data: { completed: true, hotels: [] } });
      }
      return Promise.resolve({ data: [] });
    });
    res = await request(app)
      .get(`/api/hotelproxy/hotels/${encodeURIComponent("RsBU")}`)
      .query({});
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);

    // case 3: prices error (polling fails) → controller catches → []
    axios.get.mockReset();
    axios.get.mockImplementation((url) => {
      if (url.endsWith("/api/hotels")) {
        return Promise.resolve({ data: [{ id: "H1", name: "X" }] });
      }
      if (url.endsWith("/api/hotels/prices")) {
        return Promise.reject(new Error("prices failed"));
      }
      return Promise.resolve({ data: [] });
    });
    res = await request(app)
      .get(`/api/hotelproxy/hotels/${encodeURIComponent("RsBU")}`)
      .query({});
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);

    noLeak(res);
  });
});

describe("Robustness: /api/hotelproxy/rooms (getRooms)", () => {
  /**
   * Fuzz strategy:
   *  - If any required param missing/blank -> expect 400, axios not called
   *  - Else -> expect 200 + shape { rooms, hotel }
   */
  test("fuzz: 400 on missing required params; 500 on upstream error; 200 on success; no leaks", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record(
          {
            // Required: hotel_id, destination_id, checkin, checkout, guests
            // NOTE: only undefined or "" should count as missing to match controller
            hotel_id: fc.oneof(safeSegArb, fc.constant(""), fc.constant(undefined)),
            destination_id: fc.oneof(safeSegArb, fc.constant(""), fc.constant(undefined)),
            checkin: fc.oneof(fc.string({ minLength: 1, maxLength: 12 }), fc.constant(""), fc.constant(undefined)),
            checkout: fc.oneof(fc.string({ minLength: 1, maxLength: 12 }), fc.constant(""), fc.constant(undefined)),
            guests: fc.oneof(fc.string({ minLength: 1, maxLength: 12 }), fc.constant(""), fc.constant(undefined)),
            // Optional: simulate upstream failure
            simulateDown: fc.boolean(),
          },
          { withDeletedKeys: true }
        ),
        async (q) => {
          axios.get.mockReset();

          const missing =
            isMissingStrict(q.hotel_id) ||
            isMissingStrict(q.destination_id) ||
            isMissingStrict(q.checkin) ||
            isMissingStrict(q.checkout) ||
            isMissingStrict(q.guests);

          if (missing) {
            const res = await request(app).get("/api/hotelproxy/rooms").query(q);
            expect(res.statusCode).toBe(400);
            expect(res.body).toEqual({ error: "Missing required query params" });
            expect(axios.get).not.toHaveBeenCalled();
            noLeak(res);
            return;
          }

          if (q.simulateDown) {
            // First axios call rejects (price endpoint)
            axios.get.mockRejectedValueOnce(new Error("upstream down"));
          } else {
            // Success: 2 calls, price then hotels list
            axios.get
              .mockResolvedValueOnce({ data: { rooms: [{ id: "R1" }] } }) // price
              .mockResolvedValueOnce({
                data: [{ id: q.hotel_id, name: "Hotel Match" }],
              }); // hotels list
          }

          const res = await request(app).get("/api/hotelproxy/rooms").query(q);

          if (q.simulateDown) {
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty("error", "Failed to fetch room prices");
          } else {
            expect([200, 404]).toContain(res.statusCode);
            expect(res.body).toHaveProperty("rooms");
            expect(res.body).toHaveProperty("hotel");
          }
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_ROOMS || "80", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_ROOMS_MS || "12000", 10),
      }
    );
  });

  test("explicit: returns merged data on success", async () => {
    const q = {
      hotel_id: "H100",
      destination_id: "RsBU",
      checkin: "2025-10-01",
      checkout: "2025-10-07",
      guests: "2|2",
    };

    const priceData = { rooms: [{ id: "R1", name: "Suite" }] };
    const hotelsList = [{ id: "H100", name: "Nice Hotel" }];

    axios.get
      .mockResolvedValueOnce({ data: priceData }) // price endpoint
      .mockResolvedValueOnce({ data: hotelsList }); // hotels list

    const res = await request(app).get("/api/hotelproxy/rooms").query(q);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ...priceData, hotel: hotelsList[0] });
    noLeak(res);
  });

  test("explicit: 400 when any required is blank", async () => {
    const res = await request(app).get("/api/hotelproxy/rooms").query({
      hotel_id: "H1",
      destination_id: "RsBU",
      checkin: "", // falsy => triggers 400 in controller
      checkout: "2025-10-07",
      guests: "2",
    });
    expect(res.statusCode).toBe(400);
    noLeak(res);
  });

  test("explicit: 500 when upstream fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("API error"));
    const res = await request(app).get("/api/hotelproxy/rooms").query({
      hotel_id: "H1",
      destination_id: "RsBU",
      checkin: "2025-10-01",
      checkout: "2025-10-07",
      guests: "2",
    });
    expect(res.statusCode).toBe(500);
    noLeak(res);
  });
});

describe("Robustness: /api/hotelproxy/hotel/:id (getHotelById)", () => {
  /**
   * Fuzz strategy:
   *  - simulateDown -> 500
   *  - else -> 200 with passthrough body
   */
  test("fuzz: 200 when ok / 500 on upstream error; no leaks", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: safeSegArb,
          simulateDown: fc.boolean(),
        }),
        async ({ id, simulateDown }) => {
          axios.get.mockReset();

          if (simulateDown) {
            axios.get.mockRejectedValueOnce(new Error("boom"));
          } else {
            axios.get.mockResolvedValueOnce({ data: { id, name: "Single Hotel" } });
          }

          const res = await request(app).get(`/api/hotelproxy/hotel/${encodeURIComponent(id)}`);

          if (simulateDown) {
            expect(res.statusCode).toBe(500);
            expect(res.body).toEqual({ error: "Error retrieving hotel details" });
          } else {
            expect([200, 404]).toContain(res.statusCode);
            if (res.statusCode === 200) {
              expect(res.body).toEqual({ id, name: "Single Hotel" });
            } else {
              // 404 path → no body or empty body
              expect(res.body).toEqual({});
            }
          }
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_HOTEL_ID || "80", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_HOTEL_ID_MS || "12000", 10),
      }
    );
  });

  test("explicit: OK path", async () => {
    axios.get.mockResolvedValueOnce({ data: { id: "050G", name: "Hotel G" } });
    const res = await request(app).get("/api/hotelproxy/hotel/050G");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: "050G", name: "Hotel G" });
    noLeak(res);
  });

  test("explicit: 500 upstream error", async () => {
    axios.get.mockRejectedValueOnce(new Error("API error"));
    const res = await request(app).get("/api/hotelproxy/hotel/050G");
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Error retrieving hotel details" });
    noLeak(res);
  });
});

describe("Robustness (unit): getHotelByHotelId", () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => jest.clearAllMocks());

  test("fuzz: 200 with hotel / 404 when empty / 500 on error; no leaks", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hotelId: safeSegArb,
          mode: fc.constantFrom("ok", "empty", "down"),
        }),
        async ({ hotelId, mode }) => {
          const req = { params: { hotelId } };
          const res = mockRes();

          axios.get.mockReset();
          if (mode === "ok") {
            axios.get.mockResolvedValueOnce({ data: [{ id: hotelId, name: "H" }] });
          } else if (mode === "empty") {
            axios.get.mockResolvedValueOnce({ data: [] });
          } else {
            axios.get.mockRejectedValueOnce(new Error("API error"));
          }

          await hotelApi.getHotelByHotelId(req, res);

          if (mode === "ok") {
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: hotelId, name: "H" });
          } else if (mode === "empty") {
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Hotel not found" });
          } else {
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
              error: "Error retrieving hotel info",
              details: "API error",
            });
          }

          // Leak check on whatever JSON was last sent
          const payload = res.json.mock.calls[res.json.mock.calls.length - 1][0];
          const s = JSON.stringify(payload ?? {});
          expect(s).not.toMatch(/stack|node_modules|ObjectId|BSONError|at .*:\d+:\d+/i);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_HOTEL_BY_HOTELID || "60", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_HOTEL_BY_HOTELID_MS || "9000", 10),
      }
    );
  });

  test("explicit: happy path", async () => {
    const req = { params: { hotelId: "H1" } };
    const res = mockRes();
    axios.get.mockResolvedValueOnce({ data: [{ id: "H1", name: "Test" }] });
    await hotelApi.getHotelByHotelId(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: "H1", name: "Test" });
  });

  test("explicit: 404 on empty", async () => {
    const req = { params: { hotelId: "NOPE" } };
    const res = mockRes();
    axios.get.mockResolvedValueOnce({ data: [] });
    await hotelApi.getHotelByHotelId(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Hotel not found" });
  });

  test("explicit: 500 on error", async () => {
    const req = { params: { hotelId: "H1" } };
    const res = mockRes();
    axios.get.mockRejectedValueOnce(new Error("bad"));
    await hotelApi.getHotelByHotelId(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Error retrieving hotel info",
      details: "bad",
    });
  });
});