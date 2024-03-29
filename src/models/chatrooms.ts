import { Model, Schema, Types, model } from "mongoose";
import { IChatroom, IMessage, IMessageContent } from "./interfaces/chatrooms";

type MessageContentModelType = Model<IMessageContent>;
/**
* Schema del contenuto di un messaggio
* @param type - tipo associato a value per il rendering frontend (text, notification, deleted)
* @param value - contenuto del messaggio
*/
const messageContentSchema = new Schema<IMessageContent, MessageContentModelType>({
    type: {type: String, required: true},
    value: {type: String, required: true}
})

type MessageOverrides = {
    content: Types.DocumentArray<IMessageContent>
};

type MessageModelType = Model<IMessage, {}, MessageOverrides>;
/**
 * Schema di un messaggio
 * @param sender - id utente mittente del messaggio
 * @param created - timestamp di invio del messaggio
 * @param lastModified - timestamp di ultima modifica del messaggio
 * @param edited - true se il messaggio è stato modificato, altrimenti false
 * @param content - array di MessageContent, un messaggio potrebbe contenere più MessageContent con type diversi
 */
const messageSchema = new Schema<IMessage, MessageModelType>({
    sender: {type: Types.ObjectId, ref: "User", required: true},
    created: {type: Date, required: true},
    lastModified: {type: Date, required: true},
    edited: {type: Boolean, required: true, default: false},
    content: [messageContentSchema]
})

type ChatroomOverrides = {
    messages: Types.DocumentArray<IMessage>,
    lastRead: Types.Map<Date>
};
type ChatroomModelType = Model<IChatroom, {}, ChatroomOverrides>;
/**
 * Schema della chatroom
 * @param name - nome della chatroom, non obbligatorio, impostato in caso di type == group
 * @param type - tipo della chatroom (single, group), default single
 * @param lastRead - mappa di timestamp di ultima lettura dei membri della chatroom
 * @param owners - array di user id degli amministratori della chatroom, non obbligatorio, vuoto in caso di type == single
 * @param members - array di user if dei membri della chatroom
 * @param messages - array di MessageSchema
 */
const chatroomSchema = new Schema<IChatroom, ChatroomModelType>({
    name: {type: String, required: false},
    type: {type: String, required: true, default: "single"},
    lastRead: {type: Map, of: Date},
    owners: [{type: Types.ObjectId, ref: "User", required: false}],
    members: [{type: Types.ObjectId, ref: "User", required: true}],
    messages: [messageSchema]
});


export const Chatroom = model<IChatroom>("Chatroom", chatroomSchema);