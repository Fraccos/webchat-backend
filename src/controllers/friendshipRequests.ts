import { FriendshipRequests } from "../models/friendshipRequests"
import { NextFunction, Request, Response } from 'express';
import { User } from "../models/users";
import { SocketService } from "../services/socket";
import { IUser } from "../models/interfaces/users";

/**
 * Accetta richiesta di amicizia, gli utenti vengono informati tramite web socket con l'evento newFriend
 * @param query 
 * @prop query.id - id della richiesta di amicizia
 * @prop query.receiver - sender della precendere richiesra di amicizia
 * @param request 
 * @param response 
 */
const acceptRequest = (query: any, request: Request, response: Response) => {
    const user = request.user as IUser;
    FriendshipRequests.findOneAndRemove(query.id !== undefined ? {_id: query.id} : {sender: query.receiver, receiver: user._id})
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
        })
        fR.populate('sender').then( fR => fR.populate('receiver')).then(
            fR => {
                const dstArray = [fR.sender._id.toString(), fR.receiver._id.toString()];
                SocketService.sendAll(dstArray, "newFriend", fR);
                response.sendStatus(200);
        })
        
    })
}

/**
 * Invia richiesta di amicizia, il destinatario viene informato tramite web socket con l'evento newFriendshipRequest
 * @param req 
 * @prop req.body.receiver - utente destinatario
 * @prop req.body.message - messaggio della richiesta
 * @param res 
 */
export const sendFriendshipRequest = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;
    console.log(user._id);
    if (req.body.message === undefined || req.body.message.length < 1) {
        next(new Error("Inserire il testo di richiesta amicizia"));
        return;
    }
    FriendshipRequests.exists({sender: req.body.receiver, receiver: user._id})
    .then(r => {
        if (r === null) {
            FriendshipRequests.create({
                sender: user._id,
                receiver: req.body.receiver,
                timestamp: new Date(),
                message: req.body.message
            }).then( fR => fR.populate('sender')).then(fR => fR.populate('receiver')).then(fR => {
                res.json({status: "created", fR});
                SocketService.sendAll([fR.receiver._id.toString()], "newFriendshipRequest", fR)
            });
        }
        else {
            acceptRequest({sender: req.body.receiver, receiver: user._id}, req, res)
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