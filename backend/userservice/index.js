//express app entry for user service
//port = 3004
const app = require("./app");
const PORT = process.env.PORT || 3004;

const { connect } = require("./database/db");

console.log("Starting UserService...");

(async () => {
  try {
    await connect();
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`User Service is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
})();
