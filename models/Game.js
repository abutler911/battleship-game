const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  state: {
    type: String,
    enum: ["waiting", "ongoing", "finished"],
    default: "waiting",
  },
  player1Board: {
    type: [[Number]],
    default: Array(10).fill(Array(10).fill(0)),
  },
  player2Board: {
    type: [[Number]],
    default: Array(10).fill(Array(10).fill(0)),
  },
  turn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Game", GameSchema);
