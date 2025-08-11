const express = require("express");
const request = require("supertest");
const fc = require("fast-check");

jest.mock("axios");
const axios = require("axios");
const hotelApi = require("../hotelAPIService");

function appFactory() {
  const app = express();
  app.get("/api/hotelproxy/rooms", hotelApi.getRooms);
  return app;
}
const app = appFactory();

jest.setTimeout(parseInt(process.env.FUZZ_TEST_TIMEOUT || "20000", 10));

// silence logs in this suite
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

// Safety oracle
const noLeak = (res) => {
  const s = JSON.stringify(res.body ?? {});
  expect(s).not.toMatch(/stack|node_modules|ObjectId|BSONError/i);
};

// axios mock 
beforeEach(() => {
  axios.get.mockImplementation((url, { params } = {}) => {
    if (/\/hotels\/[^/]+\/price$/.test(url)) {
      return Promise.resolve({ data: { offers: [{ id: "R1" }] } });
    }
    if (/\/api\/hotels$/.test(url)) {
      return Promise.resolve({ data: [{ id: (params && params.hotel_id) || "H123", name: "Mock Hotel" }] });
    }
    return Promise.resolve({ data: [] });
  });
});
afterEach(() => jest.clearAllMocks());

describe("Fuzz: /api/hotelproxy/rooms", () => {
  test("random query params => 400/200/5xx (no crashes, no leaks)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record(
          {
            hotel_id: fc.oneof(fc.string({ minLength: 1, maxLength: 10 }), fc.constant(undefined)),
            destination_id: fc.oneof(fc.string({ minLength: 1, maxLength: 10 }), fc.constant(undefined)),
            checkin: fc.oneof(fc.string({ minLength: 1, maxLength: 12 }), fc.constant(undefined)),
            checkout: fc.oneof(fc.string({ minLength: 1, maxLength: 12 }), fc.constant(undefined)),
            guests: fc.oneof(fc.string({ minLength: 1, maxLength: 12 }), fc.constant(undefined)),
            // control upstream failure deterministically
            simulateDown: fc.boolean(),
          },
          { withDeletedKeys: true }
        ),
        async (q) => {
          // If we want failure, override the first call (price endpoint) to reject
          if (q.simulateDown === true) {
            axios.get.mockImplementationOnce(() =>
              Promise.reject({ response: { status: 503, data: { msg: "down" } } })
            );
          }

          const res = await request(app).get("/api/hotelproxy/rooms").query(q);

          // Missing required -> 400; success -> 200; upstream -> 5xx
          expect([200, 400, 500, 503]).toContain(res.statusCode);
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_HOTEL || "200", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_HOTEL_MS || "12000", 10),
      }
    );
  });

  test("explicit missing required params => 400", async () => {
    const res = await request(app).get("/api/hotelproxy/rooms").query({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Missing required query params/i);
    noLeak(res);
  });
});