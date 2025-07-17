const express = require('express');
const router = express.Router();
const dbClient = require('../Models/db');

router.post('/register', async (req, res) => {
    console.log("/register called")
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }
    try {
        const db = dbClient.getDb();
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "Email already registered" });
        }
        const result = await db.collection('users').insertOne({ username, email, password });
        res.status(201).json({ message: "User registered successfully", userId: result.insertedId });
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ error: "Failed to register user" });
    }
});

router.post('/login', async (req, res) => {
    console.log("/login called")
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    try {
        const db = dbClient.getDb();
        const user = await db.collection('users').findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        res.json({ message: "Login successful", userId: user._id });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

module.exports = router;