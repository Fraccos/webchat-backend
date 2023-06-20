import { ObjectId } from "mongoose";
import { Friends } from "../models/friends";
import { FriendshipRequests } from "../models/friendshipRequests"
import { Request, Response } from 'express';

export const sendFriendshipRequest = (req: Request, res: Response) => {
    FriendshipRequests.create({
        sender: req.body.sender,
        receiver: req.body.receiver,
        timestamp: Date.now(),
        message: req.body.message
    }).then(fR => {
        res.json(fR);
        //TODO: notify receiver (online and offline)
    });
}

export const acceptFriendshipRequest = (req: Request, res: Response) => {
    FriendshipRequests.findByIdAndRemove(req.body.requestID)
    .then(fR => {
        Friends.findById(fR.sender)
        .then(u => {
            u.friends.push(fR.receiver)
            u.save()
        });
        Friends.findById(fR.receiver)
        .then(u => {
            u.friends.push(fR.sender)
            u.save()
        });
        /*TODO: notify sender (online and offline)*/
    })
}

export const rejectFriendshipRequest = (req: Request, res: Response) => {
    FriendshipRequests.findByIdAndRemove(req.body.requestID)
    .then(fR => {
        /*TODO: Block sender? */
        /*TODO: notify sender? (online and offline)*/
    })
}