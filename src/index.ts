import { dbUrl, webPort } from "./Environment";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { usersRouter } from "./routes/users";
import AuthService from "./services/auth";

const app = express();
mongoose.connect(dbUrl);
const db = mongoose.connection;

const authService = new AuthService(app);
authService.init()

app.use(express.json())
.use(cors())
.use('/users', usersRouter)
.get('/', (req, res) => {
    res.json({message: "ok"});
});

db.once("open", () => {
    console.log(`Connected to DB ${dbUrl}`);
    app.listen(webPort, () => {
        console.log(`Listening on port ${webPort}`);
    });
});