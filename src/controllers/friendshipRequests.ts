import { FriendshipRequests } from "../models/friendshipRequests"
import { Request, Response } from 'express';
import { User } from "../models/users";
import { SocketService } from "../services/socket";


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


export const sendFriendshipRequest = (req: Request, res: Response) => {
    FriendshipRequests.exists({sender: req.body.receiver, receiver: req.body.sender})
    .then(r => {
        if (r === null) {
            FriendshipRequests.create({
                sender: req.body.sender,
                receiver: req.body.receiver,
                timestamp: Date.now(),
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

export const acceptFriendshipRequest = (req: Request, res: Response) => {
    acceptRequest({id: req.body.requestID}, req, res);
}

export const rejectFriendshipRequest = (req: Request, res: Response) => {
    FriendshipRequests.findById(req.body.requestID)
    .then(fR => {
        fR.rejected = true;
        fR.save()
        .then(uFR => {
            res.json({status: "rejected", fR})
            /*TODO: Block sender? */
            /*TODO: notify sender? (online and offline)*/
        })
    })
}