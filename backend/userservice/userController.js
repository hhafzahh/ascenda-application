const userService = require("./userService");

//http://localhost:3003/api/user/register
exports.register = async (req, res) => {
  try {
    const result = await userService.register(req.body);
    res
      .status(201)
      .json({ message: "User registered successfully", userId: result.userId });
  } catch (err) {
    console.error("Error IN controller - post req for user:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
};

exports.login = async (req, res) => {
  console.log("test,", req.body);
  try {
    const result = await userService.login(req.body);
    console.log(result);
    res.json({ message: "Login successful", userId: result.userId });
  } catch (err) {
    console.error("Error in userController.login:", err);
    const status = err.status || 500;
    const message = err.message || "Login failed";
    res.status(status).json({ error: message });
  }
};
