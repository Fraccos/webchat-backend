import { FriendshipRequests } from "../models/friendshipRequests"
import { Request, Response } from 'express';
import { User } from "../models/users";


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
        response.json({status: "accepted", fR});
        /*TODO: notify sender & receiver (online and offline)*/
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
                //TODO: notify receiver (online and offline)
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
    FriendshipRequests.findByIdAndRemove(req.body.requestID)
    .then(fR => {
        res.json({status: "rejected", fR})
        /*TODO: Block sender? */
        /*TODO: notify sender? (online and offline)*/
    })
}