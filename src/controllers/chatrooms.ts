import { User } from "../models/users";
import { Chatroom } from "../models/chatrooms";
import { Request, Response } from 'express';
import { IUser } from "../models/interfaces/users";
import { IChatroom, IMessage } from "../models/interfaces/chatrooms";
import { isContext } from "vm";
import { Socket } from "socket.io";
import { SocketService } from "../services/socket";

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

export const createChatroom = (req:Request, res:Response) => {
    const opFields = {}
    if (!req.body.members.find((id) => id === req.body.userId)) 
        throw new Error("Invalid chat")
        
    if (req.body.type === "single") {
        if (req.body.members) {
            if (req.body.members.length !== 2) {
                throw new Error("A private chatroom must have just 2 members")
            }
        }
        Chatroom.create({
            type: req.body.type,
            members: req.body.members,
            timestamp: Date.now(),
            messages: []
        }).then(u => {
            res.json(u);
            /*TODO: sends a message over Websocket to inform other members*/
        });
    } 
    else if (req.body.type === "group") {
        if (!req.body.owners.find(req.body.userId)) {
            throw new Error("The owner must be also a member")
        }
        Chatroom.create({
            type: req.body.type,
            owners: req.body.owners,
            members: req.body.members,
            timestamp: Date.now(),
            messages: []
        }).then(u => {
            res.json(u);
            /*TODO: sends a message over Websocket to inform other members*/
        });
    }
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
        Chatroom.findById(req.body.chatroom)
        .then(c => {
            c.members.push(req.body.newMember);
            return c.save();
        }).then(uC => {/*TODO: sends a message over Websocket to inform other members*/})
    }
}

export const deleteChatroom = async (req:Request, res:Response, user: IUser) => {
    if (req.body.chatroom.type !== "single") {
        throw new Error(`Can't add members to ${req.body.chatroom.type} chat`);
    }
    else if (req.body.chatroom.type === "group") {
        const check = await isOwner(req.body.chatroom._id, user)
        if (!check) {
            throw new Error("Only owners can delete")
        }
        Chatroom.findById(req.body.chatroom)
        .then(c => {
            c.members.push(req.body.newMember);
            return c.save();
        }).then(uC => {/*TODO: sends a message over Websocket to inform other members*/})
    }
    
    if((req.body.chatroom.type === "group" && !isOwner(req.body.chatroom._id, user)) || (req.body.chatroom.type === "single" && !isMember(req.body.chatroom._id, user))) {
        throw new Error("You're not a member of this chatroom");
    }
    Chatroom.findByIdAndRemove(req.body.chatroom).exec()
    .then(dC => {/*TODO: sends a message over Websocket to inform other members*/})
}

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
    const oldMessage:IMessage = await Chatroom.findById(req.body.msgId);
    if (oldMessage.sender !== user._id) {
        throw new Error("You can edit only your message")
    }
    let message: IMessage = {
        ...oldMessage,
        lastModified: Date.now(),
        edited: true,
        content: [req.body.message]
    };
    Chatroom.findById(req.body.chatroom)
    .then(c => {
        c.messages.push(message);
        return c.save();
    }).then(uC => {/*TODO: sends a message over Websocket to inform other members*/})
}