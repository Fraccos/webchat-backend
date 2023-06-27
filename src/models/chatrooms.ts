import { Model, Schema, Types, model } from "mongoose";
import { IChatroom, IMessage, IMessageContent } from "./interfaces/chatrooms";

type MessageContentModelType = Model<IMessageContent>;
const messageContentSchema = new Schema<IMessageContent, MessageContentModelType>({
    type: {type: String, required: true},
    value: {type: String, required: true}
})

type MessageOverrides = {
    content: Types.DocumentArray<IMessageContent>
};
type MessageModelType = Model<IMessage, {}, MessageOverrides>;
const messageSchema = new Schema<IMessage, MessageModelType>({
    sender: {type: Types.ObjectId, ref: "User", required: true},
    created: {type: Date, required: true},
    lastModified: {type: Date, required: true},
    readed: {type: Date, required: false},
    edited: {type: Boolean, required: true, default: false},
    content: [messageContentSchema]
})

type ChatroomOverrides = {
    messages: Types.DocumentArray<IMessage>
};
type ChatroomModelType = Model<IChatroom, {}, ChatroomOverrides>;
const chatroomSchema = new Schema<IChatroom, ChatroomModelType>({
    name: {type: String, required: false},
    type: {type: String, required: true, default: "single"},
    owners: [{type: Types.ObjectId, ref: "User", required: false}],
    members: [{type: Types.ObjectId, ref: "User", required: true}],
    messages: [messageSchema]
});


export const Chatroom = model<IChatroom>("Chatroom", chatroomSchema);