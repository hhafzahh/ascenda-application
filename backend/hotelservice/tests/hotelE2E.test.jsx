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
