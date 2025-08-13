//UNIT TESTING
const userService = require("../userService");
const userController = require("../userController");
const dbClient = require("../database/db");

const bcrypt = require("bcrypt");

jest.mock("../database/db");
jest.mock("bcrypt");

const mockUsersCollection = {
    findOne: jest.fn(),
    insertOne: jest.fn()
};

const mockDb = {
    collection: () => mockUsersCollection
};

dbClient.getDb.mockReturnValue(mockDb);

const SALT_ROUNDS = 10;

describe("User Unit: userService.register", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should throw 400 if fields are missing", async () => {
        await expect(userService.register({})).rejects.toThrow("All fields are required");
    });

    it("should throw 409 if email already registered", async () => {
        mockUsersCollection.findOne.mockResolvedValue({ email: "test@example.com" });

        await expect(
            userService.register({ username: "test", email: "test@example.com", password: "123" })
        ).rejects.toThrow("Email already registered");
    });

    it("should hash password and insert user", async () => {
        mockUsersCollection.findOne.mockResolvedValue(null);
        mockUsersCollection.insertOne.mockResolvedValue({ insertedId: "mockId123" });
        bcrypt.hash.mockResolvedValue("hashedPassword123");

        const result = await userService.register({
            username: "testuser",
            email: "unique@example.com",
            password: "mypassword"
        });

        expect(bcrypt.hash).toHaveBeenCalledWith("mypassword", SALT_ROUNDS);
        expect(mockUsersCollection.insertOne).toHaveBeenCalledWith({
            username: "testuser",
            email: "unique@example.com",
            password: "hashedPassword123"
        });
        expect(result).toEqual({ userId: "mockId123" });
    });
    it("should throw if DB fails to insert", async () => {
        mockUsersCollection.findOne.mockResolvedValue(null);
        mockUsersCollection.insertOne.mockRejectedValue(new Error("DB Insert failed"));

        await expect(userService.register({
            username: "test",
            email: "fail@example.com",
            password: "123"
        })).rejects.toThrow("DB Insert failed");
    });
    it("should throw if bcrypt.hash fails", async () => {
        mockUsersCollection.findOne.mockResolvedValue(null);
        bcrypt.hash.mockRejectedValue(new Error("Hashing failed"));

        await expect(userService.register({
            username: "test",
            email: "failhash@example.com",
            password: "123"
        })).rejects.toThrow("Hashing failed");
    });
});

describe("User Unit: userService.login", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should throw 400 if email or password is missing", async () => {
        await expect(userService.login({})).rejects.toThrow("Email and password are required");
    });

    it("should throw 401 if user not found", async () => {
        mockUsersCollection.findOne.mockResolvedValue(null);

        await expect(
            userService.login({ email: "nonexistent@example.com", password: "test" })
        ).rejects.toThrow("Invalid email or password");
    });

    it("should throw 401 if password does not match", async () => {
        mockUsersCollection.findOne.mockResolvedValue({
            email: "user@example.com",
            password: "hashed"
        });
        bcrypt.compare.mockResolvedValue(false);

        await expect(
            userService.login({ email: "user@example.com", password: "wrongpass" })
        ).rejects.toThrow("Invalid email or password");
    });

    it("should return userId and email if login succeeds", async () => {
        const mockUser = {
            _id: "user123",
            email: "user@example.com",
            password: "hashedpassword"
        };
        mockUsersCollection.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);

        const result = await userService.login({
            email: "user@example.com",
            password: "correctpassword"
        });

        expect(result).toEqual({ userId: "user123", email: "user@example.com" });
    });
    it("should throw if DB connection fails", async () => {
        dbClient.getDb.mockImplementation(() => { throw new Error("DB error") });

        await expect(userService.login({
            email: "fail@example.com",
            password: "123"
        })).rejects.toThrow("DB error");
    });
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  return res;
};
const makeNext = () => jest.fn();

describe("Controller Unit: getUserById (GET /:id)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 with user when found", async () => {
    const req = { params: { id: "abc" } };
    const res = makeRes();
    jest.spyOn(userService, "getUserById").mockResolvedValue({ _id: "abc", email: "e@e.com" });

    await userController.getUserById(req, res);

    expect(userService.getUserById).toHaveBeenCalledWith("abc");
    expect(res.status).not.toHaveBeenCalled(); // default 200
    expect(res.json).toHaveBeenCalledWith({ _id: "abc", email: "e@e.com" });
  });

  it("returns 404 when not found", async () => {
    const req = { params: { id: "missing" } };
    const res = makeRes();
    jest.spyOn(userService, "getUserById").mockResolvedValue(null);

    await userController.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("returns 500 on service error", async () => {
    const req = { params: { id: "abc" } };
    const res = makeRes();
    jest.spyOn(userService, "getUserById").mockRejectedValue(new Error("boom"));

    await userController.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch user" });
  });
});

describe("Controller Unit: updateUserById (PUT /:id)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 with message + updated user", async () => {
    const req = { params: { id: "abc" }, body: { username: "Neo" } };
    const res = makeRes();
    jest.spyOn(userService, "updateUserById").mockResolvedValue({ _id: "abc", username: "Neo" });

    await userController.updateUserById(req, res);

    expect(userService.updateUserById).toHaveBeenCalledWith("abc", { username: "Neo" });
    expect(res.json).toHaveBeenCalledWith({
      message: "User updated successfully",
      user: { _id: "abc", username: "Neo" },
    });
  });

  it("returns 404 when user not found", async () => {
    const req = { params: { id: "abc" }, body: { username: "Neo" } };
    const res = makeRes();
    jest.spyOn(userService, "updateUserById").mockResolvedValue(null);

    await userController.updateUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("returns 500 on service error", async () => {
    const req = { params: { id: "abc" }, body: {} };
    const res = makeRes();
    jest.spyOn(userService, "updateUserById").mockRejectedValue(new Error("db fail"));

    await userController.updateUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to update user" });
  });
});

describe("Controller Unit: updatePassword (PUT /:id/password)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 with success message", async () => {
    const req = {
      params: { id: "abc" },
      body: { currentPassword: "old", newPassword: "new!" },
    };
    const res = makeRes();
    jest.spyOn(userService, "updatePassword").mockResolvedValue({ ok: true });

    await userController.updatePassword(req, res);

    expect(userService.updatePassword).toHaveBeenCalledWith("abc", "old", "new!");
    expect(res.json).toHaveBeenCalledWith({ message: "Password updated successfully" });
  });

  it("propagates status/message from service error", async () => {
    const req = {
      params: { id: "abc" },
      body: { currentPassword: "bad", newPassword: "new!" },
    };
    const res = makeRes();
    const err = new Error("Invalid current password");
    err.status = 401;
    jest.spyOn(userService, "updatePassword").mockRejectedValue(err);

    await userController.updatePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid current password" });
  });
});

describe("Controller Unit: deleteUserById (DELETE /:id)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 200 with success message when deletion truthy", async () => {
    const req = { params: { id: "abc" } };
    const res = makeRes();
    jest.spyOn(userService, "deleteUserById").mockResolvedValue({ deletedCount: 1 });

    await userController.deleteUserById(req, res);

    expect(userService.deleteUserById).toHaveBeenCalledWith("abc");
    expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });
  });

  it("returns 404 when service returns falsy", async () => {
    const req = { params: { id: "missing" } };
    const res = makeRes();
    jest.spyOn(userService, "deleteUserById").mockResolvedValue(null);

    await userController.deleteUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("returns 500 on service error", async () => {
    const req = { params: { id: "abc" } };
    const res = makeRes();
    jest.spyOn(userService, "deleteUserById").mockRejectedValue(new Error("db fail"));

    await userController.deleteUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to delete user" });
  });
});

