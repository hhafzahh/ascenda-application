const express = require("express");
const request = require("supertest");
const axios = require("axios");
jest.mock("axios");
const hotelApi = require("../hotelAPIService");

function appFactory() {
  const app = express();
  app.get("/api/hotelproxy/rooms", hotelApi.getRooms);
  return app;
}

describe("Hotel Robust: /api/hotelproxy/rooms robustness", () => {
  const app = appFactory();

  it("400 if required params missing", async () => {
    const res = await request(app).get("/api/hotelproxy/rooms").query({}); // nothing
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Missing required query params/);
  });

  it("200 on happy path", async () => {
    axios.get
      // price endpoint
      .mockResolvedValueOnce({ data: { offers: [{ id: "R1" }] } })
      // hotel list endpoint
      .mockResolvedValueOnce({ data: [{ id: "H123", name: "Mock Hotel" }] });

    const res = await request(app)
      .get("/api/hotelproxy/rooms")
      .query({
        hotel_id: "H123",
        destination_id: "RsBU",
        checkin: "2025-08-10",
        checkout: "2025-08-12",
        guests: "2|2",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("offers");
    expect(res.body).toHaveProperty("hotel");
  });

  it("500 when upstream errors", async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 503, data: { msg: "down" } } });

    const res = await request(app)
      .get("/api/hotelproxy/rooms")
      .query({
        hotel_id: "H123",
        destination_id: "RsBU",
        checkin: "2025-08-10",
        checkout: "2025-08-12",
        guests: "2|2",
      });

    expect(res.statusCode).toBe(503);
    expect(res.body.error).toMatch(/Failed to fetch room prices/);
  });
});