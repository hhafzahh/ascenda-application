const express = require("express");
const router = express.Router();
const userController = require("./userController");

// Register a new user
router.post("/register", userController.register);

// Log in user
router.post("/login", userController.login);

// Get user profile
router.get("/:id", userController.getUserById);

// Update user profile
router.put("/:id", userController.updateUserById);

// Update user password
router.put("/:id/password", userController.updatePassword);

// Delete user account
router.delete("/:id", userController.deleteUserById);



module.exports = router;
