import { dbUrl, webPort } from "./Environment";
import express, { NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { usersRouter } from "./routes/users";
import AuthService from "./services/auth";
import { Server, Socket } from "socket.io";
import http from 'http';
import { addUser } from "./controllers/chatrooms";
const app = express();
const server = http.createServer(app);


mongoose.connect(dbUrl);
const db = mongoose.connection;

const authService = new AuthService(app);
authService.init()

app.use(express.json())
.use(cors())
.use('/users', usersRouter)
.get('/', (req, res) => {
    res.json({message: "ok"});
})
.get("/login", (req, res) => {
    res.json({msg: "not authenticated"});
});

db.once("open", () => {
    console.log(`Connected to DB ${dbUrl}`);
    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    });
    io.use(AuthService.authSocket);

    io.on("connection", (socket) => {
        socket.on("chatMessage", addUser)
        console.log("Ciao");
    });

    server.listen(webPort, () => {
        console.log(`Listening on port ${webPort}`);
    });
    
      
    
});