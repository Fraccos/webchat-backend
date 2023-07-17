import { User } from "../models/users";
import { Chatroom } from "../models/chatrooms";
import { NextFunction, Request, Response } from 'express';
import { IUser } from "../models/interfaces/users";
import { IChatroom, IMessage, IMessageContent } from "../models/interfaces/chatrooms";
import { SocketService } from "../services/socket";
import { Types } from "mongoose";
import { error } from "console";

const serveAsError = (error: string | Error): Error => {
    if (error instanceof Error) {
        return error;
    }
    else {
        return new Error(error.toString());
    }
}


/**
 * Controlla se un utente fa parte di una chatroom
 * @param chatroomId - id della chatroom
 * @param user 
 * @returns true se l'utente appartiene alla chatroom, altrimenti false
 */

const isMember = async (chatroomId: string, user: IUser) => Chatroom.findById(chatroomId).then(c => { 
    if (c === null) {
        return false;
    }
    return isMemberFromChatroom(c, user);
});

function isMemberFromChatroom(chatroom: IChatroom, user: IUser) {
    return chatroom.members.includes(user._id);
}



/**
 * Controlla se un utente è amministratore di una chatroom
 * @param chatroomId - id della chatroom
 * @param user 
 * @returns true se l'utente è amministratore alla chatroom, altrimenti false
 */
async function isOwner(chatroomId: string, user: IUser) {
    Chatroom.findById(chatroomId).then(c => { 
        if (c === null) {
            return false;
        }
        return isOwnerFromChatroom(c, user);
    });
}

function isOwnerFromChatroom(chatroom: IChatroom, user: IUser) {
    return chatroom.owners.includes(user._id)
}
    
function hasPermission(chatroom: IChatroom | string, user: IUser, mustAdmin:boolean=true ) {
    if (mustAdmin) {
        return new Promise((resolve, reject) => {
            if (chatroom instanceof Chatroom) {
                if (chatroom.type === "group") {
                    if (!isOwnerFromChatroom(chatroom, user)) {
                        reject("Must be a owner to perform this action")
                    }
                }
                else if (chatroom.type == "single") {
                    if (!isMemberFromChatroom(chatroom, user)) {
                        reject("Must be a member to perform this action")
                    }
                }
                resolve(chatroom);
            }
            else {
                try {
                    const id = new Types.ObjectId(chatroom.toString());
                    Chatroom.findById(chatroom).then(
                        c => {
                            if (c === null || c === undefined) {
                                reject("Chatroom doesn't exist")
                            }
                            else {
                                return hasPermission(c, user).then(chat => resolve(chat)).catch(error => reject);
                            }
                        }
                    )
                }
                catch (error) {
                    reject("Chatroom doesn't exist")
                }
            }
        })
    }
}

/**
 * Inserisce un messaggio in una chatroom, gli utenti vengono informati tramite web socket con l'evento pushedMessage
 * @param request 
 * @param response 
 * @param user 
 * @param messageContent - contenuto del messaggio
 * @param chatroom 
 */
const pushMessage = (request: Request, response: Response, user: IUser, messageContent: IMessageContent[], chatroom: IChatroom) => {
    if (chatroom !== null && chatroom !== undefined) {
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
}

/**
 * Modifica un messaggio in una chatroom, gli utenti vengono informati tramite web socket con l'evento editedMessage
 * @param request 
 * @prop request.body.chatroomId - id della chatroom
 * @param response 
 * @param next 
 * @param messageContent - contenuto del messaggio
 */
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
                next(new Error("You can edit only your messages"));
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


/**
 * Crea una chatroom, gli utenti vengono informati tramite web socket con l'evento chatroomCreated
 * @param req 
 * @prop req.body.members - array dei membri della chatroom
 * @prop req.body.type - tipo di chatroom (single, group)
 * @prop req.body.owners - array degli amministratori della chatroom, se type == group
 * @prop req.body.name - nome della chatroom, se type == group
 * @param res 
 * @param next 
 * @returns 
 */
export const createChatroom = async (req:Request, res:Response, next: NextFunction) => {
    const user = req.user as IUser;
    const userId = user._id.toString();
    const friendsId: Array<string> = user.friends.map(el => el._id.toString());
    const members: Array<string> = req.body.members.sort( (a,b) => a.toString() > b.toString() ? 1 : -1);
    const FriendsMembersId: Array<string> = members.filter(el => friendsId.includes(el.toString()));
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
                next(new Error("Already exists a single chatroom with those members"));
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
            lastRead: new Map<string,Date>(),
            messages: []
        }).then(chatroom => {
            chatroom.members.forEach(el => chatroom.lastRead.set(el.toString(), new Date(0)));
            chatroom.save();
            User.updateMany(
                { _id: { $in: members } },
                { $push: {chats: chatroom._id}}
            ).exec()
            .then(async () => {
                const dstArray = chatroom.members.map((u:IUser)=>u._id.toString());
                if (req.body.type === "single") {
                    const c:any =  JSON.parse(JSON.stringify(chatroom));
                    const uId = chatroom.members.find( u => u._id.toString() !== user._id.toString() );
                    const otherUser = await User.findById(uId);
                    c["_id"] = chatroom._id.toString();
                    SocketService.sendAll([user._id.toString()], "chatroomCreated", {...c, name: otherUser.username}, false);
                    SocketService.sendAll([uId.toString()], "chatroomCreated", {...c, name: user.username}, false);
                }
                else {
                    SocketService.sendAll(dstArray, "chatroomCreated", chatroom, false);
                }

                pushMessage(req, res, user, [{type: "notification", value: `User ${user.username} has created this chatroom`}], chatroom);
            })
        }).catch(next);
    }
    else if (req.body.type === "group") {
        const membersOwners: Array<string> = req.body.owners.filter(el => !members.includes(el))
        //if (membersOwners.length > 0)
        if (req.body.owners === undefined || !req.body.owners.includes(userId) ) 
            next(new Error("Owners must be also members")) 
        else if (req.body.owners.length === 0)
            next(new Error("Every group must have at least one owner"))
        else if (req.body.name.length === 0)
            next(new Error("Every group must have a proper name"))
        else if (req.body.name.length > 20)
            next(new Error("Name of the group exceeded the limit of chars"))
        else if (FriendsMembersId.length !== members.length - 1) 
            next(new Error(`You can only add friends to a group, you have ${members.length - 1 - FriendsMembersId.length } not friends in your list`))
        else if (members.length > 15)
            next(new Error("A group cannot have more than 15 members"))
        else {
            Chatroom.create({
                type: req.body.type,
                name: req.body.name,
                owners: req.body.owners,
                members: members,
                timestamp: Date.now(),
                lastRead: new Map<string,Date>(),
                messages: []
            }).then(chatroom => {
                chatroom.members.forEach(el => chatroom.lastRead.set(el.toString(), new Date(0)));
                chatroom.save();
                User.updateMany(
                    { _id: { $in: members } },
                    { $push: {chats: chatroom._id}}
                ).exec()
                .then(() => {
                    const dstArray = chatroom.members.map((u:IUser)=>u._id.toString());
                    SocketService.sendAll(dstArray, "chatroomCreated", chatroom, false);
                    pushMessage(req, res, user, [{type: "notification", value: `User ${user.username} created group ${req.body.name}`}], chatroom)
                })
            }).catch(next);
        }
    }
};

/**
 * Elimina una chatroom, gli utenti vengono informati tramite web socket con l'evento chatroomDeleted
 * @param req 
 * @prop req.body.chatroomId
 * @param res 
 * @param next 
 */
export const deleteChatroom = async (req:Request, res:Response, next: NextFunction) => {
    const user = req.user as IUser;
    const userId = user._id.toString();
    hasPermission(req.body.chatroomId, user)
        .then( () => Chatroom.findByIdAndDelete(req.body.chatroomId))
        .then(dC => {
            console.log("Chat found");
            User.updateMany(
            { _id: { $in: dC.members } },
            { $pull: {chats: dC._id}}
            ).then (() => {
                const dstArray = dC.members.map((u:IUser)=>u._id.toString());
                SocketService.sendAll(dstArray, "chatroomDeleted", {id: dC._id});
                res.sendStatus(200);
            });
        })
        .catch((error: any) => next(new Error(error)))
};

/**
 * Aggiunge un utente a una chatroom, l'utente viene informato tramite web socket con l'evento addedToChatroom
 * @param req 
 * @prop req.body.chatroomId - id della chatroom
 * @prop req.body.newMember.id - id dell'utente da aggiungere
 * @prop req.body.newMember.username - username dell'utente da aggiungere
 * @param res 
 * @param next 
 */
export const addMember = async (req:Request, res:Response, next:NextFunction) => {
    const user = req.user as IUser;
    Chatroom.findById(req.body.chatroomId)
        .then(c => {
            if (c.type === "single") {
                throw new Error("Can't add members to private chat")
            }
            else if (c.type === "group") {
                if (c.owners.includes(user._id)) {
                    if (!user.friends.includes(new Types.ObjectId(req.body.newMember.id))) {
                        next(new Error("Only friends can be addded to groups"));
                    }
                    if (c.members.length >= 15) {
                        next(new Error("A group cannot have more than 15 members"));
                    }
                    User.findByIdAndUpdate(req.body.newMember.id, { $push: {chats: c._id}})
                    .then(() => {
                        c.members.push(new Types.ObjectId(req.body.newMember.id));
                        c.lastRead.set(req.body.newMember.id, new Date(0))
                        return c.save();
                    }).then(uC => {
                        SocketService.sendAll([req.body.newMember.id], "addedToChatroom", {id: c._id, name: c.name}, false)
                        pushMessage(req, res, user, [{type: "notification", value: `User ${user.username} added ${req.body.newMember.username}`}], uC);
                    })
                }
                else {
                    next(new Error("Only owners can add members to groups"));
                }
            }
            
        })
};

/**
 * Rimuove un utente da una chatroom, l'utente viene informato tramite web socket con l'evento removedFromChatroom
 * @param req 
 * @prop req.body.chatroomId - id della chatroom
 * @prop req.body.oldMember.id - id dell'utente da aggiungere
 * @prop req.body.oldMember.username - username dell'utente da aggiungere
 * @param res 
 * @param next 
 */
export const removeMember = async (req:Request, res:Response, next:NextFunction) => {
    const user = req.user as IUser;
    Chatroom.findById(req.body.chatroomId)
        .then(c => {
            if (c.type === "single") {
                throw new Error("Can't remove members from private chat")
            }
            else if (c.type === "group") {
                if (c.owners.includes(user._id)) {
                    User.findByIdAndUpdate(req.body.oldMember.id, { $pop: {chats: c._id}})
                    .then(() => {
                        c.members = c.members.filter(el => el.toString() !== req.body.oldMember.id) as [IChatroom["_id"]];
                        c.lastRead.delete(req.body.oldMember.id);
                        return c.save();
                    }).then(uC => {
                        pushMessage(req, res, user, [{type: "notification", value: `User ${user.username} removed ${req.body.oldMember.username}`}], uC);
                        SocketService.sendAll([req.body.oldMember._id], "removedFromChatroom", {id: uC._id});
                    })
                }
                else {
                    next(new Error("Only owners can remove members from groups"));
                }
            }
            
        })
};

/**
 * Restituisce tutti i messaggi di tutte le chatroom di cui fa parte l'utente corrente, modificati dopo un timestamp specifico
 * @param req 
 * @prop req.params.lastmessageiso - timestamp in formato ISO 
 * @param res 
 * @param next 
 */
export const retriveLatestMessages = (req:Request, res:Response, next: NextFunction) => {
    const user = req.user as IUser;
    const userId = user._id.toString();
    User.findById(userId).then((user:IUser) => {
            Chatroom.aggregate([
                { $match: {_id: { $in: user.chats}}},
                { $unwind: '$messages'},
                { $match: {'messages.lastModified': {$gte: new Date(req.params.lastmessageiso)}}},
                { $group: {_id: '$_id', 
                    name: {$first: '$name'}, 
                    owners: {$first: '$owners'}, 
                    members: {$first: '$members'}, 
                    type: {$first: '$type'},
                    lastRead: {$first: '$lastRead'}, 
                    messages: {$push: '$messages'}}}
            ]).then(async (obj) => {
                const membersSet = new Set<Types.ObjectId>();
                for await (const c of obj) {
                    c.members.forEach(u => membersSet.add(u));
                    if (c.name === null) {
                        await User.findById(c.members.find(el => el.toString() !== userId)).then(u => c.name = u.username);
                    }
                }
                const membersArray = Array.from(membersSet);
                User.aggregate([
                    { $match: {_id: { $in: membersArray}}},
                    { $group: {_id: '$_id', 
                        username: {$first: '$username'}
                    }}
                ]).then( usernames => {
                    const usernameMap = {};
                    usernames.forEach(el => { 
                        usernameMap[el._id] = el.username;
                    })
                    res.json({
                        chatrooms: obj,
                        usernames: usernameMap
                    })
                })
            })
        }
    ) 
}

/**
 * Restituisce i messaggi di una chatroom in ordine decrescente di ultima modifica in maniera paginata
 * @param req 
 * @prop req.params.id - id della chatroom
 * @prop req.query.page - pagina dei risultati da restituire, 0-indexed
 * @var pageSize - numero di risultati per pagina
 * @param res 
 * @param next 
 */
export const retrieveMessages = (req:Request<{id: string}, {}, {}, {page: number}>, res:Response, next: NextFunction) => {
    const user = req.user as IUser;
    const userId = user._id.toString();
    const pageSize = 30;
    Chatroom.aggregate([
        {$match: {_id: new Types.ObjectId(req.params.id)}},
        {$unwind: '$messages'},
        {$sort: {'messages.lastModified': -1}},
        {$skip: (req.query.page * pageSize)},
        {$limit: pageSize},
        { $group: {_id: '$_id', messages: {$push: '$messages'}}}
    ]).then(c => res.json(c));
}

/**
 * Aggiunge un messagio a una chatroom
 * @param req 
 * @prop req.body.chatroomId - id della chatroom
 * @prop req.body.message.content - contenuto del messaggio
 * @param res 
 * @param next 
 */
export const addMessage = async (req:Request, res:Response, next: NextFunction) => {
    const user = req.user as IUser;
    const userId = user._id.toString();
    try {
        const msgContent = req.body.message.content as IMessageContent[];
        hasPermission(req.body.chatroomId, user)
        .then(
            (c:IChatroom) => pushMessage(req, res, user, msgContent, c)
        ).catch(error => next(new Error(error))) 
    } catch(e) {
        next(new Error("Invalid message content"));
    }

    
    
}

/**
 * Modifica un messaggio in una chatroom
 * @param req 
 * @prop req.body.message.content - contenuto del messaggio
 * @param res 
 * @param next 
 */
export const editMessage = async (req:Request, res:Response, next:NextFunction) => {
    updateMessage(req, res, next, req.body.message.content);
}

/**
 * Elimina un messaggio da una chatroom
 * @param req 
 * @param res 
 * @param next 
 */
export const deleteMessage = async (req:Request, res:Response, next:NextFunction) => {
    updateMessage(req, res, next, [{type: "deleted", value: ""}]);
}

/**
 * Aggiorna il timestamp di lettura dell'utente corrente, gli utenti vengono informati tramite web socket con l'evento updatedLastRead
 * @param req 
 * @prop req.body.chatroomId - id della chatroom
 * @param res 
 * @param next 
 */
export const updateLastRead = async (req:Request, res:Response, next:NextFunction) => {
    const user = req.user as IUser;
    const userId = user._id.toString();
    Chatroom.findById(req.body.chatroomId)
    .then(c => {
        c.lastRead.set(userId, new Date());
        return c.save()
    }).then(uC => {
        SocketService.sendAll(uC.members.map(u => u.toString()), "updatedLastRead", 
        {   
            _id: uC._id,
            lastRead: uC.lastRead
        }
            , false);
        res.sendStatus(200);
    })
}