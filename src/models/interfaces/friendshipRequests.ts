import { ObjectId } from "mongoose";

export interface IFriendshipRequest {
    sender: ObjectId,
    receiver: ObjectId,
    timestamp: Number,
    message: String
}