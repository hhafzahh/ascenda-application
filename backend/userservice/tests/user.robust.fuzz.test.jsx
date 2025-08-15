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

// ROBUSTNESS TESTING — PROFILE
// 1) setup user + token for fuzz
// 2) fuzz GET /api/user/:id (ids + auth)
// 3) fuzz PUT /api/user/profile (payload + auth)
// 4) fuzz PUT /api/user/profile/password (avoid success)
// 5) fuzz DELETE /api/user/profile (no valid token)

describe("Fuzz: PROFILE endpoints robustness", () => {
  const ctx = { email: null, password: "FuzzP@ss#123!", token: null, userId: null };

  beforeAll(async () => {
    ctx.email = `fuzzprof${Date.now()}@test.com`;

    const reg = await request(app)
      .post("/api/user/register")
      .send({ username: "fuzz-prof", email: ctx.email, password: ctx.password });

    expect([200, 201]).toContain(reg.statusCode);
    ctx.userId = reg.body.userId;

    const login = await request(app)
      .post("/api/user/login")
      .send({ email: ctx.email, password: ctx.password });

    expect(login.statusCode).toBe(200);
    ctx.token = login.body.token;
  });

  // helper: mixed Authorization header (none/junk/valid)
  const authHeaderArb = (validToken) =>
    fc.oneof(
      fc.constant(undefined),
      safeToken.map((t) => `Bearer ${t}`),
      safeToken,
      fc.constant(`Bearer ${validToken}`)
    );

  // helper: looks-like / weird ObjectId
  const objectIdish = fc.oneof(
    fc.array(fc.constantFrom(...'0123456789abcdef'), { minLength: 24, maxLength: 24 }).map(a => a.join("")),
    fc.string({ maxLength: 40 }),
    fc.constantFrom("", " ", "0", "deadbeef", "null", "undefined")
  ).map(String);

  // 2) GET /api/user/:id
  test("GET /api/user/:id — randomized id/auth => 200/400/401/403/404/500 (no leaks)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant(ctx.userId), objectIdish),
        authHeaderArb(ctx.token),
        async (id, auth) => {
          let req = request(app).get(`/api/user/${String(id)}`);
          if (auth !== undefined) req = req.set("Authorization", auth);
          const res = await req;

          expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_PROFILE_ID || "120", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_PROFILE_ID_MS || "8000", 10),
      }
    );
  });

  // 3) PUT /api/user/profile
  test("PUT /api/user/profile — randomized payload/auth => 2xx/4xx/500 (no leaks)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record(
          {
            username: fc.oneof(
              fc.string({ maxLength: 300 }),
              fc.constantFrom(undefined, null, "", 123, {}, [])
            ),
            // some backends accept 'name' too
            name: fc.oneof(
              fc.string({ maxLength: 300 }),
              fc.constantFrom(undefined, null, 123, {}, [])
            ),
          },
          { withDeletedKeys: true }
        ),
        authHeaderArb(ctx.token),
        async (body, auth) => {
          let req = request(app).put("/api/user/profile");
          if (auth !== undefined) req = req.set("Authorization", auth);
          const res = await req.send(body);

          expect([200, 204, 400, 401, 403, 422, 500]).toContain(res.statusCode);
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_PROFILE_UPDATE || "120", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_PROFILE_UPDATE_MS || "8000", 10),
      }
    );
  });

  // 4) PUT /api/user/profile/password  (avoid successful changes so token stays valid)
  test("PUT /api/user/profile/password — malformed/incorrect => 4xx/500 (no leaks)", async () => {
    const bodyArb = fc.record(
      {
        email: fc.oneof(fc.constant(ctx.email), fc.string({ maxLength: 260 }), fc.constant(undefined)),
        currentPassword: fc.oneof(fc.string({ maxLength: 200 }), fc.constantFrom(undefined, null, 123, {}, [])),
        newPassword: fc.string({ maxLength: 200 }),
        confirmPassword: fc.oneof(fc.string({ maxLength: 200 }), fc.constantFrom(undefined, null, 123, {}, [])),
      },
      { withDeletedKeys: true }
    );

    await fc.assert(
      fc.asyncProperty(
        bodyArb,
        authHeaderArb(ctx.token),
        async (body, auth) => {
          // force mismatch / wrong-current to avoid true success
          if (typeof body.newPassword === "string") body.confirmPassword = body.newPassword + "_x";
          if (body.currentPassword === ctx.password) body.currentPassword = ctx.password + "_y";

          let req = request(app).put("/api/user/profile/password");
          if (auth !== undefined) req = req.set("Authorization", auth);
          const res = await req.send(body);

          expect([400, 401, 403, 422, 500]).toContain(res.statusCode);
          noLeak(res);
        }
      ),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_PROFILE_PW || "120", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_PROFILE_PW_MS || "10000", 10),
      }
    );
  });

  // 5) DELETE /api/user/profile  (never send the valid token)
  test("DELETE /api/user/profile — random/missing auth (no valid token) => 401/403/404/405/500 (no leaks)", async () => {
    const noValidAuth = fc.oneof(
      fc.constant(undefined),
      safeToken.map((t) => `Bearer ${t}`),
      safeToken
    );

    await fc.assert(
      fc.asyncProperty(noValidAuth, async (auth) => {
        let req = request(app).delete("/api/user/profile");
        if (auth !== undefined) req = req.set("Authorization", auth);
        const res = await req;

        expect([401, 403, 404, 405, 500]).toContain(res.statusCode);
        noLeak(res);
      }),
      {
        numRuns: parseInt(process.env.FUZZ_RUNS_PROFILE_DELETE || "60", 10),
        interruptAfterTimeLimit: parseInt(process.env.FUZZ_LIMIT_PROFILE_DELETE_MS || "6000", 10),
      }
    );
  });
});
