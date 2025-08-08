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

