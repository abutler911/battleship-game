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
const bodyParser = require("body-parser");

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
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// MongoDB connection

mongoose
  .connect(dbConnectionStr, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB", error));

// Routes
app.get("/", (req, res) => {
  res.render("index", {
    layout: "layouts/main",
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
  });
});

app.get("/register", (req, res) =>
  res.render("register", { layout: "layouts/main" })
);
app.get("/login", (req, res) => {
  res.render("login", { layout: "layouts/main" });
});
app.post("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy((err) => {
      if (err) {
        console.log(
          "Error : Failed to destroy the session during logout.",
          err
        );
      }
      req.user = null;
      res.redirect("/");
    });
  });
});

app.post("/register", async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });

    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    if (req.body.password.length < 8) {
      return res.status(400).send("Password must be at least 8 characters");
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
    });

    await user.save();
    res.redirect("/login");
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

app.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      // If authentication failed, `user` will be set to false.
      // We could optionally redirect back to login page with a message.
      return res.redirect("/login");
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect("/"); // Upon successful login, redirect the user to the home page.
    });
  })(req, res, next);
});
//middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Use the middleware in a route.
app.get("/protected-route", ensureAuthenticated, (req, res) => {
  res.send("You are viewing the protected route!");
});

// Socket.IO events
io.on("connection", (socket) => {
  // handle socket events
});

// Start server
const PORT = 3000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
