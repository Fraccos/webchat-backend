import { Server, Socket } from "socket.io";
import http from "http";
import AuthService from "./auth";

import { IUser } from "../models/interfaces/users";



export const usersSocket = new Map<string, Socket>();
export const listenerMap = new Map<string, fnCallback>();


export type fnCallback = (...args: any[]) => void


export class SocketService {
    static init(server:http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>) {
        const io = new Server(server, {
            cors: {
                origin: '*'
            }
        });
        io.use(AuthService.authSocket);
    
        io.on("connection", (socket) => {
            const user = socket.data.user as IUser;
            usersSocket.set(user._id, socket);
            [...listenerMap.keys()].forEach( key =>
                socket.on(key, listenerMap.get(key))
            )
            console.log(`+ IN: ${user._id}`);
            socket.on('disconnect', function() {
                usersSocket.delete(user._id)
                console.log(`- OUT: ${user._id}`);
             });
        });
    }

    static on(eventName: string, callback:fnCallback) {
        listenerMap.set(eventName, callback);
    }

    static send(usersID: string[], event: string,message: string) {
        usersID.forEach( id => {
            const socket = usersSocket.get(id);
            if (socket !== undefined) {
                socket.send(event, message);
            }
        })
    }


}