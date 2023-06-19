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
    sender: {type: Types.ObjectId, required: true},
    created: {type: Number, required: true},
    lastModified: {type: Number, required: true},
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
chatroomSchema.pre("save", async function() {
    if (this.type === "single") {
        if ((this.members.length as Number) !== 2) {
            throw new Error("Invalid number of members for a single chatroom")
        }
        /*
        const existsChat = await Chatroom.find({type:"single", members:this.members});
        if (existsChat) {
            throw new Error("Already exists a private chatroom with those members")
        }*/
    }
    if (this.type === "group") {
        if (this.owners === undefined || this.owners.length < 1 ) {
            throw new Error("Every group must have at least one owner")
        }
    }
})

export const Chatroom = model<IChatroom>("Chatroom", chatroomSchema);