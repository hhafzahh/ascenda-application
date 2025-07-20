const dbClient = require("../Models/db");

//No request or response should be in service layer, service layer only deals with logic
exports.register = async (userData) => {
  console.log("/register called");
  const { username, email, password } = userData;
  if (!username || !email || !password) {
    //return res.status(400).json({ error: "All fields are required" });
    const error = new Error("All fields are required");
    error.status = 400;
    throw error;
  }

  const db = dbClient.getDb();

  const existingUser = await db.collection("users").findOne({ email });
  if (existingUser) {
    //return res.status(409).json({ error: "Email already registered" });
    const error = new Error("Email already registered");
    error.status = 409;
    throw error;
  }
  const result = await db
    .collection("users")
    .insertOne({ username, email, password });
  return { userId: result.insertedId };

  //   res.status(201).json({
  //     message: "User registered successfully",
  //     userId: result.insertedId,
  //   });
};

exports.login = async (userData) => {
  console.log("/login called");
  const { email, password } = userData;
  if (!email || !password) {
    const error = new Error("Emaill and password are required");
    error.status = 400;
    throw error;
  }

  const db = dbClient.getDb();
  const user = await db.collection("users").findOne({ email });
  if (!user || user.password !== password) {
    const error = new Error("Invalid email or password");
    error.status = 409;
    throw error;
    //return res.status(401).json({ error: "Invalid email or password" });
  }

  return { userId: user._id };
};
