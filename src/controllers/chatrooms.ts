import { User } from "../models/users";
import { Chatroom } from "../models/chatrooms";
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { IUser } from "../models/interfaces/users";

export const createChatroom = (req:Request, res:Response, user: IUser) => {
    if (!req.body.members.find(user)) 
        throw new Error("Invalid chat")
        
    if (req.body.type === "single") {
        if (req.body.members.length !== 2) {
            throw new Error("Invalid number of members for a single chatroom")
        }
        if (Chatroom.find({type:"single", members:req.body.members})) {
            throw new Error("Already exists a private chatroom with those members")
        }
    } 
    else if (req.body.type === "group") {
        if (req.body.owners === undefined || req.body.owners.length < 1 ) {
            throw new Error("Every group must have at least one owner")
        }
        if (!req.body.owners.find(user)) {
            throw new Error("The owner must be also a member")
        }
    }
    Chatroom.create({
        type: req.body.roomType,
        members: req.body.members,
        timestamp: Date,
        messages: []
    }).then(u => res.json(u));
};
