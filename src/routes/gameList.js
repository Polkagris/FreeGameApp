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

// `https://store.steampowered.com/api/appdetails?appids=${gameId}&filters=price_overview&cc=no&l=en`
const getGameDetails = async (gameId) => {
  return await axios
    .get(`https://store.steampowered.com/api/appdetails?appids=${gameId}`)
    .then((res) => {
      if (!res.data[gameId].data) {
        console.log(
          "@@@@@@@@@@ SKIPPED - because of no data in object @@@@@@@@@@",
          res.data
        );
        return;
      }
      if (res.data[gameId].success == false) {
        console.error;
        throw "Game detail fetch failure";
        //return here too?
      }
      console.log(
        "RETURNING data[gameId] from getGameDetails fetch call.",
        res.data[gameId].data.steam_appid,
        " TYPE: " + res.data[gameId].data.type
      );

      if (!res.data[gameId].data.header_image) {
        console.log(
          res.data[gameId].data.steam_appid +
            "IS MISSING SOME DETAILS - header_image"
        );
      } else if (!res.data[gameId].data.name) {
        console.log(
          res.data[gameId].data.steam_appid + "IS MISSING SOME DETAILS - name"
        );
      } else if (!res.data[gameId].data.price_overview) {
        console.log(
          res.data[gameId].data.steam_appid +
            "IS MISSING SOME DETAILS - price_overview"
        );
      } else if (!res.data[gameId].data.short_description) {
        console.log(
          res.data[gameId].data.steam_appid +
            "IS MISSING SOME DETAILS - short_description"
        );
      } else if (!res.data[gameId].data.is_free) {
        console.log(
          res.data[gameId].data.steam_appid +
            "IS MISSING SOME DETAILS - is_free"
        );
      } else if (!res.data[gameId].data.genres[0].description) {
        console.log(
          res.data[gameId].data.steam_appid +
            "IS MISSING SOME DETAILS - description"
        );

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

  const gameDetailFromMap = newGameFromMap.slice(389, 409).map(async (game) => {
    timeOutVariable += 50;
    // setTimeout(async () => {
    const gameDetailId = game.gameId;

    console.log("&&&&&& game ID &&&&&&", gameDetailId);
    // gameId.data -> only if gameId.success == true
    if (canStillRun === true) {
      console.log("GAME: ", game);
      // Try my best!
      console.log(
        "---------------------------- GameIdArray ----------------------------:",
        gameIdArray
      );
      // gameDetailId

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

  await Game.insertMany(gameDetailFromMap);
  console.log("GAME DETAILS FROM MAP:", gameDetailFromMap);

  res.json("List of games successfully updated.");
});

module.exports = router;
