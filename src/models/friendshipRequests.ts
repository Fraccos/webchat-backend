import { Schema, Types, model } from "mongoose";
import { IFriendshipRequest } from "./interfaces/friendshipRequests";

/**
 * Schema di una richiesta di amicizia
 * @param sender - id utente mittente della richiesta di amicizia
 * @param receiver - id utente destinatario della richiesta di amicizia
 * @param timestamp - timestamp di invio della richiesta di amicizia
 * @param rejected - true se la richiesta è stata rifiutata, altrimenti false
 * @param message - contenuto del messaggio della richiesta di amicizia
 */
const friendshipRequestSchema = new Schema<IFriendshipRequest>({
    sender: {type: Types.ObjectId, ref: "User", required: true},
    receiver: {type: Types.ObjectId, ref: "User", required: true},
    timestamp: {type: Date, required: true, default: new Date()},
    rejected: {type: Boolean, required: true, default: false},
    message: {type: String, required: true}
})

friendshipRequestSchema.pre("save", function(next) {
    let date: Date;
    date = new Date(new Date().getTime() - (1000*60*60*24*14))
    FriendshipRequests.exists({sender: this.sender, receiver: this.receiver, rejected: false})
    .then(r => {
        if (r !== null)
            next(new Error("There is already a request pending for this user"));
    });
    FriendshipRequests.exists({sender: this.sender, receiver: this.receiver, rejected: true, timestamp: {$gte: date}})
    .then(r => {
        if (r !== null)
            next(new Error("Your last request has been rejected"));
    });
    FriendshipRequests.findOneAndRemove({sender: this.sender, receiver: this.receiver, rejected: true, timestamp: {$lt: date}}).exec()
    next();
})

export const FriendshipRequests = model<IFriendshipRequest>("FriendshipRequest", friendshipRequestSchema);