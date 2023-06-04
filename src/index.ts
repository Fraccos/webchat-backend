const env = require("./Environment")
const express = require("express");
const mongoose = require("mongoose");

const app = express();

mongoose.connect(env.dbUrl);
const db = mongoose.connection;
db.once("open", () => {
    console.log(`Connected to DB ${env.dbUrl}`);
    app.listen(env.webPort, () => {
        console.log(`Listening on port ${env.webPort}`);
    });
});