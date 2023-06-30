import { FriendshipRequests } from "../models/friendshipRequests"
import { Request, Response } from 'express';
import { User } from "../models/users";
import { SocketService } from "../services/socket";
import { IUser } from "../models/interfaces/users";

/**
 * Accetta richiesta di amicizia, gli utenti vengono informati tramite web socket con l'evento newFriend
 * @param query 
 * @prop query.id - id della richiesta di amicizia
 * @prop query.sender - receiver della precedente richiesta di amicizia
 * @prop query.receiver - sender della precendere richiesra di amicizia
 * @param request 
 * @param response 
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
 * Invia richiesta di amicizia, il destinatario viene informato tramite web socket con l'evento newFriendshipRequest
 * @param req 
 * @prop req.body.receiver - utente destinatario
 * @prop req.body.sender - utente mittente
 * @prop req.body.message - messaggio della richiesta
 * @param res 
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
 * @param req 
 * @prop req.body.requestID - ID della richiesta di amicizia
 * @param res 
 */
export const acceptFriendshipRequest = (req: Request, res: Response) => {
    acceptRequest({id: req.body.requestID}, req, res);
}

/**
 * Rifiuta la richiesta di amicizia
 * @param req 
 * @prop body
 * @prop requestID - ID della richiesta di amicizia
 * @param res 
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

/**
 * Restituisce le richeste di amicizia in attesa per l'utente corrente
 * @param req 
 * @param res 
 */
export const getPendingFriendshipRequests = (req: Request, res: Response) => {
    const user = req.user as IUser;
    FriendshipRequests.find({receiver: user._id, rejected: false}).populate('sender')
    .then(r => res.json(r));
}