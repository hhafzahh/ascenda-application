//db.js is shared with userService and bookingService.
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: "./.env" }); //need the path cuz both folders use the env var

let client;
let db;

const dbName = "hotelbookingdb";

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