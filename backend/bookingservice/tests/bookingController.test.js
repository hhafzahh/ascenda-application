const express = require("express");
const request = require("supertest");
const { ObjectId } = require("mongodb");

// Mock the database module
const mockDb = {
  collection: jest.fn(() => ({
    insertOne: jest.fn(),
    findOne: jest.fn()
  }))
};

jest.mock("../database/db", () => ({
  getDb: () => mockDb
}));

const bookingController = require("../bookingController");

// Build test app
function buildApp() {
  const app = express();
  app.use(express.json());
  app.post("/api/bookings", bookingController.createBooking);
  app.get("/api/bookings/:id", bookingController.getBookingById);
  return app;
}

describe("Booking Controller Tests", () => {
  let app;
  let mockCollection;

  beforeAll(() => {
    app = buildApp();
    // Suppress console logs for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore console logs
    console.log.mockRestore();
    console.error.mockRestore();
  });

  beforeEach(() => {
    mockCollection = {
      insertOne: jest.fn(),
      findOne: jest.fn()
    };
    mockDb.collection.mockReturnValue(mockCollection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/bookings - createBooking", () => {
    const validBookingData = {
      title: "Mr",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@email.com",
      countryCode: "+65",
      mobile: "1234567890",
      bookingForSomeone: false,
      specialRequests: "Late check-in",
      room: {
        roomDescription: "Deluxe King Room",
        converted_price: 150.00,
        amenities: ["WiFi", "Air Conditioning"]
      },
      searchParams: {
        checkIn: "2024-01-15",
        checkOut: "2024-01-17",
        guests: 2
      },
      hotel: {
        id: "hotel123",
        name: "Test Hotel",
        address: "123 Test Street"
      }
    };

    it("201 + created booking for valid data", async () => {
      const mockInsertedId = new ObjectId();
      const mockCreatedBooking = {
        _id: mockInsertedId,
        ...validBookingData
      };

      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: mockInsertedId
      });
      mockCollection.findOne.mockResolvedValueOnce(mockCreatedBooking);

      const res = await request(app)
        .post("/api/bookings")
        .send(validBookingData);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(validBookingData);
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: mockInsertedId
      });
      expect(res.statusCode).toBe(201);
      
      // Check the structure without comparing ObjectId directly
      expect(res.body._id).toBeDefined();
      expect(res.body.firstName).toBe("John");
      expect(res.body.lastName).toBe("Doe");
      expect(res.body.email).toBe("john.doe@email.com");
      expect(res.body.specialRequests).toBe("Late check-in");
    });

    it("201 + booking without special requests", async () => {
      const bookingWithoutRequests = {
        ...validBookingData,
        specialRequests: ""
      };
      const mockInsertedId = new ObjectId();
      const mockCreatedBooking = {
        _id: mockInsertedId,
        ...bookingWithoutRequests
      };

      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: mockInsertedId
      });
      mockCollection.findOne.mockResolvedValueOnce(mockCreatedBooking);

      const res = await request(app)
        .post("/api/bookings")
        .send(bookingWithoutRequests);

      expect(res.statusCode).toBe(201);
      expect(res.body.specialRequests).toBe("");
      expect(res.body.firstName).toBe("John");
    });

    it("201 + booking for someone else", async () => {
      const bookingForOther = {
        ...validBookingData,
        bookingForSomeone: true
      };
      const mockInsertedId = new ObjectId();
      const mockCreatedBooking = {
        _id: mockInsertedId,
        ...bookingForOther
      };

      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: mockInsertedId
      });
      mockCollection.findOne.mockResolvedValueOnce(mockCreatedBooking);

      const res = await request(app)
        .post("/api/bookings")
        .send(bookingForOther);

      expect(res.statusCode).toBe(201);
      expect(res.body.bookingForSomeone).toBe(true);
    });

    it("500 on database insert error", async () => {
      mockCollection.insertOne.mockRejectedValueOnce(new Error("Database connection failed"));

      const res = await request(app)
        .post("/api/bookings")
        .send(validBookingData);

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        error: "Failed to create booking",
        details: "Database connection failed"
      });
    });

    it("500 on database findOne error after successful insert", async () => {
      const mockInsertedId = new ObjectId();
      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: mockInsertedId
      });
      mockCollection.findOne.mockRejectedValueOnce(new Error("Find operation failed"));

      const res = await request(app)
        .post("/api/bookings")
        .send(validBookingData);

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        error: "Failed to create booking",
        details: "Find operation failed"
      });
    });

    it("201 + booking with minimal required data", async () => {
      const minimalBooking = {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@email.com",
        room: {
          roomDescription: "Standard Room",
          converted_price: 100.00
        }
      };
      const mockInsertedId = new ObjectId();
      const mockCreatedBooking = {
        _id: mockInsertedId,
        ...minimalBooking
      };

      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: mockInsertedId
      });
      mockCollection.findOne.mockResolvedValueOnce(mockCreatedBooking);

      const res = await request(app)
        .post("/api/bookings")
        .send(minimalBooking);

      expect(res.statusCode).toBe(201);
      expect(res.body.firstName).toBe("Jane");
      expect(res.body.email).toBe("jane@email.com");
    });
  });

  describe("GET /api/bookings/:id - getBookingById", () => {
    const validObjectId = new ObjectId();
    const mockBooking = {
      _id: validObjectId,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@email.com",
      room: {
        roomDescription: "Deluxe King Room",
        converted_price: 150.00
      }
    };

    it("200 + booking for valid ObjectId", async () => {
      mockCollection.findOne.mockResolvedValueOnce(mockBooking);

      const res = await request(app)
        .get(`/api/bookings/${validObjectId.toString()}`);

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: validObjectId
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.firstName).toBe("John");
      expect(res.body.lastName).toBe("Doe");
      expect(res.body.email).toBe("john.doe@email.com");
    });

    it("404 when booking not found", async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .get(`/api/bookings/${validObjectId.toString()}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({
        error: "Booking not found"
      });
    });

    it("400 for invalid ObjectId format", async () => {
      const invalidId = "invalid-id-123";

      const res = await request(app)
        .get(`/api/bookings/${invalidId}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: "Invalid booking ID format"
      });
      expect(mockCollection.findOne).not.toHaveBeenCalled();
    });

    it("400 for empty ID", async () => {
      const res = await request(app)
        .get("/api/bookings/");

      expect(res.statusCode).toBe(404); // Express router will return 404 for missing route param
    });

    it("400 for null/undefined ID", async () => {
      const res = await request(app)
        .get("/api/bookings/null");

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: "Invalid booking ID format"
      });
    });

    it("500 on database error", async () => {
      mockCollection.findOne.mockRejectedValueOnce(new Error("Database connection failed"));

      const res = await request(app)
        .get(`/api/bookings/${validObjectId.toString()}`);

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        error: "Failed to fetch booking"
      });
    });

    it("200 + booking with all fields populated", async () => {
      const completeBooking = {
        _id: validObjectId,
        title: "Dr",
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice.johnson@email.com",
        countryCode: "+44",
        mobile: "7700900123",
        bookingForSomeone: true,
        specialRequests: "Wheelchair accessible room",
        room: {
          roomDescription: "Premium Suite",
          converted_price: 300.00,
          amenities: ["WiFi", "Balcony", "Jacuzzi"]
        },
        searchParams: {
          checkIn: "2024-02-01",
          checkOut: "2024-02-05",
          guests: 3
        },
        hotel: {
          id: "hotel456",
          name: "Luxury Resort",
          address: "456 Ocean Drive"
        }
      };

      mockCollection.findOne.mockResolvedValueOnce(completeBooking);

      const res = await request(app)
        .get(`/api/bookings/${validObjectId.toString()}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.specialRequests).toBe("Wheelchair accessible room");
      expect(res.body.bookingForSomeone).toBe(true);
      expect(res.body.firstName).toBe("Alice");
      expect(res.body.hotel.name).toBe("Luxury Resort");
    });

    it("200 + handles 24-character hex string ObjectId", async () => {
      const hexStringId = "507f1f77bcf86cd799439011";
      const expectedObjectId = new ObjectId(hexStringId);
      
      mockCollection.findOne.mockResolvedValueOnce({
        ...mockBooking,
        _id: expectedObjectId
      });

      const res = await request(app)
        .get(`/api/bookings/${hexStringId}`);

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: expectedObjectId
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.firstName).toBe("John");
    });
  });
});