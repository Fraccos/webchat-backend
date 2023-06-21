import { dbUrl, webPort } from "./Environment";
import express, { NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { usersRouter } from "./routes/users";
import AuthService from "./services/auth";
import { Server, Socket } from "socket.io";
import http from 'http';
import { SocketService } from "./services/socket";
import { addMessageSocket } from "./controllers/chatrooms";
import { IUser } from "./models/interfaces/users";
import { chatroomsRouter } from "./routes/chatrooms";
import { Response, Request } from "express";

const app = express();
const server = http.createServer(app);

mongoose.connect(dbUrl);
const db = mongoose.connection;

const authService = new AuthService(app);
authService.init()


app.use(express.json())
    .use(cors())
    
    
    .use('/users', usersRouter)
    .use('/chats', chatroomsRouter)
    
    .get('/', (req, res) => {
        res.json({message: "ok"});
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
    SocketService.on("onNewMessage", async (socket:Socket, chatroomId:string, msg:string) => {
        const user = socket.data.user as IUser;
        try {
            await addMessageSocket(user, chatroomId,msg )
        }
        catch (error) {
            console.error(error);
        }
        
    }) 
    server.listen(webPort, () => {
        console.log(`Listening on port ${webPort}`);

        
    }); 
});