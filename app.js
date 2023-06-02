const express = require("express");
const session = require("express-session");
const http = require("http");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const expressLayouts = require("express-ejs-layouts");

const Game = require("./models/Game");
const User = require("./models/User");

// Load env variables
dotenv.config();

const dbConnectionStr = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.u1a62ze.mongodb.net/?retryWrites=true&w=majority`;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Set up session handling
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: dbConnectionStr }),
  })
);

// Set up passport for authentication
app.use(passport.initialize());
app.use(passport.session());

const LocalStrategy = require("passport-local").Strategy;

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });

      if (!user) {
        return done(null, false, { message: "No user with that username" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Incorrect password" });
      }
    } catch (err) {
      done(err);
    }
  })
);

// Serialize and deserialize user instances to and from the session.
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Set up express app
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(expressLayouts);

// MongoDB connection

mongoose
  .connect(dbConnectionStr, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB", error));

// Routes
app.get("/", (req, res) => res.render("index", { layout: "layouts/main" }));

app.post("/register", async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = new User({
    username: req.body.username,
    password: hashedPassword,
  });

  await user.save();
  res.redirect("/login");
});

app.post("/login", passport.authenticate("local"), (req, res) => {
  res.redirect("/");
});

// Socket.IO events
io.on("connection", (socket) => {
  // handle socket events
});

// Start server
const PORT = 3000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
