const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const gameListRouter = require("./src/routes/gameList");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI || "mongodb://localhost:27017/";

console.log("@@@@@@@@@ MONGODB CONNECTION STRING @@@@@@@@@@ ", uri);

mongoose.connect(uri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

app.use("/list", gameListRouter);

app.listen(port, () => console.log(`App is listening at port ${port}`));
