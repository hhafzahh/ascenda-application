//db.js is shared with userService and bookingService.
const { MongoClient } = require("mongodb");
require("dotenv").config(); //need the path cuz both folders use the env var

const connection_str = process.env.MONGODB_CONNECTIONSTR;
const client = new MongoClient(connection_str);
const dbName = "hotelbookingdb";

<<<<<<<< HEAD:backend/bookingservice/Models/db.js
const client = new MongoClient(connection_str);
========
//const client = new MongoClient(connection_str);
// let db = null;

// async function connect() {
//     try {
//         await client.connect();
//         db = client.db(dbName);
//         console.log("Connected to MongoDB");
//     } catch (error) {
//         console.error("Database connection failed:", error);
//         throw error;
//     }
// }
>>>>>>>> new-details-page:backend/database/db.js

let db = null;

async function connect() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not connected. Call connect() first.");
  }
  return db;
}

async function cleanup() {
  await client.close();
}

module.exports = { connect, getDb, cleanup };
