const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const listSchema = new Schema({
  gameId: {
    type: Number,
    required: true,
    unique: true,
    trim: true,
  },
  gameName: {
    type: String,
  },
  source: {
    type: String,
  },
});

const List = mongoose.model("List", listSchema);

module.exports = List;
