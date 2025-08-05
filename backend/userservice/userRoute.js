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

// const token = localStorage.getItem("token");

// fetch("http://localhost:3004/api/profile", {
//   method: "GET",
//   headers: {
//     "Authorization": `Bearer ${token}`
//   }
// })
//   .then(res => res.json())
//   .then(data => console.log(data))
//   .catch(err => console.error("Unauthorized:", err));

module.exports = router;
