import { Schema, Types, model } from "mongoose";
import { INotification } from "./interfaces/notifications";

/**
 * Schema delle notifiche
 * @param {ObjectId} receiver - destinatario della notifica, oggetto di tipo User
 * @param {Date} timestamp - data della notifica
 * @param {String} event - evento web socket
 * @param {Any} object - oggetto web socket
 */
const notificationSchema = new Schema<INotification>({
    receiver: {type: Types.ObjectId, ref: "User", required: true, index: true},
    timestamp: {type: Date, required: true, default: new Date()},
    event: {type: String, required: true},
    object: {type: Schema.Types.Mixed, required: true}
});

export const Notification = model<INotification>("Notification", notificationSchema);