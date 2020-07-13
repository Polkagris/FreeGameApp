const router = require("express").Router();
const axios = require("axios");
let List = require("../models/list.model");
let Game = require("../models/game.model");

const getGameList = async () => {
  try {
    // let result = await axios.get(
    //   "http://api.steampowered.com/ISteamApps/GetAppList/v2/"
    // );
    const dbListOfGames = await List.find({}, (error, dbGameList) => {
      if (error) return handleError(error);
      return dbGameList;
    }).limit(20);
    // console.log(
    //   "------------------ @@ RESULT: @@ ------------------",
    //   result.data.applist
    // );
    // return result.data.applist.apps;
    return dbListOfGames;
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
    .catch((err) => {
      console.log("error: ", err);
      return err;
    });
};

router.route("/").post(async (req, res) => {
  const gameListFromFetch = await getGameList();
  gameListFromFetch.slice(0, 19).map((game) => {
    console.log("Game from db:", game);

    const gameId = game.appid;
    const gameName = game.name;
    const source = "Steam";

    // New GameList item
    const newGame = new List({
      gameId: gameId,
      gameName: gameName,
      source: source,
    });
    return newGame;
  });
  // console.log("Game list from db:", testGameSlicedList);

  // // Save list to db
  // const newGameFromMap = gameListFromFetch.map((app) => {
  //   const gameId = app.appid;
  //   const gameName = app.name;
  //   const source = "Steam";

  //   // New GameList item
  //   const newGame = new List({
  //     gameId: gameId,
  //     gameName: gameName,
  //     source: source,
  //   });
  //   return newGame;
  // });
  // // List.insertMany(newGameFromMap);

  // Total calls = 94599 + 1
  let canStillRun = true;

  const gameDetailFromMap = gameListFromFetch.map(async (game) => {
    let timeOutVariable = 50;
    // setTimeout(async () => {
    const gameDetailId = game.gameId;

    console.log("&&&&&& game ID &&&&&&", gameDetailId);

    if (canStillRun === true) {
      console.log("GAME: ", game);

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
        gameGenres: gameDetail.data.genres[0].description,
      })
        .save()
        .then((res) => console.log("Game Written to DB: ", res))
        .catch((err) => console.log(err));
    }
  });

  await Game.insertMany(gameDetailFromMap);
  console.log("GAME DETAILS FROM MAP:", gameDetailFromMap);

  res.json("List of games successfully updated.");
});

module.exports = router;
