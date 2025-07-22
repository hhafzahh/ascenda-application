//express app entry for user service
//port = 3004

const { connect } = require("./Models/db");

console.log("Starting UserService...");

const express = require("express");
const cors = require("cors");
const app = express();

const userRouter = require("./userRoute");

app.use(cors());
app.use(express.json());

app.use("/api/user", userRouter);

const PORT = process.env.PORT || 3004;

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
