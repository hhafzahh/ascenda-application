const express = require("express");
const request = require("supertest");
const axios = require("axios");
jest.mock("axios");
const fc = require("fast-check");
const hotelApi = require("../hotelAPIService");

function appFactory() {
  const app = express();
  app.get("/api/hotelproxy/rooms", hotelApi.getRooms);
  return app;
}
const app = appFactory();

jest.setTimeout(60_000);

const noLeak = (res) => {
  const s = JSON.stringify(res.body);
  expect(s).not.toMatch(/stack|node_modules/i);
};

describe("Fuzz: /api/hotelproxy/rooms", () => {
  test("random query params => 400/200/5xx (no crashes, no leaks)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hotel_id: fc.oneof(fc.string({ maxLength: 10 }), fc.constant(undefined)),
          destination_id: fc.oneof(fc.string({ maxLength: 10 }), fc.constant(undefined)),
          checkin: fc.oneof(fc.string({ maxLength: 12 }), fc.constant(undefined)),
          checkout: fc.oneof(fc.string({ maxLength: 12 }), fc.constant(undefined)),
          guests: fc.oneof(fc.string({ maxLength: 12 }), fc.constant(undefined)),
        }, { withDeletedKeys: true }),
        async (q) => {
          // Randomize upstream behavior: success or fail
          if (Math.random() < 0.6) {
            axios.get
              .mockResolvedValueOnce({ data: { offers: [{ id: "R1" }] } }) // price endpoint
              .mockResolvedValueOnce({ data: [{ id: q.hotel_id || "H", name: "Hotel" }] }); // hotel list
          } else {
            axios.get.mockRejectedValueOnce({ response: { status: 503, data: { msg: "down" } } });
          }

          const res = await request(app).get("/api/hotelproxy/rooms").query(q);
          // contract: missing required => 400, upstream boom => 5xx, success => 200
          expect([200, 400, 500, 503]).toContain(res.statusCode);
          noLeak(res);

          jest.clearAllMocks();
        }
      ),
      { numRuns: 800 }
    );
  });

  test("explicit missing required params => 400", async () => {
    const res = await request(app).get("/api/hotelproxy/rooms").query({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Missing required query params/i);
    noLeak(res);
  });
});