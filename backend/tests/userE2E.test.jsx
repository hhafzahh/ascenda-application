//load the env files
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("../userservice/app");
const request = require("supertest");

//for db connections
const dbClient = require("../database/db");
const { connect, cleanup } = require("../database/db");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

beforeAll(async () => {
    await connect(); //ensures db is connected before tests run
});

afterAll(async () => {
    await cleanup(); //closes MongoDB client
});

//E2E TESTING
//1. try access protected route wihtout token (failed)
//2. register user  
//3. login user
//4. login w the registered credentials
//5. access the protected route (successfully)
describe("User E2E Flow", () => {
  it("should simulate full flow: blocked, register, login, access", async () => {
    const email = `e2e${Date.now()}@test.com`;
    const password = "End2EndTest123";

    const failRes = await request(app).get("/api/user/profile");
    expect(failRes.statusCode).toBe(401);
    expect(failRes.body.error).toMatch(/missing or invalid token/i);

    const registerRes = await request(app)
      .post("/api/user/register")
      .send({
        username: "e2euser",
        email,
        password,
      });

    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.body).toHaveProperty("userId");

    const loginRes = await request(app)
      .post("/api/user/login")
      .send({ email, password });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty("token");

    const token = loginRes.body.token;

    const successRes = await request(app)
      .get("/api/user/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(successRes.statusCode).toBe(200);
    expect(successRes.body).toHaveProperty("message", "Secure profile");
  });
});


//ROUBUSTNESS
describe("User API Robustness", () => {
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