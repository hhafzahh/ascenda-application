const express = require("express");
const request = require("supertest");
const axios = require("axios");

jest.mock("axios");

const hotelApiService = require("../hotelAPIService");

//mount search api
function buildApp() {
  const app = express();
  app.get("/api/hotelproxy/hotels", (req, res) =>
    hotelApiService.getHotels(req, res)
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

    const res = await request(app)
      .get("/api/hotelproxy/hotels")
      .query({
        destination_id: "RsBU",
        checkin: "2025-08-10",
        checkout: "2025-08-12",
        guests: "2|2",
      });

    expect(axios.get).toHaveBeenCalledWith(
      "https://hotelapi.loyalty.dev/api/hotels",
      { params: {
        destination_id: "RsBU",
        checkin: "2025-08-10",
        checkout: "2025-08-12",
        guests: "2|2",
      }}
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