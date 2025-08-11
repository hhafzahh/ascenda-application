//db.js is shared with userService and bookingService. //cant do this based on prof comments
//so there is db.js per each service..
const { MongoClient } = require("mongodb");
require("dotenv").config(); //need the path cuz both folders use the env var

let client;
let db;

const dbName = "hotelbookingdb";

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


async function connect() {
  const connection_str = process.env.MONGODB_CONNECTIONSTR;
  if (!connection_str) {
    throw new Error("MONGODB_CONNECTIONSTR is not defined");
  }

  client = new MongoClient(connection_str);
  await client.connect();
  db = client.db(dbName);
  console.log("Connected to MongoDB");
}

function getDb() {
  if (!db) {
    throw new Error("Database not connected. Call connect() first.");
  }
  return db;
}

async function cleanup() {
  if (client) await client.close();
}

module.exports = { connect, getDb, cleanup };