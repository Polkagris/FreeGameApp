const router = require("express").Router();
const axios = require("axios");
let List = require("../models/list.model");
let Game = require("../models/game.model");

const getGameList = async () => {
  try {
    let result = await axios.get(
      "http://api.steampowered.com/ISteamApps/GetAppList/v2/"
    );
    console.log(
      "------------------ @@ RESULT: @@ ------------------",
      result.data.applist
    );
    return result.data.applist.apps;
  } catch (error) {
    console.error(error);
  }
};

const getGameDetails = async (gameId) => {
  try {
    let gameDetail = await axios.get(
      `https://store.steampowered.com/api/appdetails?appids=${gameId}&cc=no&l=en`
    ).data;

    console.log(
      "------------------ @@ GAME DETAIL: @@ ------------------",
      gameDetail[gameId]
    );
    if (gameDetail[gameId].success == false) {
      throw "Game detail fetch failure";
    }
    return gameDetail[gameId];
  } catch (error) {
    console.error(error);
    return;
  }
};

// Save game list to DB
router.route("/").post(async (req, res) => {
  // Do fetch call
  const gameListFromFetch = await getGameList();
  // Save list to db
  const newGameFromMap = gameListFromFetch.map((app) => {
    const gameId = app.appid;
    const gameName = app.name;
    const source = "Steam";

    // New GameList item
    const newGame = new List({
      gameId: gameId,
      gameName: gameName,
      source: source,
    });
    return newGame;
  });
  // List.insertMany(newGameFromMap);

  // Total calls = 94599 + 1
  let canStillRun = true;

  console.log("NEW GAME FROM MAP:", newGameFromMap);

  const gameDetailFromMap = newGameFromMap.slice(10, 15).map((game) => {
    // gameId.data -> only if gameId.success == true
    if (canStillRun === true) {
      console.log("GAME ID: ", game);
      const gameDetail = getGameDetails(game.gameId);
      if (!gameDetail) {
        canStillRun = false;
        return;
      }
      return new Game({
        gameId: game.gameId,
        gameImage: gameDetail.data.header_image,
        gameName: gameDetail.data.name,
        gamePrice: gameDetail.data.price_overview.final / 100,
        gameDescription: gameDetail.data.short_description,
        gameIsFree: gameDetail.data.is_free,
        gameGenres: gameDetail.data.genres[0].description,
      });
    }
  });
  //Game.insertMany(gameDetailFromMap);
  console.log("GAME DETAILS FROM MAP:", gameDetailFromMap);
  res.json("List of games successfully updated.");
});

module.exports = router;
