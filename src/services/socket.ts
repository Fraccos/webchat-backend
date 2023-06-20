import { Server, Socket } from "socket.io";
import http from "http";
import AuthService from "./auth";

import { IUser } from "../models/interfaces/users";



export const usersSocket = new Map<string, Socket>();
export const listenersMap = new Map<string, socketCallback>();


export type fnCallback = (...args: any[]) => void
export type socketCallback = (socket:Socket,...args: any[]) => void

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
            [...listenersMap.keys()].forEach( key =>
                socket.on(key, (...args:any) => listenersMap.get(key)(socket, ...args) )
            )
            console.log(`+ IN: ${user._id}`);
            socket.on('disconnect', function() {
                usersSocket.delete(user._id)
                console.log(`- OUT: ${user._id}`);
             });
        });
    }

    static on(eventName: string, callback:socketCallback) {
        listenersMap.set(eventName, callback);
    }   

    static sendAll(usersID: string[], event: string,message: string) { //si può riscrivere usando il sistema built-in in socket.io di Rooms?
        usersID.forEach( id => {
            const socket = usersSocket.get(id);
            if (socket !== undefined) {
                socket.send(event, message);
                //socket.emit(event, JSONdata); per inviare un oggetto utilizzabile da React
            }
        })
    }


}