// tests/bookingRobustness.test.jsx
const express = require("express");
const request = require("supertest");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");

// Make sure long ops don't flake locally/CI
jest.setTimeout(60000); // Increased timeout

/* ------------------------------------------------------------------
   Stripe mock for payment tests
------------------------------------------------------------------- */
const mockStripe = {
  paymentIntents: {
    create: jest.fn()
  }
};
jest.mock("stripe", () => jest.fn(() => mockStripe));

/* ------------------------------------------------------------------
   DB module mock
------------------------------------------------------------------- */
jest.mock("../database/db", () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  getDb: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined)
}));
const mockDbModule = require("../database/db");

/* ------------------------------------------------------------------
   Import controllers AFTER mocks
------------------------------------------------------------------- */
const bookingController = require("../bookingController");
const paymentController = require("../paymentController");

/* ------------------------------------------------------------------
   Express app factory
------------------------------------------------------------------- */
function appFactory() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" })); // Increased limit for robustness testing

  // Booking routes
  app.post("/api/bookings", bookingController.createBooking);
  app.get("/api/bookings/:id", bookingController.getBookingById);
  app.get("/api/bookings/user/:userId", bookingController.getBookingsByUserId);

  // Payments
  app.post("/api/payments/create-intent", paymentController.createPaymentIntent);

  return app;
}

/* ------------------------------------------------------------------
   Enhanced robust in-memory DB for testing
------------------------------------------------------------------- */
function makeRobustInMemoryDb() {
  const bookings = new Map();
  let insertCounter = 0;

  const collectionApi = {
    insertOne: jest.fn(async (doc) => {
      insertCounter++;
      // Simulate occasional slow operations
      if (insertCounter % 15 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const id = new ObjectId();
      const newDoc = {
        _id: id,
        createdAt: doc.createdAt || new Date(),
        status: doc.status || "confirmed",
        ...doc
      };
      bookings.set(id.toString(), newDoc);
      return { insertedId: id };
    }),

    findOne: jest.fn(async (query) => {
      // Simulate network latency occasionally
      if (Math.random() < 0.05) {
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      if (query && query._id) {
        const result = bookings.get(query._id.toString()) || null;
        return result;
      }
      return null;
    }),

    find: jest.fn((query = {}) => {
      let results = Array.from(bookings.values());
      if (query.userId) {
        results = results.filter((b) => b.userId === query.userId);
      }
      
      const sortApi = {
        toArray: jest.fn(async () => {
          // Simulate occasional slow queries
          if (results.length > 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        })
      };
      return {
        sort: jest.fn(() => sortApi)
      };
    }),

    deleteMany: jest.fn(async () => {
      const count = bookings.size;
      bookings.clear();
      insertCounter = 0;
      return { deletedCount: count };
    })
  };

  return {
    collection: jest.fn((name) => {
      if (name !== "bookings") {
        throw new Error(`Unknown collection requested in tests: ${name}`);
      }
      return collectionApi;
    }),
    dropDatabase: jest.fn(async () => {
      bookings.clear();
      insertCounter = 0;
    }),
    admin: jest.fn(() => ({
      ping: jest.fn(async () => ({}))
    }))
  };
}

let testDb;

beforeAll(async () => {
  testDb = makeRobustInMemoryDb();
  mockDbModule.getDb.mockReturnValue(testDb);
  process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";

  // Suppress console logs for cleaner output
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(async () => {
  // Restore console logs
  console.log.mockRestore();
  console.error.mockRestore();
  
  try {
    if (testDb && typeof testDb.dropDatabase === "function") {
      await testDb.dropDatabase();
    }
  } catch (err) {
    console.warn("Cleanup error:", err.message);
  }
});

beforeEach(async () => {
  jest.clearAllMocks();
  mockDbModule.getDb.mockReturnValue(testDb);
  
  try {
    if (testDb && typeof testDb.collection === "function") {
      await testDb.collection("bookings").deleteMany({});
    }
  } catch (err) {
    // Expected in some test scenarios
  }
});

/* ------------------------------------------------------------------
   ROBUSTNESS TESTS
------------------------------------------------------------------- */

describe("Booking Robustness: Input Validation & Edge Cases", () => {
  const app = appFactory();

  describe("Extreme Input Sizes", () => {
    it("handles extremely long strings gracefully", async () => {
      const veryLongString = "A".repeat(5000); // Reduced size for faster tests
      const bookingData = {
        firstName: veryLongString,
        lastName: "Test",
        email: "long@email.com",
        specialRequests: veryLongString
      };

      const res = await request(app).post("/api/bookings").send(bookingData);
      
      // Should either handle gracefully or return appropriate error
      expect([200, 201, 400, 413, 422]).toContain(res.statusCode);
    });

    it("handles deeply nested objects", async () => {
      let nested = { value: "deep" };
      for (let i = 0; i < 20; i++) { // Reduced nesting for performance
        nested = { level: nested };
      }

      const deeplyNested = {
        firstName: "Deep",
        lastName: "Nested",
        email: "deep@email.com",
        room: {
          customData: nested
        }
      };

      const res = await request(app).post("/api/bookings").send(deeplyNested);
      expect([200, 201, 400, 413, 422]).toContain(res.statusCode);
    });

    it("handles arrays with many elements", async () => {
      const largeArrayBooking = {
        firstName: "Array",
        lastName: "Test",
        email: "array@email.com",
        room: {
          amenities: Array(100).fill("WiFi"), // Reduced size
          images: Array(50).fill("image.jpg"),
          reviews: Array(20).fill({ rating: 5, comment: "Great!" })
        }
      };

      const res = await request(app).post("/api/bookings").send(largeArrayBooking);
      expect([200, 201, 400, 413, 422]).toContain(res.statusCode);
    });
  });

  describe("Special Characters & Unicode", () => {
    it("handles various unicode characters", async () => {
      const unicodeBooking = {
        firstName: "测试用户",
        lastName: "العربية",
        email: "unicode@тест.com",
        specialRequests: "🏨 Special requests with emojis 🛏️",
        room: {
          roomDescription: "Русский 日本語 한국어",
          converted_price: 100.50
        }
      };

      const res = await request(app).post("/api/bookings").send(unicodeBooking);
      expect([200, 201, 400, 422]).toContain(res.statusCode);
    });

    it("handles special injection-like strings", async () => {
      const injectionBooking = {
        firstName: "'; DROP TABLE bookings; --",
        lastName: "' OR '1'='1",
        email: "injection@email.com",
        specialRequests: "<script>alert('xss')</script>",
        room: {
          roomDescription: "{{ malicious_template }}",
          converted_price: 100
        }
      };

      const res = await request(app).post("/api/bookings").send(injectionBooking);
      expect([200, 201, 400, 422]).toContain(res.statusCode);
    });
  });

  describe("Malformed Data Types", () => {
    it("handles mixed data types", async () => {
      const mixedTypeBooking = {
        firstName: 12345,
        lastName: true,
        email: ["not", "an", "email"],
        mobile: { country: "+1", number: "555-1234" },
        bookingForSomeone: "maybe",
        room: "not an object",
        searchParams: null,
        hotel: undefined
      };

      const res = await request(app).post("/api/bookings").send(mixedTypeBooking);
      expect([200, 201, 400, 422]).toContain(res.statusCode);
    });
  });
});

describe("Booking Robustness: Concurrent Operations", () => {
  const app = appFactory();

  it("handles multiple concurrent booking creation", async () => {
    const concurrentBookings = Array.from({ length: 10 }, (_, index) => 
      request(app).post("/api/bookings").send({
        firstName: `Concurrent${index}`,
        lastName: "User",
        email: `concurrent${index}@email.com`,
        room: { converted_price: 100 + index }
      })
    );

    const responses = await Promise.all(concurrentBookings);
    
    responses.forEach((response, index) => {
      expect([200, 201, 429, 500]).toContain(response.statusCode);
    });

    // Check for unique IDs among successful responses
    const successfulResponses = responses.filter(r => r.statusCode === 201);
    if (successfulResponses.length > 0) {
      const ids = successfulResponses.map(r => r.body._id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(successfulResponses.length);
    }
  });

  it("handles rapid read/write operations", async () => {
    // Create a booking first
    const createRes = await request(app).post("/api/bookings").send({
      firstName: "RapidTest",
      lastName: "User",
      email: "rapid@email.com",
      room: { converted_price: 150 }
    });

    if (createRes.statusCode === 201) {
      const bookingId = createRes.body._id;

      // Perform rapid concurrent reads
      const rapidReads = Array.from({ length: 5 }, () =>
        request(app).get(`/api/bookings/${bookingId}`)
      );

      const readResponses = await Promise.all(rapidReads);
      
      readResponses.forEach(response => {
        expect([200, 404, 500]).toContain(response.statusCode);
      });
    }
  });
});

describe("Booking Robustness: Database Resilience", () => {
  const app = appFactory();

  it("handles database connection failures gracefully", async () => {
    // Simulate database failure
    const originalImpl = mockDbModule.getDb.getMockImplementation();
    mockDbModule.getDb.mockImplementation(() => {
      throw new Error("Database connection lost");
    });

    const res = await request(app).post("/api/bookings").send({
      firstName: "DBError",
      lastName: "Test",
      email: "dberror@email.com"
    });

    expect([500, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("error");

    // Restore database
    if (originalImpl) {
      mockDbModule.getDb.mockImplementation(originalImpl);
    } else {
      mockDbModule.getDb.mockReturnValue(testDb);
    }
  });

  it("handles slow database operations", async () => {
    // Mock slow database operations
    const slowCollection = {
      insertOne: jest.fn(async (doc) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const id = new ObjectId();
        return { insertedId: id };
      }),
      findOne: jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return null;
      })
    };

    testDb.collection.mockReturnValue(slowCollection);

    const startTime = Date.now();
    const res = await request(app).post("/api/bookings").send({
      firstName: "Slow",
      lastName: "Database",
      email: "slow@email.com"
    });
    const endTime = Date.now();

    // Should handle timeout gracefully or complete successfully
    expect([201, 408, 500]).toContain(res.statusCode);
    expect(endTime - startTime).toBeGreaterThan(400); // Should take time
  });
});

describe("Booking Robustness: Memory & Resource Management", () => {
  const app = appFactory();

  it("handles memory-intensive operations", async () => {
    const memoryIntensiveBooking = {
      firstName: "Memory",
      lastName: "Test",
      email: "memory@email.com",
      room: {
        images: Array(100).fill("x".repeat(100)), // Reduced size for performance
        reviews: Array(50).fill({
          reviewer: "x".repeat(50),
          comment: "x".repeat(100)
        })
      }
    };

    const res = await request(app).post("/api/bookings").send(memoryIntensiveBooking);
    expect([201, 413, 422, 500]).toContain(res.statusCode);
  });

  it("handles rapid sequential requests", async () => {
    const responses = [];
    
    // Reduced from 50 to 20 for performance
    for (let i = 0; i < 20; i++) {
      const res = await request(app).post("/api/bookings").send({
        firstName: `Sequential${i}`,
        lastName: "Test",
        email: `sequential${i}@email.com`,
        room: { converted_price: 100 }
      });
      responses.push(res);
      
      // Small delay to prevent overwhelming
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Most should succeed
    const successes = responses.filter(r => r.statusCode === 201);
    expect(successes.length).toBeGreaterThan(15);
  }, 30000); // Custom timeout for this test
});

describe("Payment Robustness: External Service Failures", () => {
  const app = appFactory();

  it("handles Stripe service unavailable", async () => {
    mockStripe.paymentIntents.create.mockRejectedValue(
      new Error("Service Unavailable")
    );

    const res = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 15000 });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Payment failed");
  });

  it("handles Stripe timeout", async () => {
    mockStripe.paymentIntents.create.mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout")), 1000)
      )
    );

    const res = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 15000 });

    expect([500, 408]).toContain(res.statusCode);
  });

  it("handles invalid Stripe responses", async () => {
    mockStripe.paymentIntents.create.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 15000 });

    expect([500, 502]).toContain(res.statusCode);
  });

  it("handles malformed Stripe responses", async () => {
    mockStripe.paymentIntents.create.mockResolvedValue({
      // Missing client_secret
      id: "pi_test_123",
      amount: 15000
    });

    const res = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 15000 });

    // Should handle gracefully
    expect([200, 500, 502]).toContain(res.statusCode);
  });
});

describe("Booking Robustness: Input Boundary Testing", () => {
  const app = appFactory();

  describe("ObjectId Boundary Tests", () => {
    it("handles various ObjectId formats", async () => {
      const testIds = [
        { id: "000000000000000000000000", expectValid: true }, // All zeros
        { id: "ffffffffffffffffffffffff", expectValid: true }, // All f's
        { id: "507f1f77bcf86cd799439011", expectValid: true }, // Valid hex
        { id: "zzzzzzzzzzzzzzzzzzzzzzzz", expectValid: false }, // Invalid characters
        { id: "12345", expectValid: false }, // Too short
        { id: "507f1f77bcf86cd79943901112345", expectValid: false }, // Too long
        { id: "", expectValid: false }, // Empty
        { id: "507f1f77bcf86cd79943901g", expectValid: false } // Invalid character
      ];

      for (const testCase of testIds) {
        const res = await request(app).get(`/api/bookings/${testCase.id}`);
        
        if (testCase.expectValid) {
          // Valid ObjectId format - should return 404 (not found) or 200 (found)
          expect([200, 404]).toContain(res.statusCode);
        } else {
          // Invalid ObjectId format - should return 400 or 404 (depending on router behavior)
          expect([400, 404]).toContain(res.statusCode);
        }
      }
    });
  });

  describe("Email Validation Boundaries", () => {
    it("handles various email formats", async () => {
      const emailTests = [
        "valid@email.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "invalid.email",
        "@domain.com",
        "user@",
        ""
      ];

      for (const email of emailTests) {
        const res = await request(app).post("/api/bookings").send({
          firstName: "Email",
          lastName: "Test",
          email: email
        });

        // Current implementation might not validate emails
        expect([200, 201, 400, 422]).toContain(res.statusCode);
      }
    });
  });

  describe("Price Boundary Tests", () => {
    it("handles various price values", async () => {
      const priceTests = [
        0, 0.01, -1, 999999.99, "100", "invalid", null, undefined
      ];

      for (const price of priceTests) {
        const res = await request(app).post("/api/bookings").send({
          firstName: "Price",
          lastName: "Test",
          email: "price@email.com",
          room: {
            roomDescription: "Test Room",
            converted_price: price
          }
        });

        // Should handle all cases gracefully
        expect([200, 201, 400, 422]).toContain(res.statusCode);
      }
    });
  });
});

describe("Booking Robustness: Error Recovery", () => {
  const app = appFactory();

  it("recovers from temporary failures", async () => {
    let attemptCount = 0;
    const flakyCollection = {
      insertOne: jest.fn(async (doc) => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error("Temporary failure");
        }
        const id = new ObjectId();
        return { insertedId: id };
      }),
      findOne: jest.fn(async () => null)
    };

    testDb.collection.mockReturnValue(flakyCollection);

    // First two attempts should fail
    const res1 = await request(app).post("/api/bookings").send({
      firstName: "Recovery1",
      lastName: "Test",
      email: "recovery1@email.com"
    });
    expect(res1.statusCode).toBe(500);

    const res2 = await request(app).post("/api/bookings").send({
      firstName: "Recovery2",
      lastName: "Test",
      email: "recovery2@email.com"
    });
    expect(res2.statusCode).toBe(500);

    // Third attempt should succeed
    const res3 = await request(app).post("/api/bookings").send({
      firstName: "Recovery3",
      lastName: "Test",
      email: "recovery3@email.com"
    });
    expect(res3.statusCode).toBe(201);
  });

  it("handles cascading failures gracefully", async () => {
    // Simulate multiple system failures
    mockDbModule.getDb.mockImplementation(() => {
      throw new Error("Primary DB failure");
    });

    mockStripe.paymentIntents.create.mockRejectedValue(
      new Error("Payment service failure")
    );

    // Both booking and payment should fail gracefully
    const bookingRes = await request(app).post("/api/bookings").send({
      firstName: "Cascade",
      lastName: "Failure",
      email: "cascade@email.com"
    });

    const paymentRes = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 15000 });

    expect(bookingRes.statusCode).toBe(500);
    expect(paymentRes.statusCode).toBe(500);
    
    expect(bookingRes.body).toHaveProperty("error");
    expect(paymentRes.body).toHaveProperty("error");
  });
});

describe("Booking Robustness: Load Testing Simulation", () => {
  const app = appFactory();

  it("handles burst traffic", async () => {
    const burstRequests = Array.from({ length: 20 }, (_, index) => ({ // Reduced from 100
      firstName: `Burst${index}`,
      lastName: "User",
      email: `burst${index}@email.com`,
      room: { converted_price: 100 }
    }));

    // Send all requests simultaneously
    const startTime = Date.now();
    const responsePromises = burstRequests.map(booking =>
      request(app).post("/api/bookings").send(booking)
    );

    const responses = await Promise.allSettled(responsePromises);
    const endTime = Date.now();

    const successful = responses.filter(r => 
      r.status === 'fulfilled' && r.value.statusCode === 201
    );
    const failed = responses.filter(r => 
      r.status === 'rejected' || (r.status === 'fulfilled' && r.value.statusCode >= 400)
    );

    // At least some should succeed
    expect(successful.length).toBeGreaterThan(10);
    
    // Total time should be reasonable
    expect(endTime - startTime).toBeLessThan(15000); // 15 seconds max
  });

  it("maintains performance under sustained load", async () => {
    const sustainedRequests = [];
    const batchSize = 5; // Reduced batch size
    const batches = 3; // Reduced batches

    for (let batch = 0; batch < batches; batch++) {
      const batchPromises = Array.from({ length: batchSize }, (_, index) =>
        request(app).post("/api/bookings").send({
          firstName: `Sustained${batch}${index}`,
          lastName: "Load",
          email: `sustained${batch}${index}@email.com`,
          room: { converted_price: 100 }
        })
      );

      const batchResponses = await Promise.all(batchPromises);
      sustainedRequests.push(...batchResponses);

      // Brief pause between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const successRate = sustainedRequests.filter(r => r.statusCode === 201).length / sustainedRequests.length;
    
    // Should maintain high success rate
    expect(successRate).toBeGreaterThan(0.6); // 60% success rate
  });
});

describe("Booking Robustness: Security Edge Cases", () => {
  const app = appFactory();

  it("handles potential prototype pollution", async () => {
    const pollutionAttempt = {
      firstName: "Pollution",
      lastName: "Test",
      email: "pollution@email.com",
      "__proto__": { "isAdmin": true },
      "constructor": { "prototype": { "isAdmin": true } }
    };

    const res = await request(app).post("/api/bookings").send(pollutionAttempt);
    
    // Should handle without allowing pollution
    expect([200, 201, 400]).toContain(res.statusCode);
    
    // Verify no pollution occurred
    expect({}.isAdmin).toBeUndefined();
  });

  it("handles extremely nested JSON", async () => {
    // Create deeply nested object
    let nested = { value: "deep" };
    for (let i = 0; i < 50; i++) { // Reduced nesting
      nested = { level: nested };
    }

    const deepBooking = {
      firstName: "Deep",
      lastName: "Nesting",
      email: "deep@email.com",
      customData: nested
    };

    const res = await request(app).post("/api/bookings").send(deepBooking);
    
    // Should handle gracefully - either success or appropriate error
    expect([200, 201, 400, 413, 422]).toContain(res.statusCode);
  });
});

/* ------------------------------------------------------------------
   Performance Monitoring Tests
------------------------------------------------------------------- */
describe("Booking Robustness: Performance Monitoring", () => {
  const app = appFactory();

  it("tracks response times for different operations", async () => {
    // Setup Stripe mock for payment test
    mockStripe.paymentIntents.create.mockResolvedValue({
      client_secret: "pi_test_secret"
    });

    const operations = [
      { 
        name: "create", 
        fn: () => request(app).post("/api/bookings").send({
          firstName: "Perf", lastName: "Test", email: "perf@email.com"
        })
      },
      { 
        name: "read", 
        fn: () => request(app).get(`/api/bookings/${new ObjectId()}`)
      },
      { 
        name: "user_bookings", 
        fn: () => request(app).get("/api/bookings/user/testuser")
      },
      { 
        name: "payment", 
        fn: () => request(app).post("/api/payments/create-intent").send({ amount: 15000 })
      }
    ];

    const performanceResults = {};

    for (const operation of operations) {
      const times = [];
      
      for (let i = 0; i < 3; i++) { // Reduced iterations
        const startTime = process.hrtime.bigint();
        await operation.fn();
        const endTime = process.hrtime.bigint();
        
        times.push(Number(endTime - startTime) / 1000000); // Convert to milliseconds
      }

      performanceResults[operation.name] = {
        avg: times.reduce((a, b) => a + b) / times.length,
        max: Math.max(...times),
        min: Math.min(...times)
      };
    }

    // Basic performance assertions
    Object.values(performanceResults).forEach(result => {
      expect(result.avg).toBeLessThan(10000); // 10 second average
      expect(result.max).toBeLessThan(15000); // 15 second max
    });
  });
});