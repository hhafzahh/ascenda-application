//load the env files
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("../app");
const request = require("supertest");

//for db connections
const { connect, cleanup } = require("../database/db");

beforeAll(async () => {
    await connect(); //ensures db is connected before tests run
});

afterAll(async () => {
    await cleanup(); //closes MongoDB client
});

describe("Hotel Robust: User API Robustness", () => {
  it("should reject extremely long email/password on register", async () => {
    const res = await request(app).post("/api/user/register").send({
      username: "a".repeat(5000),
      email: `${"a".repeat(5000)}@test.com`,
      password: "a".repeat(5000),
    });
    expect([400, 500]).toContain(res.statusCode);
  });

  it("should handle invalid email format on login", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "not-an-email",
      password: "whatever",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("should handle special characters in fields", async () => {
    const res = await request(app).post("/api/user/register").send({
      username: "<script>alert('XSS')</script>",
      email: "injection@example.com",
      password: "' OR 1=1 --",
    });

    expect([400, 201,409]).toContain(res.statusCode);
  });

  it("should handle missing Content-Type header gracefully", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .set("Content-Type", "") // clearing content-type
      .send("not-json");

    //it should not crash the server
    expect([400, 415, 500]).toContain(res.statusCode);
  });
});