import { IUser } from "./users";

export interface IFriendshipRequest {
    sender: IUser["_id"],
    receiver: IUser["_id"],
    timestamp: Date,
    rejected: Boolean,
    message: String
}