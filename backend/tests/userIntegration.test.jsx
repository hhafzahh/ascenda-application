//INTEGRATION TESTING

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

//test for LOGIN
describe("User Integration: /api/user/login", () => {
    it("should return token and userId on valid credentials", async () => {
        const res = await request(app)
            .post("/api/user/login")
            .send({ email: "123@gmail.com", password: "123123" });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body).toHaveProperty("userId");
    });

    //missing email
    it("should return 400 if email is missing", async () => {
        const res = await request(app)
            .post("/api/user/login")
            .send({ email: "" });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    //missing password
    it("should return 400 if password is missing", async () => {
        const res = await request(app)
            .post("/api/user/login")
            .send({ password: "" });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error");
    });


    //no user found
    it("should return 401 if email is not registered", async () => {
        const res = await request(app)
            .post("/api/user/login")
            .send({ email: "fake@example.com", password: "123123" });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/invalid email or password/i);
    });

    //wrong password
    it("should return 401 if password is incorrect", async () => {
        const res = await request(app)
            .post("/api/user/login")
            .send({ email: "123@gmail.com", password: "wrongpassword" });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/invalid email or password/i);
    });

    //return token on successful login
    it("should return a valid JWT token on login", async () => {
        const res = await request(app)
            .post("/api/user/login")
            .send({ email: "123@gmail.com", password: "123123" });

        const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
        expect(decoded).toHaveProperty("userId");
        expect(decoded).toHaveProperty("email");
    });

    //deny routing to protected routes without token
    it("should deny access to protected route without token", async () => {
        const res = await request(app).get("/api/user/profile");
        expect(res.statusCode).toBe(401);
    });

    //allow routing to protected routes with token
    it("should allow access to protected route with valid token", async () => {
        const loginRes = await request(app)
            .post("/api/user/login")
            .send({ email: "123@gmail.com", password: "123123" });

        const res = await request(app)
            .get("/api/user/profile")
            .set("Authorization", `Bearer ${loginRes.body.token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Secure profile");
    });

    //deny routing with invalid token
    it("should deny access with invalid token", async () => {
        const res = await request(app)
            .get("/api/user/profile")
            .set("Authorization", "Bearer invalidtoken");

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/invalid or expired token/i);
    });

    //deny access with expired token
    it("should deny access with expired token", async () => {
        const payload = { userId: "abc123", email: "expired@test.com" };

        // token expires immediately
        const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "-1s" });

        const res = await request(app)
            .get("/api/user/profile")
            .set("Authorization", `Bearer ${expiredToken}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/invalid or expired token/i);
    });

});


//test for REGISTER
describe("User Integration: /api/user/register", () => {
    const uniqueEmail = `test${Date.now()}@example.com`;

    it("should register a new user with valid fields", async () => {
        const res = await request(app)
            .post("/api/user/register")
            .send({
                username: "testuser",
                email: uniqueEmail,
                password: "testpassword"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("message", "User registered successfully");
        expect(res.body).toHaveProperty("userId");
    });

    //missing params
    it("should fail with 400 if fields are missing", async () => {
        const res = await request(app)
            .post("/api/user/register")
            .send({ username: "onlyusername" });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/all fields are required/i);
    });

    //user exists 
    it("should fail with 409 if email already exists", async () => {
        const res = await request(app)
            .post("/api/user/register")
            .send({
                username: "testuser",
                email: uniqueEmail, // reuse the one that was already registered
                password: "testpassword"
            });

        expect(res.statusCode).toBe(409);
        expect(res.body.error).toMatch(/email already registered/i);
    });
    //allow user login straight after reg
    it("should allow login immediately after registration", async () => {
        const email = `freshlogin${Date.now()}@test.com`;
        const password = "newpass";

        await request(app).post("/api/user/register").send({
            username: "newuser",
            email,
            password
        });

        const res = await request(app).post("/api/user/login").send({
            email,
            password
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("token");
    });
});

//test for bcrypt
describe("User Integration: password hashing (bcrypt integration)", () => {
    it("should store hashed password (not plaintext) in db after registration", async () => {
        const testEmail = `hashcheck${Date.now()}@example.com`;
        const testPassword = "mysecret";

        const res = await request(app)
            .post("/api/user/register")
            .send({
                username: "HashTester",
                email: testEmail,
                password: testPassword,
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("userId");

        //verify the password stored in db is hashed
        const db = dbClient.getDb();
        const userInDb = await db.collection("users").findOne({ email: testEmail });

        expect(userInDb).toBeDefined();
        expect(userInDb.password).not.toBe(testPassword); //shouldnt be plaintext

        const passwordMatches = await bcrypt.compare(testPassword, userInDb.password);
        expect(passwordMatches).toBe(true); //should match original password
    });
});
