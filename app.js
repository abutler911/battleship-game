const express = require("express");
const app = express();
const server = require("http").createServer(app);
const mongoose = require("mongoose");
const io = require("socket.io")(server);
const Game = require("./models/Game.js");
const User = require("./models/User");
const bcrypt = require("bcrypt");
require("dotenv").config();

let db;

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.u1a62ze.mongodb.net/?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB", error);
  });

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/add-user", async (req, res) => {
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = new User({
    username: "testuser",
    password: hashedPassword,
  });

  try {
    await user.save();
    res.send("User saved");
  } catch (err) {
    console.error(err);
    res.send("Error saving user");
  }
});

io.on("connection", (socket) => {
  // handle socket events
});

server.listen(3000, () => console.log("Server is running on port 3000"));
