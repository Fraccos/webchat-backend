import { dbUrl, apiPort, serverKey, serverCert } from "./Environment";
import express, { NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from 'http';
import https from 'https';
import fs from 'fs';
import { Response, Request } from "express";

import { usersRouter } from "./routes/users";
import { friendsRouter } from "./routes/friendshipRequests";
import { chatroomsRouter } from "./routes/chatrooms";
import AuthService from "./services/auth";
import { SocketService } from "./services/socket";


const app = express();
const server = https
.createServer(
      // Provide the private and public key to the server by reading each
      // file's content with the readFileSync() method.
  {
    key: fs.readFileSync(serverKey),
    cert: fs.readFileSync(serverCert),
  },
  app
)

mongoose.connect(dbUrl);
const db = mongoose.connection;

const authService = new AuthService(app);
authService.init()


app.use(express.json())
    .use(cors({credentials: true, origin: true}))

    //.use(express.static("../build"))

    .use('/api/users', usersRouter)
    .use("/api/friends", friendsRouter)
    .use('/api/chats', chatroomsRouter)

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
    server.listen(apiPort, () => {
        console.log(`Listening on port ${apiPort}`);
    }); 
});