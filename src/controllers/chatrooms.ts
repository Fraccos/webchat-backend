import { User } from "../models/users";
import { Chatroom } from "../models/chatrooms";
import { NextFunction, Request, Response } from 'express';
import { IUser } from "../models/interfaces/users";
import { IChatroom, IMessage, IMessageContent } from "../models/interfaces/chatrooms";
import { SocketService } from "../services/socket";
import { ObjectId, Types } from "mongoose";


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
const pushMessage = (request: Request, response: Response, user: IUser, messageContent: IMessageContent[], chatroom: IChatroom) => {
    const date = new Date();
    let message: IMessage = {
        sender: user._id,
        created: date,
        lastModified: date,
        edited: false,
        content: messageContent
    };
    chatroom.messages.push(message);
    chatroom.save().then(uC => {
        const dstArray = uC.members.map((u:IUser)=>u._id.toString());
        SocketService.sendAll(dstArray, "pushedMessage", {id: uC._id, message: message}, false);
        response.sendStatus(200);
    })
}
const updateMessage = (request: Request, response: Response, next: NextFunction, messageContent: IMessageContent[]) => {
    const user = request.user as IUser;
    Chatroom.findById(request.body.chatroomId)
    .then(c => {
        if (!c.members.includes(user._id)) {
            next(new Error("Only members can send messages"))
            return;
        }
        let messages = c.messages as Types.DocumentArray<IMessage>;
        const index = messages.findIndex(el => el._id.toString() === request.body.message.id)
        if (index >= 0) {
            if (messages[index].sender.toString() !== user._id.toString()) {
                next(new Error(`You can edit only your message ${messages[index].sender} ${user._id}`));
                return;
            }
            const [msg] = messages.splice(index, 1);
            msg.lastModified = new Date();
            msg.edited = true;
            msg.content = messageContent;
            messages.push(msg);

            const dstArray = c.members.map((u:IUser)=>u._id.toString());
            SocketService.sendAll(dstArray, "editedMessage", {id: c._id, message: msg}, false);
            return c.save();
        }
        else {
            next(new Error("Message not found"))
            return;
        }  
    }).then(uC => {
        response.sendStatus(200);
    })
}

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
        }).then(chatroom => {
            User.updateMany(
                { _id: { $in: members } },
                { $push: {chats: chatroom._id}}
            ).exec()
            .then(() => pushMessage(req, res, user, [{type: "notification", value: `User ${user.username} started a chat with you`}], chatroom))
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
                name: req.body.name,
                owners: req.body.owners,
                members: members,
                timestamp: Date.now(),
                messages: []
            }).then(chatroom => {
                User.updateMany(
                    { _id: { $in: members } },
                    { $push: {chats: chatroom._id}}
                ).exec()
                .then(() => pushMessage(req, res, user, [{type: "notification", value: `User ${user.username} created group ${req.body.name}`}], chatroom))
            }).catch(next);
        }
    }
};

export const deleteChatroom = async (req:Request, res:Response, next: NextFunction) => {
    const user = req.user as IUser;
    const userId = user._id.toString();
    if((req.body.chatroom.type === "group" && !isOwner(req.body.chatroom._id, user)) || (req.body.chatroom.type === "single" && !isMember(req.body.chatroom._id, user))) {
        next(new Error("You're not a member of this chatroom"));
    }
    Chatroom.findById(req.body.chatroom)
    .then(dC => {
        pushMessage(req, res, user, [{type: "notification", value: `User ${user.username} deleted this chatroom`}], dC);
        User.updateMany(
            { _id: { $in: dC.members } },
            { $pull: {chats: dC._id}}
        ).then (() => res.json(dC));
    })
};

export const addMember = async (req:Request, res:Response, next:NextFunction) => {
    const user = req.user as IUser;
    Chatroom.findById(req.body.chatroomId)
        .then(c => {
            if (c.type === "single") {
                throw new Error("Can't add members to private chat")
            }
            else if (c.type === "group") {
                if (c.owners.includes(user._id)) {
                    if (!user.friends.includes(req.body.newMember._id)) {
                        next(new Error("Only friends can be addded to groups"));
                    }
                    User.findByIdAndUpdate(req.body.newMember._id, { $push: {chats: c._id}})
                    .then((updateUser) => {
                        c.members.push(req.body.newMember._id);
                        return c.save();
                    }).then(uC => pushMessage(req, res, user, [{type: "notification", value: `User ${user.username} added ${req.body.newMember.username}`}], uC))
                }
                else {
                    next(new Error("Only owners can add members to groups"));
                }
            }
            
        })
};

export const removeMember = async (req:Request, res:Response, next:NextFunction) => {
    const user = req.user as IUser;
    Chatroom.findById(req.body.chatroomId)
        .then(c => {
            if (c.type === "single") {
                throw new Error("Can't remove members from private chat")
            }
            else if (c.type === "group") {
                if (c.owners.includes(user._id)) {
                    User.findByIdAndUpdate(req.body.oldMember._id, { $pop: {chats: c._id}})
                    .then((updateUser) => {
                        c.members = c.members.filter(el => el !== req.body.oldMember._id) as [IChatroom["_id"]]
                        return c.save();
                    }).then(uC => {
                        pushMessage(req, res, user, [{type: "notification", value: `User ${user.username} removed ${req.body.oldMember.username}`}], uC);
                        SocketService.sendAll([req.body.oldMember._id], "removedFromChatroom", {chatroom: uC._id});
                    })
                }
                else {
                    next(new Error("Only owners can remove members from groups"));
                }
            }
            
        })
};

export const retriveLatestMessages = (req:Request, res:Response, next: NextFunction) => {
    const user = req.user as IUser;
    const userId = user._id.toString();
    User.findById(userId).then((user:IUser) => {
            Chatroom.aggregate([
                { $match: {_id: { $in: user.chats}}},
                { $unwind: '$messages'},
                { $match: {'messages.lastModified': {$gte: new Date(req.params.lastmessageiso)}}},
                { $group: {_id: '$_id', name: {$first: '$name'}, members: {$first: '$members'}, messages: {$push: '$messages'}}}
            ]).then(async (obj) => {
                for await (const c of obj) {
                    if (c.name === null) {
                        await User.findById(c.members.find(el => el !== user._id)).then(u => c.name = u.username);
                    }
                }
                res.json(obj);
            })
        }
    ) 
}

export const retrieveMessages = (req:Request<{id: string}, {}, {}, {page: number}>, res:Response, next: NextFunction) => {
    const user = req.user as IUser;
    const userId = user._id.toString();
    const pageSize = 2;
    Chatroom.aggregate([
        {$match: {_id: new Types.ObjectId(req.params.id)}},
        {$unwind: '$messages'},
        {$sort: {'messages.lastModified': -1}},
        {$skip: (req.query.page * pageSize)},
        {$limit: pageSize},
        { $group: {_id: '$_id', messages: {$push: '$messages'}}}
    ]).then(c => res.json(c));
}

export const addMessage = async (req:Request, res:Response, next: NextFunction) => {
    const user = req.user as IUser;
    const userId = user._id.toString();
    const check = await isMember(req.body.chatroomId, user)
    if (!check) {
        next(Error("Only members can send messages"));
        return;
    }
    Chatroom.findById(req.body.chatroomId)
    .then(c => pushMessage(req, res, user, req.body.message.content as IMessageContent[], c));
}

export const editMessage = async (req:Request, res:Response, next:NextFunction) => {
    updateMessage(req, res, next, req.body.message.content);
}

export const deleteMessage = async (req:Request, res:Response, next:NextFunction) => {
    updateMessage(req, res, next, [{type: "deleted", value: ""}]);
}