import { Document, ObjectId, Types } from "mongoose";

export interface IFriends {
    user: ObjectId,
    friends: Types.Array<ObjectId>
}