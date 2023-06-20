import { Schema, Types, model } from "mongoose";
import { IFriends } from "./interfaces/friends";

const friendsSchema = new Schema<IFriends>({
    user: {type: Types.ObjectId, ref: "User", required: true},
    friends: [{type: Types.ObjectId, ref: "User", required: true}]
});

export const Friends = model<IFriends>("Friends", friendsSchema)