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



// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error in getUserById:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Update user by ID
exports.updateUserById = async (req, res) => {
  try {
    const updatedUser = await userService.updateUserById(
      req.params.id,
      req.body
    );
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Error in updateUserById:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

exports.updatePassword = async (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  try {
    await userService.updatePassword(userId, currentPassword, newPassword);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error updating password:", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "Failed to update password" });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const result = await userService.deleteUserById(req.params.id);
    if (!result) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};