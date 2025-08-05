const dbClient = require("../Models/db");
const { ObjectId } = require("mongodb");

// Register a new user
exports.register = async (userData) => {
  console.log("/register called");
  const { username, email, password } = userData;

  if (!username || !email || !password) {
    const error = new Error("All fields are required");
    error.status = 400;
    throw error;
  }

  const db = dbClient.getDb();
  const existingUser = await db.collection("users").findOne({ email });

  if (existingUser) {
    const error = new Error("Email already registered");
    error.status = 409;
    throw error;
  }

  const result = await db.collection("users").insertOne({
    username,
    email,
    password,
    gender: "",
    dob: ""
  });

  return { userId: result.insertedId };
};

// Login user
exports.login = async (userData) => {
  console.log("/login called");
  const { email, password } = userData;

  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.status = 400;
    throw error;
  }

  const db = dbClient.getDb();
  const user = await db.collection("users").findOne({ email });

  if (!user || user.password !== password) {
    const error = new Error("Invalid email or password");
    error.status = 409;
    throw error;
  }

  return { userId: user._id };
};

// Get user profile by ID
exports.getUserById = async (id) => {
  const db = dbClient.getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(id) },
    { projection: { password: 0 } } // Hide password
  );
  return user;
};

// Update user profile by ID
exports.updateUserById = async (id, updates) => {
  const db = dbClient.getDb();

  const { username, gender, dob } = updates;
  const result = await db.collection("users").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { username, gender, dob } },
    { returnDocument: "after" }
  );
  return result.value;
};

exports.updatePassword = async (userId, currentPassword, newPassword) => {
  const db = dbClient.getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (user.password !== currentPassword) {
    const error = new Error("Current password is incorrect");
    error.status = 401;
    throw error;
  }

  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { password: newPassword } }
  );
};

exports.deleteUserById = async (id) => {
  const db = dbClient.getDb();
  const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return null;
  }

  return true;
};

