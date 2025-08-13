const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const authMiddleware = require("../middleware/auth");
const httpMocks = require("node-mocks-http");

const verifySpy = jest.spyOn(jwt, "verify");

describe("authMiddleware", () => {
  it("should return 401 if Authorization header is missing", () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();

    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData().error).toMatch(/missing or invalid token/i);
  });

  it("should return 401 if token is invalid", () => {
    const req = httpMocks.createRequest({
      headers: { authorization: "Bearer invalid.token.here" },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData().error).toMatch(/invalid or expired token/i);
  });

  it("should call next() if token is valid", () => {
    const payload = { userId: "testUser" };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    const req = httpMocks.createRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject(payload);
  });
  it("returns 401 when verify throws TokenExpiredError", () => {
  verifySpy.mockImplementation(() => { 
    const e = new Error("jwt expired");
    e.name = "TokenExpiredError";
    throw e;
  });
  const req = httpMocks.createRequest({ headers: { authorization: "Bearer whatever" } });
  const res = httpMocks.createResponse();
  const next = jest.fn();

  authMiddleware(req, res, next);

  expect(res.statusCode).toBe(401);
  expect(next).not.toHaveBeenCalled();
});
});