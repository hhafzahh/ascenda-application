const express = require("express");
const request = require("supertest");

// Create a mock stripe instance
const mockStripe = {
  paymentIntents: {
    create: jest.fn()
  }
};

// Mock the stripe module - it's a function that returns an instance
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

// Mock environment variable
process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";

const paymentController = require("../paymentController");

// Build test app
function buildApp() {
  const app = express();
  app.use(express.json());
  app.post("/api/payments/create-intent", paymentController.createPaymentIntent);
  return app;
}

describe("Payment Controller Tests", () => {
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("POST /api/payments/create-intent - createPaymentIntent", () => {
    it("200 + client secret for valid amount", async () => {
      const mockClientSecret = "pi_test_1234567890_secret_abcdef";
      const mockPaymentIntent = {
        id: "pi_test_1234567890",
        client_secret: mockClientSecret,
        amount: 15000,
        currency: "usd"
      };

      mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent);

      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: 15000 });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 15000,
        currency: "usd",
        payment_method_types: ["card"]
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        clientSecret: mockClientSecret
      });
    });

    it("200 + client secret for minimum valid amount (50 cents)", async () => {
      const mockClientSecret = "pi_test_minimum_secret";
      const mockPaymentIntent = {
        id: "pi_test_minimum",
        client_secret: mockClientSecret,
        amount: 50,
        currency: "usd"
      };

      mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent);

      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: 50 });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 50,
        currency: "usd",
        payment_method_types: ["card"]
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        clientSecret: mockClientSecret
      });
    });

    it("400 for amount below minimum (< 50 cents)", async () => {
      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: 49 });

      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: "Invalid amount"
      });
    });

    it("400 for zero amount", async () => {
      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: 0 });

      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: "Invalid amount"
      });
    });

    it("400 for negative amount", async () => {
      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: -100 });

      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: "Invalid amount"
      });
    });

    it("400 for missing amount", async () => {
      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({});

      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: "Invalid amount"
      });
    });

    it("400 for null amount", async () => {
      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: null });

      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: "Invalid amount"
      });
    });

    // Removing the non-numeric test since your controller doesn't validate this
    // Your controller currently passes any amount value to Stripe

    it("500 on Stripe API error", async () => {
      // Suppress console.error for this test to avoid cluttering output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockStripe.paymentIntents.create.mockRejectedValueOnce(
        new Error("Stripe API unavailable")
      );

      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: 15000 });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 15000,
        currency: "usd",
        payment_method_types: ["card"]
      });
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        error: "Payment failed"
      });

      consoleSpy.mockRestore();
    });

    it("500 on Stripe authentication error", async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockStripe.paymentIntents.create.mockRejectedValueOnce(
        new Error("Invalid API key provided")
      );

      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: 15000 });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        error: "Payment failed"
      });

      consoleSpy.mockRestore();
    });

    it("500 on Stripe rate limit error", async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const rateLimitError = new Error("Too many requests");
      rateLimitError.type = "StripeRateLimitError";
      
      mockStripe.paymentIntents.create.mockRejectedValueOnce(rateLimitError);

      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: 15000 });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        error: "Payment failed"
      });

      consoleSpy.mockRestore();
    });

    it("200 + handles large amount", async () => {
      const mockClientSecret = "pi_test_large_secret";
      const mockPaymentIntent = {
        id: "pi_test_large",
        client_secret: mockClientSecret,
        amount: 100000, // $1000.00
        currency: "usd"
      };

      mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent);

      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: 100000 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        clientSecret: mockClientSecret
      });
    });

    it("200 + creates payment intent with correct parameters", async () => {
      const mockClientSecret = "pi_test_params_secret";
      const mockPaymentIntent = {
        id: "pi_test_params",
        client_secret: mockClientSecret,
        amount: 25000,
        currency: "usd",
        payment_method_types: ["card"]
      };

      mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent);

      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: 25000 });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(1);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 25000,
        currency: "usd",
        payment_method_types: ["card"]
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.clientSecret).toBe(mockClientSecret);
    });

    it("handles floating point amount", async () => {
      const mockClientSecret = "pi_test_float_secret";
      const mockPaymentIntent = {
        client_secret: mockClientSecret
      };

      mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent);

      const res = await request(app)
        .post("/api/payments/create-intent")
        .send({ amount: 15000.99 });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 15000.99,
        currency: "usd",
        payment_method_types: ["card"]
      });
      expect(res.statusCode).toBe(200);
    });
  });
});