const userService = require("./userService");
const jwt = require("jsonwebtoken");

//http://localhost:3004/api/user/register
exports.register = async (req, res) => {
  try {
    const result = await userService.register(req.body);
    res
      .status(201)
      .json({ message: "User registered successfully", userId: result.userId });
  } catch (err) {
    console.error("Error IN controller - post req for user:", err);
    const status = err.status || 500;
    const message = err.message || "Failed to register user";
    res.status(status).json({ error: message });
  }
};
exports.login = async (req, res) => {
  try {
    const result = await userService.login(req.body);
    const { userId, email } = result;

    //generate jwt token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "1d" }
    );

    res.json({ message: "Login successful", token, userId });
  } catch (err) {
    console.error("Error in userController.login:", err);
    const status = err.status || 500;
    const message = err.message || "Login failed";
    res.status(status).json({ error: message });
  }
};

