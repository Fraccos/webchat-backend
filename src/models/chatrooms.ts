import { Model, Schema, Types, model } from "mongoose";
import { IChatroom, IMessage, IMessageContent } from "./interfaces/chatrooms";

type MessageContentModelType = Model<IMessageContent>;

type MessageOverrides = {
    content: Types.DocumentArray<IMessageContent>
};
type MessageModelType = Model<IMessage, {}, MessageOverrides>;

type ChatroomOverrides = {
    messages: Types.DocumentArray<IMessage>
};
type ChatroomModelType = Model<IChatroom, {}, ChatroomOverrides>;

const chatroomSchema = new Schema<IChatroom, ChatroomModelType>({
    name: {type: String, required: false},
    type: {type: String, required: true, default: "single"},
    owners: [{type: Types.ObjectId, ref: "User", required: false}],
    members: [{type: Types.ObjectId, ref: "User", required: true}],
    timestamp: {type: Date, required: true},
    messages: [new Schema<IMessage, MessageModelType>({
        sender: {type: Types.ObjectId, required: true},
        created: {type: Date, required: true},
        lastModified: {type: Date, required: true},
        readed: {type: Boolean, required: true, default: false},
        edited: {type: Boolean, required: true, default: false},
        content: [new Schema<IMessageContent, MessageContentModelType>({
            type: {type: String, required: true},
            value: {type: String, required: true}
        })]
    })]
});

export const Chatroom = model<IChatroom>("Chatroom", chatroomSchema);