//INTEGRATION TESTING

//load the env files
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("../index");
const request = require("supertest");

//for db connections
const dbClient = require("../database/db");
const { connect, cleanup } = require("../database/db");

const { ObjectId } = require("mongodb");

beforeAll(async () => {
    await connect(); //ensures db is connected before tests run
});

afterAll(async () => {
    await cleanup(); //closes MongoDB client
});

//test for CREATE BOOKING
describe("Booking Integration: /api/bookings", () => {
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

    it("should create booking successfully with valid data", async () => {
        const res = await request(app)
            .post("/api/bookings")
            .send(validBookingData);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("_id");
        expect(res.body).toHaveProperty("firstName", "John");
        expect(res.body).toHaveProperty("lastName", "Doe");
        expect(res.body).toHaveProperty("email", "john.doe@email.com");
        expect(res.body).toHaveProperty("status", "confirmed");
        expect(res.body).toHaveProperty("createdAt");
    });

    it("should create booking with minimal required data", async () => {
        const minimalData = {
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@email.com",
            room: {
                roomDescription: "Standard Room",
                converted_price: 120.00
            }
        };

        const res = await request(app)
            .post("/api/bookings")
            .send(minimalData);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("firstName", "Jane");
        expect(res.body).toHaveProperty("status", "confirmed");
        expect(res.body).toHaveProperty("createdAt");
    });

    it("should handle booking for someone else", async () => {
        const bookingForOther = {
            ...validBookingData,
            firstName: "Alice",
            lastName: "Johnson",
            email: "alice@email.com",
            bookingForSomeone: true
        };

        const res = await request(app)
            .post("/api/bookings")
            .send(bookingForOther);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("bookingForSomeone", true);
        expect(res.body).toHaveProperty("firstName", "Alice");
    });

    it("should store userId as string when provided as number", async () => {
        const bookingWithNumericUserId = {
            ...validBookingData,
            userId: 12345, // numeric userId
            firstName: "Sarah",
            email: "sarah@email.com"
        };

        const res = await request(app)
            .post("/api/bookings")
            .send(bookingWithNumericUserId);

        expect(res.statusCode).toBe(201);
        expect(res.body.userId).toBe("12345"); // should be converted to string

        // Verify in database
        const db = dbClient.getDb();
        const bookingInDb = await db.collection("bookings").findOne({
            _id: new ObjectId(res.body._id)
        });
        expect(bookingInDb.userId).toBe("12345");
    });

    it("should handle complex room data structure", async () => {
        const complexBooking = {
            ...validBookingData,
            firstName: "Complex",
            email: "complex@email.com",
            room: {
                roomDescription: "Presidential Suite",
                converted_price: 1500.00,
                amenities: ["WiFi", "24/7 Concierge", "Private Balcony", "Jacuzzi"],
                bedding: {
                    type: "King Size",
                    pillowMenu: ["Memory Foam", "Down Alternative"]
                },
                views: ["Ocean", "City"],
                size: { sqft: 1200, rooms: 3 }
            }
        };

        const res = await request(app)
            .post("/api/bookings")
            .send(complexBooking);

        expect(res.statusCode).toBe(201);
        expect(res.body.room.amenities).toHaveLength(4);
        expect(res.body.room.bedding.pillowMenu).toContain("Memory Foam");
        expect(res.body.room.size.sqft).toBe(1200);
    });
});

//test for GET BOOKING BY ID
describe("Booking Integration: /api/bookings/:id", () => {
    let testBookingId;

    beforeAll(async () => {
        // Create a test booking for retrieval tests
        const res = await request(app)
            .post("/api/bookings")
            .send({
                firstName: "TestGet",
                lastName: "User",
                email: "testget@email.com",
                room: {
                    roomDescription: "Test Room",
                    converted_price: 100.00
                }
            });
        
        expect(res.statusCode).toBe(201);
        testBookingId = res.body._id;
    });

    it("should return booking with valid ObjectId", async () => {
        const res = await request(app)
            .get(`/api/bookings/${testBookingId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("_id", testBookingId);
        expect(res.body).toHaveProperty("firstName", "TestGet");
        expect(res.body).toHaveProperty("email", "testget@email.com");
    });

    it("should return 404 when booking not found", async () => {
        const nonExistentId = new ObjectId().toString();
        const res = await request(app)
            .get(`/api/bookings/${nonExistentId}`);

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty("error", "Booking not found");
    });

    it("should return 400 for invalid ObjectId format", async () => {
        const res = await request(app)
            .get("/api/bookings/invalid-id-123");

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error", "Invalid booking ID format");
    });

    it("should handle 24-character hex string ObjectId", async () => {
        const hexStringId = "507f1f77bcf86cd799439011";
        // This will return 404 since it doesn't exist, but should not return 400
        const res = await request(app)
            .get(`/api/bookings/${hexStringId}`);

        expect([200, 404]).toContain(res.statusCode); // Either found or not found, but not invalid format
        if (res.statusCode === 404) {
            expect(res.body).toHaveProperty("error", "Booking not found");
        }
    });
});

//test for GET BOOKINGS BY USER ID
describe("Booking Integration: /api/bookings/user/:userId", () => {
    let ctx = { userId: null, bookingIds: [] };

    // Helper to create unique user identifier
    const makeUserId = (prefix = "user") => `${prefix}${Date.now()}`;

    beforeAll(async () => {
        ctx.userId = makeUserId();

        // Create multiple bookings for the same user
        const booking1Data = {
            userId: ctx.userId,
            firstName: "Multi",
            lastName: "Booking1",
            email: "multi1@email.com",
            hotel: { name: "Hotel A" },
            room: { roomDescription: "Room A", converted_price: 100 }
        };

        const booking2Data = {
            userId: ctx.userId,
            firstName: "Multi",
            lastName: "Booking2", 
            email: "multi2@email.com",
            hotel: { name: "Hotel B" },
            room: { roomDescription: "Room B", converted_price: 200 }
        };

        // Create first booking (older)
        const res1 = await request(app)
            .post("/api/bookings")
            .send(booking1Data);
        expect(res1.statusCode).toBe(201);
        ctx.bookingIds.push(res1.body._id);

        // Wait a moment to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create second booking (newer)
        const res2 = await request(app)
            .post("/api/bookings")
            .send(booking2Data);
        expect(res2.statusCode).toBe(201);
        ctx.bookingIds.push(res2.body._id);
    });

    it("should return all bookings for user sorted by createdAt desc", async () => {
        const res = await request(app)
            .get(`/api/bookings/user/${ctx.userId}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
        
        // Should be sorted by createdAt descending (newest first)
        expect(res.body[0].lastName).toBe("Booking2"); // newer booking first
        expect(res.body[1].lastName).toBe("Booking1"); // older booking second
        
        // Verify all bookings belong to the user
        res.body.forEach(booking => {
            expect(booking.userId).toBe(ctx.userId);
        });
    });

    it("should return empty array for user with no bookings", async () => {
        const userWithNoBookings = makeUserId("empty");
        const res = await request(app)
            .get(`/api/bookings/user/${userWithNoBookings}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(0);
    });

    it("should return 400 if userId is missing", async () => {
        const res = await request(app)
            .get("/api/bookings/user/"); // empty userId

        expect(res.statusCode).toBe(400); // Express routing handles this
    });

    it("should handle userId consistency (string vs number)", async () => {
        const uniqueNumericUserId = Date.now(); // Use unique ID to avoid conflicts
        
        // Create booking with numeric userId
        const bookingRes = await request(app)
            .post("/api/bookings")
            .send({
                userId: uniqueNumericUserId,
                firstName: "Numeric",
                lastName: "User",
                email: "numeric@email.com",
                room: { roomDescription: "Test", converted_price: 50 }
            });
        
        expect(bookingRes.statusCode).toBe(201);
        expect(bookingRes.body.userId).toBe(uniqueNumericUserId.toString()); // stored as string

        // Retrieve using string userId
        const getRes = await request(app)
            .get(`/api/bookings/user/${uniqueNumericUserId}`);

        expect(getRes.statusCode).toBe(200);
        expect(getRes.body).toHaveLength(1);
        expect(getRes.body[0].userId).toBe(uniqueNumericUserId.toString());
        expect(getRes.body[0].firstName).toBe("Numeric");
    });
});

//test for complete booking workflow
describe("Booking Integration: Complete Workflow", () => {
    it("should create booking and then retrieve it successfully", async () => {
        const userId = `workflow${Date.now()}`;
        const bookingData = {
            userId,
            title: "Dr",
            firstName: "Workflow",
            lastName: "Test",
            email: "workflow@email.com",
            countryCode: "+1",
            mobile: "5551234567",
            specialRequests: "Ground floor room",
            room: {
                roomDescription: "Workflow Suite",
                converted_price: 300.00,
                amenities: ["WiFi", "Balcony"]
            },
            searchParams: {
                checkIn: "2024-04-01",
                checkOut: "2024-04-03",
                guests: 2
            },
            hotel: {
                id: "workflow123",
                name: "Workflow Hotel",
                address: "123 Workflow Street"
            }
        };

        // Step 1: Create booking
        const createRes = await request(app)
            .post("/api/bookings")
            .send(bookingData);

        expect(createRes.statusCode).toBe(201);
        expect(createRes.body).toHaveProperty("_id");
        const bookingId = createRes.body._id;

        // Step 2: Get booking by ID
        const getByIdRes = await request(app)
            .get(`/api/bookings/${bookingId}`);

        expect(getByIdRes.statusCode).toBe(200);
        expect(getByIdRes.body._id).toBe(bookingId);
        expect(getByIdRes.body.firstName).toBe("Workflow");
        expect(getByIdRes.body.specialRequests).toBe("Ground floor room");

        // Step 3: Get all bookings for user
        const getUserBookingsRes = await request(app)
            .get(`/api/bookings/user/${userId}`);

        expect(getUserBookingsRes.statusCode).toBe(200);
        expect(getUserBookingsRes.body).toHaveLength(1);
        expect(getUserBookingsRes.body[0]._id).toBe(bookingId);
        expect(getUserBookingsRes.body[0].hotel.name).toBe("Workflow Hotel");
    });
});

//test for data persistence verification
describe("Booking Integration: Data Persistence", () => {
    it("should store booking data correctly in database", async () => {
        const testEmail = `persist${Date.now()}@example.com`;
        const bookingData = {
            firstName: "Persist",
            lastName: "Test",
            email: testEmail,
            specialRequests: "Extra towels",
            room: {
                roomDescription: "Persistence Room",
                converted_price: 175.50
            }
        };

        const res = await request(app)
            .post("/api/bookings")
            .send(bookingData);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("_id");

        // Verify data directly in database
        const db = dbClient.getDb();
        const bookingInDb = await db.collection("bookings").findOne({
            _id: new ObjectId(res.body._id)
        });

        expect(bookingInDb).toBeDefined();
        expect(bookingInDb.firstName).toBe("Persist");
        expect(bookingInDb.email).toBe(testEmail);
        expect(bookingInDb.specialRequests).toBe("Extra towels");
        expect(bookingInDb.room.converted_price).toBe(175.50);
        expect(bookingInDb.status).toBe("confirmed");
        expect(bookingInDb.createdAt).toBeInstanceOf(Date);
    });

    it("should handle very long special requests", async () => {
        const longRequest = "A".repeat(1000);
        const bookingData = {
            firstName: "Long",
            lastName: "Request",
            email: "long@email.com",
            specialRequests: longRequest,
            room: { roomDescription: "Test", converted_price: 100 }
        };

        const res = await request(app)
            .post("/api/bookings")
            .send(bookingData);

        expect(res.statusCode).toBe(201);
        expect(res.body.specialRequests).toBe(longRequest);

        // Verify in database
        const db = dbClient.getDb();
        const bookingInDb = await db.collection("bookings").findOne({
            _id: new ObjectId(res.body._id)
        });

        expect(bookingInDb.specialRequests).toBe(longRequest);
    });
});

//test for error handling with real database
describe("Booking Integration: Error Handling", () => {
    it("should handle database connection gracefully", async () => {
        // This test assumes your error handling is working
        // In a real scenario, you might temporarily close the DB connection
        const res = await request(app)
            .post("/api/bookings")
            .send({
                firstName: "Error",
                lastName: "Test",
                email: "error@email.com",
                room: { roomDescription: "Error Room", converted_price: 100 }
            });

        // Should either succeed or fail gracefully with proper error response
        if (res.statusCode >= 500) {
            expect(res.body).toHaveProperty("error");
            expect(res.body.error).toMatch(/failed to create booking/i);
        } else {
            expect(res.statusCode).toBe(201);
        }
    });
});