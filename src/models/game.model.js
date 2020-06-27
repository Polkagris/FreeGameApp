const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const gameSchema = new Schema({
  gameId: {
    type: Number,
    required: true,
    unique: true,
    trim: true,
  },
  gameImage: {
    type: String,
  },
  gameName: {
    type: String,
  },
  gamePrice: {
    type: Number,
  },
  gameDescription: {
    type: String,
  },
  gameIsFree: {
    type: Boolean,
  },
  gameGenres: {
    type: String,
  },
});

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;
