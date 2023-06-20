import { Schema, Types, model } from "mongoose";
import { IFriendshipRequest } from "./interfaces/friendshipRequests";

const friendshipRequestSchema = new Schema<IFriendshipRequest>({
    sender: {type: Types.ObjectId, ref: "User", required: true},
    receiver: {type: Types.ObjectId, ref: "User", required: true},
    timestamp: {type: Number, required: true, default: Date.now()},
    message: {type: String, required: true}
})

friendshipRequestSchema.pre("save", function() {
    if (FriendshipRequests.exists({sender: this.sender, receiver: this.receiver}))
        throw new Error("There is another request pending for this user");
})

export const FriendshipRequests = model<IFriendshipRequest>("FriendshipRequest", friendshipRequestSchema);