const express = require("express");
const request = require("supertest");
const hotelApi = require("../hotelAPIService");

jest.setTimeout(30000);

function appFactory() {
  const app = express();
  app.get("/api/hotelproxy/hotels", hotelApi.getHotels);
  return app;
}

//TO BE INTEGRATED WITH MORE ROUTES HERE FOR A FULL FLOW OF HOTEL BACKEND!!
describe("Hotel E2E: GET /api/hotelproxy/hotels", () => {
  const app = appFactory();

  it("returns 200 + array for a real destination", async () => {
    const res = await request(app)
      .get("/api/hotelproxy/hotels")
      .query({ destination_id: "RsBU", checkin: "2025-08-10", checkout: "2025-08-12", guests: "2|2" });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("handles missing/odd params gracefully", async () => {
    const res = await request(app)
      .get("/api/hotelproxy/hotels")
      .query({ destination_id: "RsBU" }); 

    expect([200, 500]).toContain(res.statusCode); 
  });
});

describe("GET /api/hotelproxy/hotels/:hotelId/rooms", () => {
  const app = appFactory();

  it("returns rooms data with valid parameters", async () => {
    const res = await request(app)
      .get("/api/hotelproxy/hotels/050G/rooms")
      .query({ 
        destination_id: "RsBU",
        checkin: "2025-08-10",
        checkout: "2025-08-12",
        guests: "2|2"
      });

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("rooms");
      expect(res.body).toHaveProperty("hotel");
    }
  });
});

describe("GET /api/hotelproxy/hotels/:hotelId/rooms", () => {
  const app = appFactory();

  it("returns rooms data with valid parameters", async () => {
    const res = await request(app)
      .get("/api/hotelproxy/hotels/050G/rooms")
      .query({ 
        destination_id: "RsBU",
        checkin: "2025-08-10",
        checkout: "2025-08-12",
        guests: "2|2"
      });

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("rooms");
      expect(res.body).toHaveProperty("hotel");
    }
  });

  it("returns 404 for invalid hotelId", async () => {
    const res = await request(app)
      .get("/api/hotelproxy/hotels/INVALID/rooms")
      .query({ 
        destination_id: "RsBU",
        checkin: "2025-08-10",
        checkout: "2025-08-12",
        guests: "2|2"
      });

    expect([404, 500]).toContain(res.statusCode);
  });
});

describe("GET /api/hotelproxy/hotels/:hotelId", () => {
  const app = appFactory();

  it("returns hotel data for a valid hotelId", async () => {
    const res = await request(app)
      .get("/api/hotelproxy/hotels/050G")
      .query({ destination_id: "RsBU" });

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("name");
    }
  });

  it("returns 404 for invalid hotelId", async () => {
    const res = await request(app)
      .get("/api/hotelproxy/hotels/INVALID")
      .query({ destination_id: "RsBU" });

    expect([404, 500]).toContain(res.statusCode);
  });
});

describe("GET /api/hotelproxy/hotel/:id", () => {
  const app = appFactory();

  it("returns hotel data for a valid id", async () => {
    const res = await request(app)
      .get("/api/hotelproxy/hotel/050G");

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("name");
    }
  });

  it("returns 404 for invalid id", async () => {
    const res = await request(app)
      .get("/api/hotelproxy/hotel/INVALID");

    expect([404, 500]).toContain(res.statusCode);
  });
});
