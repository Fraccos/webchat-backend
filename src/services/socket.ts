import { Server, Socket } from "socket.io";
import http from "http";
import AuthService from "./auth";

import { IUser } from "../models/interfaces/users";
import { User } from "../models/users";
import { Notification } from "../models/notifications";
import mongoose, { Types } from "mongoose";
import { socketPort } from "../Environment";



export const usersSocket = new Map<string, Socket>();
export const listenersMap = new Map<string, socketCallback>();


export type socketCallback = (socket:Socket,...args: any[]) => void

export class SocketService {
    static init(server:http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>) {
        const io = new Server(socketPort, {
            cors: {
                origin: '*'
            }
        });
        io.use(AuthService.authSocket);
    
        io.on("connection", (socket) => {
            const user = socket.data.user as IUser;
            usersSocket.set(user._id.toString(), socket);
            [...listenersMap.keys()].forEach( key =>
                socket.on(key, (...args:any) => listenersMap.get(key)(socket, ...args) )
            )
            this.sendAll([user._id.toString()], "userConnected", {msg: "Benvenuto"});
            console.log(`+ IN: ${user._id}`);
            Notification.find({receiver: user._id}).then(notifications => {
                notifications.forEach(n => {
                    n.deleteOne().then(dN => socket.emit("offlineNotification", dN))
                });
            })
            User.findById(user._id).then(u => {
                const dstArray = u.friends.map((el: IUser) => el._id.toString()).filter((el: string) => usersSocket.has(el));
                SocketService.sendAll(dstArray, "friendOnline", {id: u._id}, false);
            })
            socket.on('disconnect', function() {
                usersSocket.delete(user._id);
                console.log(`- OUT: ${user._id}`);
                User.findById(user._id).then(u => {
                    const dstArray = u.friends.map((el: IUser) => el._id.toString()).filter((el: string) => usersSocket.has(el));
                    SocketService.sendAll(dstArray, "friendOffline", {id: u._id}, false);
                })
             });

        });
    }

    static on(eventName: string, callback:socketCallback) {
        listenersMap.set(eventName, callback);
    }   

    static sendAll(usersID: string[], event: string, object: any, sendOffline: boolean = true) {
        usersID.forEach( id => {
            const socket = usersSocket.get(id);
            if (socket !== undefined) {
                socket.emit(event, object);
            }
            else {
                console.error(`not found: ${id}, the socket is ${socket} despite having: ${[...usersSocket.keys()]}`);
                if (sendOffline) {
                    Notification.create({
                        receiver: new Types.ObjectId(id),
                        timestamp: new Date(),
                        event: event,
                        object: object
                    })
                }
            }
        })
    }


}