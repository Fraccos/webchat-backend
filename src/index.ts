import { dbUrl, webPort } from "./Environment";
import express, { NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Server, Socket } from "socket.io";
import http from 'http';
import { Response, Request } from "express";

import { usersRouter } from "./routes/users";
import { friendsRouter } from "./routes/friendshipRequests";
import { chatroomsRouter } from "./routes/chatrooms";
import { IUser } from "./models/interfaces/users";
import AuthService from "./services/auth";
import { SocketService } from "./services/socket";


const app = express();
const server = http.createServer(app);

mongoose.connect(dbUrl);
const db = mongoose.connection;

const authService = new AuthService(app);
authService.init()


app.use(express.json())
.use(cors())
.use((err:Error, req:Request,  res:Response, next:NextFunction) => {
    if (res.headersSent) {
        return next(err)
    }
    console.error(err.stack)
    res.status(500).json({
        status: "error",
        msg: err.toString()
    })
})
.use('/users', usersRouter)
.use("/friends", friendsRouter)
.use('/chats', chatroomsRouter)
.get('/', (req, res) => {
    res.json({message: "ok"});
})
.get("/login", (req, res) => {
    res.json({msg: "not authenticated"});
});


db.once("open", () => {
    console.log(`Connected to DB ${dbUrl}`);
    SocketService.init(server);
    server.listen(webPort, () => {
        console.log(`Listening on port ${webPort}`);
    }); 
});