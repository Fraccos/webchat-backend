import { User } from "../models/users";
import { Chatroom } from "../models/chatrooms";
import { Request, Response } from 'express';
import { IUser } from "../models/interfaces/users";
import { IChatroom, IMessage } from "../models/interfaces/chatrooms";

const isMember = (chatroom: string, user: IUser) => Chatroom.findById(chatroom).then(c => c.members.find(user._id));
const isOwner = (chatroom: string, user: IUser) => Chatroom.findById(chatroom).then(c => c.owners.find(user._id));

export const createChatroom = (req:Request, res:Response, user: IUser) => {
    if (!req.body.members.find(user._id)) 
        throw new Error("Invalid chat")
        
    if (req.body.type === "single") {
        Chatroom.create({
            type: req.body.type,
            members: req.body.members,
            timestamp: Date.now(),
            messages: []
        }).then(u => res.json(u));
    } 
    else if (req.body.type === "group") {
        if (!req.body.owners.find(user._id)) {
            throw new Error("The owner must be also a member")
        }
        Chatroom.create({
            type: req.body.type,
            owners: req.body.owners,
            members: req.body.members,
            timestamp: Date.now(),
            messages: []
        }).then(u => res.json(u));
    }
};

export const addMember = (req:Request, res:Response, user: IUser) => {
    if((req.body.chatroom.type === "group" && !isOwner(req.body.chatroom._id, user)) || (req.body.chatroom.type === "single" && !isMember(req.body.chatroom._id, user))) {
        throw new Error("You're not a member of this chatroom");
    }
    Chatroom.findById(req.body.chatroom)
    .then(c => {
        c.members.push(req.body.newMember);
        return c.save();
    }).then(uC => {/*TODO: sends a message over Websocket to inform other members*/})
}

export const deleteChatroom = (req:Request, res:Response, user: IUser) => {
    if((req.body.chatroom.type === "group" && !isOwner(req.body.chatroom._id, user)) || (req.body.chatroom.type === "single" && !isMember(req.body.chatroom._id, user))) {
        throw new Error("You're not a member of this chatroom");
    }
    Chatroom.findByIdAndRemove(req.body.chatroom).exec()
    .then(dC => {/*TODO: sends a message over Websocket to inform other members*/})
}

export const addMessage = (req:Request, res:Response, user: IUser) => {
    if(!isMember(req.body.chatroom, user)) {
        throw new Error("You're not a member of this chatroom");
    }
    let message: IMessage = {
        sender: user._id,
        created: Date.now(),
        lastModified: Date.now(),
        readed: false,
        edited: false,
        content: [req.body.message]
    };
    Chatroom.findById(req.body.chatroom)
    .then(c => {
        c.messages.push(message);
        return c.save();
    }).then(uC => {/*TODO: sends a message over Websocket to inform other members*/})
}

export const editMessage = (req:Request, res:Response, user: IUser) => {
    if(!isMember(req.body.chatroom, user)) {
        throw new Error("You're not a member of this chatroom");
    }
    let message: IMessage = {
        sender: user._id,
        created: Date.now(),
        lastModified: Date.now(),
        readed: false,
        edited: false,
        content: [req.body.message]
    };
    Chatroom.findById(req.body.chatroom)
    .then(c => {
        c.messages.push(message);
        return c.save();
    }).then(uC => {/*TODO: sends a message over Websocket to inform other members*/})
}