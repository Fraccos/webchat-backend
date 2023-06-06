const env = require("./Environment")
const express = require("express");
const mongoose = require("mongoose");

const app = express();
const usersRouter = require('./routes/users');

mongoose.connect(env.dbUrl);
const db = mongoose.connection;
db.once("open", () => {
    console.log(`Connected to DB ${env.dbUrl}`);
    app.listen(env.webPort, () => {
        console.log(`Listening on port ${env.webPort}`);
    });
});

app.use('/users', usersRouter)

app.get('/', (req, res) => {
    res.send("Benvenuto!")
})

//app.get('/users', (req, res) => {
//    res.json(userss)
//})

app.listen(3000, () => {
    console.log("App in ascolto")
  })

let userList = [];

app.post('/users', (req, res) => {
    const userss = req.body;


    console.log(userss);
    userList.push(userss);

    res.send('l utente è stato aggiunto ');
});