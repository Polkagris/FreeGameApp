const router = require("express").Router();
const axios = require("axios");
let List = require("../models/list.model");
let Game = require("../models/game.model");

const getGameList = async () => {
  try {
    let result = await axios.get(
      "http://api.steampowered.com/ISteamApps/GetAppList/v2/"
    );
    // console.log(
    //   "------------------ @@ RESULT: @@ ------------------",
    //   result.data.applist
    // );
    return result.data.applist.apps;
  } catch (error) {
    console.error(error);
  }
};

const getGameDetails = async gameId => {
  return await axios
    .get(
      `https://store.steampowered.com/api/appdetails?appids=${gameId}&cc=no&l=en`
    )
    .then(res => {
      if (res.data[gameId].success == false) {
        throw `No game details for id: ${gameId}`;
      }
      return res.data[gameId];
    })
    .catch(err => {
      console.log("error: ", err);
      return err;
    });
};

// Save game list to DB
router.route("/").post(async (req, res) => {
  // Do fetch call
  const gameListFromFetch = await getGameList();
  // Save list to db
  const newGameFromMap = gameListFromFetch.map(app => {
    const gameId = app.appid;
    const gameName = app.name;
    const source = "Steam";

    // New GameList item
    const newGame = new List({
      gameId: gameId,
      gameName: gameName,
      source: source
    });
    return newGame;
  });
  // List.insertMany(newGameFromMap);

  // Total calls = 94599 + 1
  let canStillRun = true;

  // console.log("NEW GAME FROM MAP:", newGameFromMap);

  newGameFromMap.slice(0, 99).map(async game => {
    const gameDetailId = game.gameId;

    console.log("&&&&&& gameDetailId &&&&&&", gameDetailId);
    // gameId.data -> only if gameId.success == true
    if (canStillRun === true) {
      console.log("GAME ID: ", game);
      const gameDetail = await getGameDetails(gameDetailId);
      if (!gameDetail) {
        canStillRun = false;
        return;
      }

      // Write only free games to DB.
      /* if (!gameDetail.data.is_free) {
        return;
      } */

      return new Game({
        gameId: gameDetailId,
        gameImage: gameDetail.data.header_image,
        gameName: gameDetail.data.name,
        gamePrice: gameDetail.data.price_overview
          ? gameDetail.data.price_overview.final / 100
          : null,
        gameDescription: gameDetail.data.short_description,
        gameIsFree: gameDetail.data.is_free,
        gameGenres: gameDetail.data.genres[0].description
      })
        .save()
        .then(res => console.log("Game Written to DB: ", res))
        .catch(err => console.log(err));
    }
  });
  // Game.insertMany(gameDetailFromMap);
  res.json("List of games successfully updated.");
});

module.exports = router;
