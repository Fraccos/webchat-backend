import { User } from "../models/users";
import { Chatroom } from "../models/chatrooms";
import { NextFunction, Request, Response } from 'express';
import { IUser } from "../models/interfaces/users";
import { IChatroom, IMessage } from "../models/interfaces/chatrooms";
import { isContext } from "vm";
import { Socket } from "socket.io";
import { SocketService } from "../services/socket";
import { Document, Types } from "mongoose";


interface AuthenticatedRequest extends Request {
    user?: IUser;
}
  

const isMember = async (chatroomId: string, user: IUser) => Chatroom.findById(chatroomId).then(c => { 
    if (c === null) {
        return false;
    }
    return c.members.includes(user._id)
});
const isOwner = async (chatroomId: string, user: IUser) => Chatroom.findById(chatroomId).then(c => { 
    if (c === null) {
        return false;
    }
    return c.owners.includes(user._id)
});

export const createChatroom = async (req:Request, res:Response, next: NextFunction) => {
    const user = req.user as IUser;
    const userId = user._id.toString();
    const members = req.body.members.sort();
    if (!req.body.members.includes(userId)) {
        next(new Error("Invalid chat"))
        return;
    }
    if (req.body.type === "single") {
        if (members.length !== 2) {
            next(new Error("Invalid number of members for a single chatroom"));
            return;
        }
        try {
            const found = await Chatroom.findOne({type:"single", members:members})
            if (found) {
                next(new Error("Already exists a single chatroom for those members"));
                return;
            }
        }
        catch (e) {
            console.error(e);
        }
        Chatroom.create({
            type: req.body.type,
            members: members,
            timestamp: Date.now(),
            messages: []
        }).then(u => {
            res.json(u);
            /*TODO: sends a message over Websocket to inform other members*/
        }).catch(next);
    }
    else if (req.body.type === "group") {
        if (!req.body.owners.find(req.body.userId))
            next(new Error("The owner must be also a member")) 
        else if (req.body.owners === undefined || !req.body.owners.includes(userId) ) 
            next(new Error("Every group must have at least one owner"))
        else {
            Chatroom.create({
                type: req.body.type,
                owners: req.body.owners,
                members: req.body.members,
                timestamp: Date.now(),
                messages: []
            }).then(u => {
                res.json(u);
                /*TODO: sends a message over Websocket to inform other members*/
            }).catch(next);
        }
    }
};

export const deleteChatroom = async (req:Request, res:Response, user: IUser) => {
    // if (req.body.chatroom.type !== "single") {
    //     throw new Error(`Can't add members to ${req.body.chatroom.type} chat`);
    // }
    // else if (req.body.chatroom.type === "group") {
    //     const check = await isOwner(req.body.chatroom._id, user)
    //     if (!check) {
    //         throw new Error("Only owners can delete")
    //     }
    //     Chatroom.findById(req.body.chatroom)
    //     .then(c => {
    //         c.members.push(req.body.newMember);
    //         return c.save();
    //     }).then(uC => {/*TODO: sends a message over Websocket to inform other members*/})
    // }
    
    if((req.body.chatroom.type === "group" && !isOwner(req.body.chatroom._id, user)) || (req.body.chatroom.type === "single" && !isMember(req.body.chatroom._id, user))) {
        throw new Error("You're not a member of this chatroom");
    }
    Chatroom.findByIdAndRemove(req.body.chatroom).exec()
    .then(dC => {/*TODO: sends a message over Websocket to inform other members*/})
};

export const addMember = async (req:Request, res:Response, user: IUser) => {
    if (req.body.chatroom.type === "single") {
        throw new Error("Can't add members to private chat")
    }
    else if (req.body.chatroom.type === "group") {
        const check = await isOwner(req.body.chatroom._id, user)
        if (!check) {
            throw new Error("Only owners can add to group")
        }
        Chatroom.findById(req.body.chatroom._id)
        .then(c => {
            c.members.push(req.body.newMember);
            return c.save();
        }).then(uC => {/*TODO: sends a message over Websocket to inform other members*/})
    }
};

export const addMessage = async (req:Request, res:Response, user: IUser) => {
    const check = await isMember(req.body.chatroom._id, user)
    if (!check) {
        throw new Error("Only members can send messages")
    }
    let message: IMessage = {
        sender: user._id,
        created: Date.now(),
        lastModified: Date.now(),
        edited: false,
        content: [req.body.message]
    };
    Chatroom.findById(req.body.chatroom)
    .then(c => {
        c.messages.push(message);
        return c.save();
    }).then(uC => {/*TODO: sends a message over Websocket to inform other members*/})
}

export const addMessageSocket = async (user: IUser, chatroomId:string, content: string) => {
    const check = await isMember(chatroomId, user)
    if (!check) {
        throw new Error("Only members can send messages")
    }
    let message: IMessage = {
        sender: user._id,
        created: Date.now(),
        lastModified: Date.now(),
        edited: false,
        content: [{ //TODO: send Object of type IMessageContent from frontend
            type:"text",
            value: content
        }]
    };
    Chatroom.findById(chatroomId)
    .then(c => {
        c.messages.push(message);
        return c.save();
    }).then(uC => {
        SocketService.sendAll(uC.members.map(u=>user._id), "pushedMessage", content)
    })
}


export const editMessage = async (req:Request, res:Response, user: IUser) => {
    const check = await isMember(req.body.chatroom._id, user)
    if (!check) {
        throw new Error("Only members can send messages")
    }
    let message: IMessage;
    Chatroom.findById(req.body.chatroom._id)
    .then(c => {
        let messages = c.messages as Types.DocumentArray<IMessage>;
        message = messages.id(req.body.message._id);
        if (message.sender !== user._id)
            throw new Error("You can edit only your message");
        message.lastModified = Date.now();
        message.edited = true;
        message.content = req.body.message.content
        return c.save();
    }).then(uC => {/*TODO: sends a message over Websocket to inform other members*/})
}