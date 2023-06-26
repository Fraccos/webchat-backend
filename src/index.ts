import { dbUrl, webPort } from "./Environment";
import express, { NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Server, Socket } from "socket.io";
import http from 'http';
import https from 'https';
import fs from 'fs';
import { Response, Request } from "express";

import { usersRouter } from "./routes/users";
import { friendsRouter } from "./routes/friendshipRequests";
import { chatroomsRouter } from "./routes/chatrooms";
import { IUser } from "./models/interfaces/users";
import AuthService from "./services/auth";
import { SocketService } from "./services/socket";


const app = express();
const server = https
.createServer(
      // Provide the private and public key to the server by reading each
      // file's content with the readFileSync() method.
  {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
  },
  app
)

mongoose.connect(dbUrl);
const db = mongoose.connection;

const authService = new AuthService(app);
authService.init()


app.use(express.json())
.use(cors({credentials: true, origin: true}))
    .use('/users', usersRouter)
    .use("/friends", friendsRouter)
    .use('/chats', chatroomsRouter)
    .get('/', (req, res) => {
        res.json({message: "ok"});
    })
    .get("/login", (req, res) => {
        res.json({msg: "not authenticated"});
    })

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


db.once("open", () => {
    console.log(`Connected to DB ${dbUrl}`);
    SocketService.init(server);
    server.listen(webPort, () => {
        console.log(`Listening on port ${webPort}`);
    }); 
});