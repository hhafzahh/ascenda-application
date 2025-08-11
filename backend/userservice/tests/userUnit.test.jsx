//UNIT TESTING
const userService = require("../userService");
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

