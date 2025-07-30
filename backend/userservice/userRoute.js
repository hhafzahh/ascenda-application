const express = require("express");
const router = express.Router();
const userController = require("./userController");
const authMiddleware = require("../middleware/auth");
//console.log(" userroute.js loaded");

router.post("/register", userController.register);

router.post("/login", userController.login);

//TESTT
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: "Secure profile", user: req.user });
});


module.exports = router;
