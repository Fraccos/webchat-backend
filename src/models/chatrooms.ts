import { Date, Model, ObjectId, Schema, Types, model } from "mongoose";

export interface IMessageContent {
    type: string,
    value: string
}
type MessageContentModelType = Model<IMessageContent>;

export interface IMessage {
    _id: ObjectId
    sender: ObjectId,
    timestamp: Date,
    readed: boolean,
    edited: boolean,
    content: IMessageContent[]
}
type MessageOverrides = {
    content: Types.DocumentArray<IMessageContent>
}
type MessageModelType = Model<IMessage, {}, MessageOverrides>;

export interface IChatroom {
    name?: string,
    type: string,
    members: [{type: ObjectId, ref: "User"}],
    timestamp: Date,
    messages: IMessage[]
}
type ChatroomOverrides = {
    messages: Types.DocumentArray<IMessage>
};
type ChatroomModelType = Model<IChatroom, {}, ChatroomOverrides>;

const chatroomSchema = new Schema<IChatroom, ChatroomModelType>({
    name: {type: String, required: false},
    type: {type: String, required: true, default: "single"},
    members: [{type: Types.ObjectId, ref: "User", required: true}],
    timestamp: {type: Date, required: true},
    messages: [new Schema<IMessage, MessageModelType>({
        sender: {type: Types.ObjectId, required: true},
        timestamp: {type: DataView, required: true},
        readed: {type: Boolean, required: true, default: false},
        edited: {type: Boolean, required: true, default: false},
        content: [new Schema<IMessageContent, MessageContentModelType>({
            type: {type: String, required: true},
            value: {type: String, required: true}
        })]
    })]
});

export const Chatroom = model<IChatroom>("Chatroom", chatroomSchema);