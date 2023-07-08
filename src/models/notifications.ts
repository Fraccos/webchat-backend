import { Schema, Types, model } from "mongoose";
import { INotification } from "./interfaces/notifications";

/**
 * Schema delle notifiche
 * @param receiver - id dell'utente destinatario della notifica
 * @param timestamp - timestamp di invio della notifica
 * @param event - evento web socket
 * @param object - oggetto web socket
 */
const notificationSchema = new Schema<INotification>({
    receiver: {type: Types.ObjectId, ref: "User", required: true, index: true},
    timestamp: {type: Date, required: true, default: new Date()},
    event: {type: String, required: true},
    object: {type: Schema.Types.Mixed, required: true}
});

export const Notification = model<INotification>("Notification", notificationSchema);