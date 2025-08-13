const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("../app");
const request = require("supertest");
const fc = require("fast-check");
const { connect, cleanup } = require("../database/db");

beforeAll(async () => { await connect(); });
afterAll(async () => { await cleanup(); });

// Let CI override; default 30s per file
jest.setTimeout(parseInt(process.env.FUZZ_TEST_TIMEOUT || "30000", 10));

// ensure no stack traces / internals leak to clients
const noLeak = (res) => {
  const s = JSON.stringify(res.body ?? {});
  expect(s).not.toMatch(/BSONError|stack|node_modules|ObjectId/i);
};

// header‑safe token generator (avoids raw unicode/control chars)
const safeChar = fc.constantFrom(
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-"
);
const safeToken = fc.array(safeChar, { maxLength: 300 }).map(a => a.join(""));

// register
describe("Fuzz: /api/user/register robustness", () => {
  test("randomized username/email/password never crash; returns 201/400/409", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ maxLength: 200 }),
          email: fc.oneof(fc.emailAddress(), fc.string({ maxLength: 260 })), // mix valid/invalid
          password: fc.string({ maxLength: 2000 }),
        }),
        async ({ username, email, password }) => {
          const res = await request(app)
            .post("/api/user/register")
            .send({ username, email, password });

          expect([201, 400, 409]).toContain(res.statusCode);
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_REGISTER || "200", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_REGISTER_MS || "10000", 10),
      }
    );
  });
});

//login
describe("Fuzz: /api/user/login robustness", () => {
  test("malformed payloads => 200/400/401/404/500 (never crash)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record(
          {
            email: fc.oneof(
              fc.emailAddress(),
              fc.string({ maxLength: 200 }),
              fc.constantFrom(undefined, null, 123, {}, [])
            ),
            password: fc.oneof(
              fc.string({ maxLength: 200 }),
              fc.constantFrom(undefined, null, 123, {}, [])
            ),
          },
          { withDeletedKeys: true } // randomly omit keys
        ),
        async (body) => {
          const res = await request(app).post("/api/user/login").send(body);
          expect([200, 400, 401, 404, 500]).toContain(res.statusCode);
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_LOGIN || "200", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_LOGIN_MS || "10000", 10),
      }
    );
  });

  test("missing/garbage Content-Type never crashes", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ maxLength: 200 }), // body
        fc.constantFrom("", "text/plain", "application/x-www-form-urlencoded"), // header
        async (raw, contentType) => {
          let req = request(app).post("/api/user/login");
          if (contentType) req = req.set("Content-Type", contentType);
          const res = await req.send(raw);

          expect([200, 400, 401, 415, 500]).toContain(res.statusCode);
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_LOGIN_CT || "100", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_LOGIN_CT_MS || "6000", 10),
      }
    );
  });
});

// protected route - profule
describe("Fuzz: /api/user/profile Authorization header", () => {
  test("random Authorization header => 200/401 (never 5xx)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(undefined),             // no header
          safeToken.map(t => `Bearer ${t}`),  // bearer-ish token
          safeToken                           // weird non-bearer value
        ),
        async (auth) => {
          let req = request(app).get("/api/user/profile");
          if (auth !== undefined) req = req.set("Authorization", auth);
          const res = await req;

          expect([200, 401]).toContain(res.statusCode);
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_PROFILE || "200", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_PROFILE_MS || "12000", 10),
      }
    );
  });
});