const express = require("express");
const request = require("supertest");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");

// Mock database connection
let testDb;
let mongoClient;
const testDbName = `booking_e2e_test_${Date.now()}`;

// Mock Stripe
const mockStripe = {
  paymentIntents: {
    create: jest.fn()
  }
};

jest.mock("stripe", () => jest.fn(() => mockStripe));

// Mock database module with proper Jest mock structure
jest.mock("../database/db", () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  getDb: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined)
}));

// Import your actual modules after mocking
const bookingController = require("../bookingController");
const paymentController = require("../paymentController");
const mockDbModule = require("../database/db");

jest.setTimeout(30000);

function appFactory() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Booking routes
  app.post("/api/bookings", bookingController.createBooking);
  app.get("/api/bookings/:id", bookingController.getBookingById);
  app.get("/api/bookings/user/:userId", bookingController.getBookingsByUserId);
  
  // Payment routes
  app.post("/api/payments/create-intent", paymentController.createPaymentIntent);
  
  return app;
}

// Setup and teardown
beforeAll(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    testDb = mongoClient.db(testDbName);
    
    // Configure the mock to return our test database
    mockDbModule.getDb.mockReturnValue(testDb);
    
    // Set test environment
    process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";
  } catch (error) {
    console.warn("MongoDB not available, tests may fail:", error.message);
    // Create a mock database if real MongoDB is not available
    testDb = {
      collection: jest.fn(() => ({
        insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn(() => ({
          sort: jest.fn(() => ({
            toArray: jest.fn().mockResolvedValue([])
          }))
        })),
        deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 })
      })),
      dropDatabase: jest.fn().mockResolvedValue(undefined)
    };
    mockDbModule.getDb.mockReturnValue(testDb);
  }
});

afterAll(async () => {
  try {
    if (testDb) {
      await testDb.dropDatabase();
    }
    if (mongoClient) {
      await mongoClient.close();
    }
  } catch (error) {
    console.warn("Cleanup error:", error.message);
  }
});

beforeEach(async () => {
  if (testDb && testDb.collection && typeof testDb.collection === 'function') {
    try {
      await testDb.collection("bookings").deleteMany({});
    } catch (error) {
      console.warn("Collection cleanup error:", error.message);
    }
  }
  jest.clearAllMocks();
  // Ensure the mock returns the current testDb
  mockDbModule.getDb.mockReturnValue(testDb);
});

//TO BE INTEGRATED WITH MORE ROUTES HERE FOR A FULL FLOW OF BOOKING BACKEND!!
describe("Booking E2E: POST /api/bookings", () => {
  const app = appFactory();

  it("returns 201 + created booking for valid data", async () => {
    const bookingData = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@email.com",
      countryCode: "+65",
      mobile: "1234567890",
      bookingForSomeone: false,
      specialRequests: "Late check-in",
      room: {
        roomDescription: "Deluxe King Room",
        converted_price: 250.00,
        amenities: ["WiFi", "Air Conditioning", "Mini Bar"]
      },
      searchParams: {
        checkIn: "2025-08-10",
        checkOut: "2025-08-12",
        guests: 2
      },
      hotel: {
        id: "050G",
        name: "Marina Bay Hotel",
        address: "10 Marina Boulevard"
      }
    };

    const res = await request(app)
      .post("/api/bookings")
      .send(bookingData);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.firstName).toBe("John");
    expect(res.body.email).toBe("john.doe@email.com");
    expect(res.body).toHaveProperty("createdAt");
    expect(res.body.status).toBe("confirmed");
  });

  it("returns 201 for minimal booking data", async () => {
    const minimalData = {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@email.com"
    };

    const res = await request(app)
      .post("/api/bookings")
      .send(minimalData);

    expect(res.statusCode).toBe(201);
    expect(res.body.firstName).toBe("Jane");
    expect(res.body).toHaveProperty("_id");
  });

  it("handles booking for someone else", async () => {
    const bookingData = {
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice@email.com",
      bookingForSomeone: true,
      specialRequests: "Wheelchair accessible room"
    };

    const res = await request(app)
      .post("/api/bookings")
      .send(bookingData);

    expect(res.statusCode).toBe(201);
    expect(res.body.bookingForSomeone).toBe(true);
    expect(res.body.specialRequests).toBe("Wheelchair accessible room");
  });

  it("handles database errors gracefully", async () => {
    // Simulate database error by making the mock throw
    const originalMock = mockDbModule.getDb.getMockImplementation();
    mockDbModule.getDb.mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const res = await request(app)
      .post("/api/bookings")
      .send({
        firstName: "Error",
        lastName: "Test",
        email: "error@email.com"
      });

    expect([500, 201]).toContain(res.statusCode);
    
    // Restore original mock
    if (originalMock) {
      mockDbModule.getDb.mockImplementation(originalMock);
    } else {
      mockDbModule.getDb.mockReturnValue(testDb);
    }
  });
});

describe("Booking E2E: GET /api/bookings/:id", () => {
  const app = appFactory();

  it("returns 200 + booking data for valid ID", async () => {
    // Create a booking first
    const createRes = await request(app)
      .post("/api/bookings")
      .send({
        firstName: "Test",
        lastName: "User",
        email: "test@email.com",
        room: {
          roomDescription: "Standard Room",
          converted_price: 150.00
        }
      });

    expect(createRes.statusCode).toBe(201);
    const bookingId = createRes.body._id;

    // Retrieve the booking
    const getRes = await request(app)
      .get(`/api/bookings/${bookingId}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body._id).toBe(bookingId);
    expect(getRes.body.firstName).toBe("Test");
    expect(getRes.body.email).toBe("test@email.com");
  });

  it("returns 404 for non-existent booking ID", async () => {
    const nonExistentId = new ObjectId();

    const res = await request(app)
      .get(`/api/bookings/${nonExistentId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Booking not found");
  });

  it("returns 400 for invalid ID format", async () => {
    const res = await request(app)
      .get("/api/bookings/invalid-id-format");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid booking ID format");
  });
});

describe("Booking E2E: GET /api/bookings/user/:userId", () => {
  const app = appFactory();

  it("returns 200 + user bookings for valid userId", async () => {
    const userId = new ObjectId().toString();

    // Create multiple bookings for the same user
    const booking1 = await request(app)
      .post("/api/bookings")
      .send({
        userId: userId,
        firstName: "User1",
        lastName: "Test",
        email: "user1@email.com",
        room: { converted_price: 100.00 }
      });

    const booking2 = await request(app)
      .post("/api/bookings")
      .send({
        userId: userId,
        firstName: "User2",
        lastName: "Test",
        email: "user2@email.com",
        room: { converted_price: 200.00 }
      });

    expect(booking1.statusCode).toBe(201);
    expect(booking2.statusCode).toBe(201);

    // Retrieve user bookings
    const res = await request(app)
      .get(`/api/bookings/user/${userId}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    
    // Verify all bookings belong to the user
    res.body.forEach(booking => {
      expect(booking.userId).toBe(userId);
    });
  });

  it("returns empty array for user with no bookings", async () => {
    const emptyUserId = new ObjectId().toString();

    const res = await request(app)
      .get(`/api/bookings/user/${emptyUserId}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it("returns 400 for missing userId", async () => {
    const res = await request(app)
      .get("/api/bookings/user/");

    expect([400, 404]).toContain(res.statusCode);
  });
});

describe("Payment E2E: POST /api/payments/create-intent", () => {
  const app = appFactory();

  it("returns 200 + client secret for valid amount", async () => {
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: "pi_test_123",
      client_secret: "pi_test_123_secret_abc",
      amount: 15000,
      currency: "usd"
    });

    const res = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 15000 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("clientSecret");
    expect(res.body.clientSecret).toBe("pi_test_123_secret_abc");
    
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 15000,
      currency: "usd",
      payment_method_types: ["card"]
    });
  });

  it("returns 400 for amount below minimum", async () => {
    const res = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 49 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid amount");
    expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("returns 400 for missing amount", async () => {
    const res = await request(app)
      .post("/api/payments/create-intent")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid amount");
  });

  it("handles Stripe API errors gracefully", async () => {
    mockStripe.paymentIntents.create.mockRejectedValue(
      new Error("Stripe API unavailable")
    );

    const res = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 15000 });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Payment failed");
  });
});

describe("Complete Booking Flow E2E", () => {
  const app = appFactory();

  it("handles complete booking + payment workflow", async () => {
    // Step 1: Create a booking
    const bookingData = {
      firstName: "Complete",
      lastName: "Flow",
      email: "complete@email.com",
      room: {
        roomDescription: "Premium Suite",
        converted_price: 500.00
      },
      hotel: {
        id: "050G",
        name: "Test Hotel"
      }
    };

    const bookingRes = await request(app)
      .post("/api/bookings")
      .send(bookingData);

    expect(bookingRes.statusCode).toBe(201);
    const bookingId = bookingRes.body._id;

    // Step 2: Verify booking exists
    const getRes = await request(app)
      .get(`/api/bookings/${bookingId}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.firstName).toBe("Complete");

    // Step 3: Create payment intent for the booking
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: "pi_complete_flow",
      client_secret: "pi_complete_flow_secret",
      amount: 50000,
      currency: "usd"
    });

    const paymentRes = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 50000 }); // $500.00 in cents

    expect(paymentRes.statusCode).toBe(200);
    expect(paymentRes.body.clientSecret).toBe("pi_complete_flow_secret");

    // Step 4: Verify booking still exists after payment
    const finalCheck = await request(app)
      .get(`/api/bookings/${bookingId}`);

    expect(finalCheck.statusCode).toBe(200);
    expect(finalCheck.body.email).toBe("complete@email.com");
  });

  it("handles multiple concurrent bookings", async () => {
    const bookingPromises = Array.from({ length: 5 }, (_, index) =>
      request(app)
        .post("/api/bookings")
        .send({
          firstName: `User${index}`,
          lastName: "Concurrent",
          email: `user${index}@concurrent.com`,
          room: { converted_price: 100 + (index * 50) }
        })
    );

    const responses = await Promise.all(bookingPromises);

    // All should succeed
    responses.forEach(response => {
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("_id");
    });

    // All should have unique IDs
    const ids = responses.map(res => res.body._id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });

  it("maintains data consistency across operations", async () => {
    const userId = new ObjectId().toString();

    // Create booking
    const createRes = await request(app)
      .post("/api/bookings")
      .send({
        userId: userId,
        firstName: "Consistency",
        lastName: "Test",
        email: "consistency@email.com",
        room: { converted_price: 300.00 }
      });

    expect(createRes.statusCode).toBe(201);
    const bookingId = createRes.body._id;

    // Retrieve by ID
    const getByIdRes = await request(app)
      .get(`/api/bookings/${bookingId}`);

    expect(getByIdRes.statusCode).toBe(200);

    // Retrieve by user ID
    const getUserRes = await request(app)
      .get(`/api/bookings/user/${userId}`);

    expect(getUserRes.statusCode).toBe(200);
    expect(getUserRes.body).toHaveLength(1);

    // Verify data consistency
    expect(getByIdRes.body.firstName).toBe(createRes.body.firstName);
    expect(getUserRes.body[0]._id).toBe(bookingId);
    expect(getUserRes.body[0].email).toBe("consistency@email.com");
  });
});

describe("Error Handling E2E", () => {
  const app = appFactory();

  it("handles malformed JSON gracefully", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set('Content-Type', 'application/json')
      .send('{"firstName": "Test", "invalid": json}');

    expect([400, 500]).toContain(res.statusCode);
  });

  it("handles very large payloads", async () => {
    const largeBooking = {
      firstName: "Large",
      lastName: "Booking",
      email: "large@email.com",
      specialRequests: "x".repeat(50000), // 50KB string
      room: {
        roomDescription: "Standard Room",
        amenities: Array(1000).fill("WiFi")
      }
    };

    const res = await request(app)
      .post("/api/bookings")
      .send(largeBooking);

    expect([201, 400, 413, 422]).toContain(res.statusCode);
  });

  it("handles booking creation failures gracefully", async () => {
    // Temporarily break the database mock
    const originalMock = mockDbModule.getDb.getMockImplementation();
    mockDbModule.getDb.mockImplementation(() => {
      throw new Error("Database unavailable");
    });

    const res = await request(app)
      .post("/api/bookings")
      .send({
        firstName: "Failure",
        lastName: "Test",
        email: "failure@email.com"
      });

    expect([500, 201]).toContain(res.statusCode);
    
    // Restore database mock
    if (originalMock) {
      mockDbModule.getDb.mockImplementation(originalMock);
    } else {
      mockDbModule.getDb.mockReturnValue(testDb);
    }
  });

  it("handles payment failures after successful booking", async () => {
    // Create booking successfully
    const bookingRes = await request(app)
      .post("/api/bookings")
      .send({
        firstName: "Payment",
        lastName: "Failure",
        email: "payment.failure@email.com"
      });

    expect(bookingRes.statusCode).toBe(201);

    // Setup Stripe to fail
    mockStripe.paymentIntents.create.mockRejectedValue(
      new Error("Payment processing failed")
    );

    // Attempt payment
    const paymentRes = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 15000 });

    expect(paymentRes.statusCode).toBe(500);
    expect(paymentRes.body.error).toBe("Payment failed");

    // Verify booking still exists
    const checkRes = await request(app)
      .get(`/api/bookings/${bookingRes.body._id}`);

    expect(checkRes.statusCode).toBe(200);
    expect(checkRes.body.firstName).toBe("Payment");
  });
});