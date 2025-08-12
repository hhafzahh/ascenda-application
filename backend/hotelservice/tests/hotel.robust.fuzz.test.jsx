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
    // make polling run instantly (no 5s wait) so fuzz is fast/stable w
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