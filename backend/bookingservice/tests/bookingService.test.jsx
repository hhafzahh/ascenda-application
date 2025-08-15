const { ObjectId } = require("mongodb");

// Mock the database module
const mockDb = {
  collection: jest.fn()
};

jest.mock("../database/db", () => ({
  getDb: () => mockDb
}));

const bookingService = require("../bookingService");

describe("Booking Service Tests", () => {
  let mockCollection;
  let mockFind;
  let mockToArray;

  beforeEach(() => {
    // Create proper mock chain for find().toArray()
    mockToArray = jest.fn();
    mockFind = jest.fn(() => ({ toArray: mockToArray }));
    mockCollection = {
      find: mockFind
    };
    mockDb.collection.mockReturnValue(mockCollection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllBookings", () => {
    it("returns all bookings from database", async () => {
      const mockBookings = [
        {
          _id: new ObjectId(),
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@email.com",
          room: {
            roomDescription: "Deluxe King Room",
            converted_price: 150.00
          }
        },
        {
          _id: new ObjectId(),
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@email.com",
          room: {
            roomDescription: "Standard Double Room",
            converted_price: 120.00
          }
        }
      ];

      mockToArray.mockResolvedValueOnce(mockBookings);

      const result = await bookingService.getAllBookings();

      expect(mockDb.collection).toHaveBeenCalledWith("bookings");
      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(mockToArray).toHaveBeenCalled();
      expect(result).toEqual(mockBookings);
      expect(result).toHaveLength(2);
    });

    it("returns empty array when no bookings exist", async () => {
      mockToArray.mockResolvedValueOnce([]);

      const result = await bookingService.getAllBookings();

      expect(mockDb.collection).toHaveBeenCalledWith("bookings");
      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("returns single booking when only one exists", async () => {
      const singleBooking = [{
        _id: new ObjectId(),
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice.johnson@email.com",
        room: {
          roomDescription: "Premium Suite",
          converted_price: 300.00
        },
        specialRequests: "Late check-in"
      }];

      mockToArray.mockResolvedValueOnce(singleBooking);

      const result = await bookingService.getAllBookings();

      expect(result).toEqual(singleBooking);
      expect(result).toHaveLength(1);
      expect(result[0].specialRequests).toBe("Late check-in");
    });

    it("handles bookings with all possible fields", async () => {
      const completeBookings = [{
        _id: new ObjectId(),
        title: "Dr",
        firstName: "Robert",
        lastName: "Wilson",
        email: "robert.wilson@email.com",
        countryCode: "+44",
        mobile: "7700900123",
        bookingForSomeone: true,
        specialRequests: "Wheelchair accessible room",
        room: {
          roomDescription: "Accessible King Suite",
          converted_price: 250.00,
          amenities: ["WiFi", "Wheelchair Access", "Roll-in Shower"]
        },
        searchParams: {
          checkIn: "2024-03-01",
          checkOut: "2024-03-05",
          guests: 2,
          destinationId: "LON1"
        },
        hotel: {
          id: "hotel789",
          name: "Accessible Hotel London",
          address: "789 Barrier-Free Street, London"
        }
      }];

      mockToArray.mockResolvedValueOnce(completeBookings);

      const result = await bookingService.getAllBookings();

      expect(result).toEqual(completeBookings);
      expect(result[0].bookingForSomeone).toBe(true);
      expect(result[0].room.amenities).toContain("Wheelchair Access");
      expect(result[0].searchParams.destinationId).toBe("LON1");
    });

    it("handles bookings with minimal data", async () => {
      const minimalBookings = [{
        _id: new ObjectId(),
        firstName: "Min",
        lastName: "Data",
        email: "min@email.com"
      }];

      mockToArray.mockResolvedValueOnce(minimalBookings);

      const result = await bookingService.getAllBookings();

      expect(result).toEqual(minimalBookings);
      expect(result[0].firstName).toBe("Min");
      expect(result[0].room).toBeUndefined();
      expect(result[0].hotel).toBeUndefined();
    });

    it("throws error when database operation fails", async () => {
      const dbError = new Error("Database connection failed");
      mockToArray.mockRejectedValueOnce(dbError);

      await expect(bookingService.getAllBookings()).rejects.toThrow("Database connection failed");

      expect(mockDb.collection).toHaveBeenCalledWith("bookings");
      expect(mockCollection.find).toHaveBeenCalledWith({});
    });

    it("throws error when collection access fails", async () => {
      const collectionError = new Error("Collection not found");
      mockDb.collection.mockImplementationOnce(() => {
        throw collectionError;
      });

      await expect(bookingService.getAllBookings()).rejects.toThrow("Collection not found");
    });

    it("handles large number of bookings", async () => {
      // Generate 100 mock bookings
      const largeBookingSet = Array.from({ length: 100 }, (_, index) => ({
        _id: new ObjectId(),
        firstName: `User${index}`,
        lastName: `Test${index}`,
        email: `user${index}@email.com`,
        room: {
          roomDescription: `Room Type ${index % 5}`,
          converted_price: 100 + (index * 10)
        }
      }));

      mockToArray.mockResolvedValueOnce(largeBookingSet);

      const result = await bookingService.getAllBookings();

      expect(result).toHaveLength(100);
      expect(result[0].firstName).toBe("User0");
      expect(result[99].firstName).toBe("User99");
      expect(result[50].room.converted_price).toBe(600); // 100 + (50 * 10)
    });

    it("preserves ObjectId types in returned data", async () => {
      const objectId = new ObjectId();
      const bookingWithObjectId = [{
        _id: objectId,
        firstName: "Object",
        lastName: "Id",
        email: "object@email.com"
      }];

      mockToArray.mockResolvedValueOnce(bookingWithObjectId);

      const result = await bookingService.getAllBookings();

      expect(result[0]._id).toBeInstanceOf(ObjectId);
      expect(result[0]._id).toEqual(objectId);
    });

    it("handles bookings with null/undefined fields gracefully", async () => {
      const bookingsWithNulls = [{
        _id: new ObjectId(),
        firstName: "Null",
        lastName: "Fields",
        email: "null@email.com",
        room: null,
        hotel: undefined,
        specialRequests: null,
        searchParams: {
          checkIn: "2024-01-15",
          checkOut: null,
          guests: undefined
        }
      }];

      mockToArray.mockResolvedValueOnce(bookingsWithNulls);

      const result = await bookingService.getAllBookings();

      expect(result).toEqual(bookingsWithNulls);
      expect(result[0].room).toBeNull();
      expect(result[0].hotel).toBeUndefined();
      expect(result[0].specialRequests).toBeNull();
      expect(result[0].searchParams.checkOut).toBeNull();
    });

    it("calls database with correct collection name", async () => {
      mockToArray.mockResolvedValueOnce([]);

      await bookingService.getAllBookings();

      expect(mockDb.collection).toHaveBeenCalledWith("bookings");
      expect(mockDb.collection).toHaveBeenCalledTimes(1);
    });

    it("calls find with empty filter object", async () => {
      mockToArray.mockResolvedValueOnce([]);

      await bookingService.getAllBookings();

      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(mockCollection.find).toHaveBeenCalledTimes(1);
    });

    it("maintains data integrity of complex nested objects", async () => {
      const complexBooking = [{
        _id: new ObjectId(),
        firstName: "Complex",
        lastName: "Booking",
        email: "complex@email.com",
        room: {
          roomDescription: "Presidential Suite",
          converted_price: 500.00,
          amenities: [
            "WiFi",
            "Jacuzzi",
            "Private Balcony",
            "Butler Service",
            "Champagne Bar"
          ],
          images: ["suite1.jpg", "suite2.jpg", "suite3.jpg"],
          features: {
            bedType: "King",
            maxOccupancy: 4,
            squareFootage: 1200,
            hasKitchen: true
          }
        },
        searchParams: {
          checkIn: "2024-06-01",
          checkOut: "2024-06-07",
          guests: 3,
          destinationId: "NYC1",
          filters: {
            priceRange: [400, 600],
            amenities: ["WiFi", "Jacuzzi"],
            roomType: "suite"
          }
        },
        hotel: {
          id: "luxury-hotel-001",
          name: "The Grand Luxury Hotel",
          address: "1 Fifth Avenue, New York, NY 10001",
          rating: 5,
          images: ["hotel1.jpg", "hotel2.jpg"],
          contact: {
            phone: "+1-212-555-0100",
            email: "reservations@grandluxury.com"
          }
        }
      }];

      mockToArray.mockResolvedValueOnce(complexBooking);

      const result = await bookingService.getAllBookings();

      expect(result[0].room.features.hasKitchen).toBe(true);
      expect(result[0].room.amenities).toHaveLength(5);
      expect(result[0].searchParams.filters.priceRange).toEqual([400, 600]);
      expect(result[0].hotel.contact.phone).toBe("+1-212-555-0100");
      expect(result[0].hotel.rating).toBe(5);
    });
  });
});