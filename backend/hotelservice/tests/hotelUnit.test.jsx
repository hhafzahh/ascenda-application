const axios = require("axios");

//mock axios 
jest.mock("axios");

const hotelApiService = require("../hotelAPIService");

//mock express res
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