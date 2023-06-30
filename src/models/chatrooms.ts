import { Model, Schema, Types, model } from "mongoose";
import { IChatroom, IMessage, IMessageContent } from "./interfaces/chatrooms";

type MessageContentModelType = Model<IMessageContent>;
/**
* Schema del contenuto dei messaggi
* @param {string} type - tipo del messaggio (text, notification)
* @param {string} value - contenuto del messaggio
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
 * @param {ObjectId} sender - mittente del messaggio, oggetto di tipo User
 * @param {Date} created - data di invio del messaggio
 * @param {Date} lastModified - data di ultima modifica del messaggio
 * @param {Boolean} edited - true: messaggio modificato, false: messaggio non modificato
 * @param {Array} content - contiene elementi di tipo messageContentSchema 
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
 * Schema della Chatroom
 * @param {String} name - nome della chat
 * @param {String} type - tipo della chat (single, group)
 * @param {Map} lastRead - 
 * @param {ObjectId} owners - amministratore/i della chat, vuoto in caso di chat singola, oggetto di tipo User
 * @param {ObjectIde} members - membri della chat, oggetto di tipo User
 * @param {Array} messages - array dei messaggi della chat, contiene elementi del tipo messageSchema
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