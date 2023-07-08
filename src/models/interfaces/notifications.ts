import { Mixed } from "mongoose";
import { IUser } from "./users";

export interface INotification {
    receiver: IUser["_id"],
    timestamp: Date,
    event: String,
    object: Mixed
}