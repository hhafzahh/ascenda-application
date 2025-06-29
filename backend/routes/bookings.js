const express = require('express');
const router = express.Router();
const dbClient = require('../Models/db');

router.get('/', async (req, res) => {
    try {
        const db = dbClient.getDb();
        const bookings = await db.collection('bookings').find({}).toArray();
        res.json(bookings);
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

module.exports = router;