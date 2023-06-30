import { FriendshipRequests } from "../models/friendshipRequests"
import { Request, Response } from 'express';
import { User } from "../models/users";
import { SocketService } from "../services/socket";

/**
 * Accetta richiesta di amicizia
 * @param {Any} query 
 * @prop id - id della richiesta di amicizia
 * @prop sender - receiver della precedente richiesta di amicizia
 * @prop receiver - sender della precendere richiesra di amicizia
 * @param {Request} request 
 * @param {Response} response 
 */
const acceptRequest = (query: any, request: Request, response: Response) => {
    FriendshipRequests.findOneAndRemove(query.id !== undefined ? {_id: query.id} : {sender: query.receiver, receiver: query.sender})
    .then(fR => {
        User.findById(fR.sender)
        .then(u => {
            u.friends.push(fR.receiver)
            u.save()
        });
        User.findById(fR.receiver)
        .then(u => {
            u.friends.push(fR.sender)
            u.save()
        });
        const dstArray = [fR.sender.toString(), fR.receiver.toString()];
        SocketService.sendAll(dstArray, "newFriend", fR);
        response.sendStatus(200);
    })
}

/**
 * Invia richiesta di amicizia
 * @param {Request} req 
 * @prop body
 * @prop receiver - utente destinatario
 * @prop sender - utente mittente
 * @prop message - messaggio della richiesta
 * @param {Response} res 
 */
export const sendFriendshipRequest = (req: Request, res: Response) => {
    FriendshipRequests.exists({sender: req.body.receiver, receiver: req.body.sender})
    .then(r => {
        if (r === null) {
            FriendshipRequests.create({
                sender: req.body.sender,
                receiver: req.body.receiver,
                timestamp: new Date(),
                message: req.body.message
            }).then(fR => {
                res.json({status: "created", fR});
                SocketService.sendAll([fR.receiver.toString()], "newFriendshipRequest", fR)
            });
        }
        else {
            acceptRequest({sender: req.body.receiver, receiver: req.body.sender}, req, res)
        }
    })
}

/**
 * Accetta richiesta di amicizia 
 * @param {Request} req 
 * @prop body
 * @prp requestID - ID della richiesta di amicizia
 * @param {Response} res 
 */
export const acceptFriendshipRequest = (req: Request, res: Response) => {
    acceptRequest({id: req.body.requestID}, req, res);
}

/**
 * Rifiuta la richiesta di amicizia
 * @param {Request} req 
 * @prop body
 * @prop requestID - ID della richiesta di amicizia
 * @param {Request} res 
 */
export const rejectFriendshipRequest = (req: Request, res: Response) => {
    FriendshipRequests.findById(req.body.requestID)
    .then(fR => {
        fR.rejected = true;
        fR.save()
        .then(uFR => {
            res.json({status: "rejected", fR})
        })
    })
}