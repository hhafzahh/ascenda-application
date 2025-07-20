const express = require("express");
const router = express.Router();
const userController = require("./userController");
//console.log(" userroute.js loaded");

router.post("/register", userController.register);

router.post("/login", userController.login);

module.exports = router;
