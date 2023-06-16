import { ObjectId } from "mongoose"

export interface IMessageContent {
    type: string,
    value: string
}

export interface IMessage {
    _id: ObjectId
    sender: ObjectId,
    timestamp: Date,
    readed: boolean,
    edited: boolean,
    content: IMessageContent[]
}

export interface IChatroom {
    name?: string,
    type: string,
    members: [{type: ObjectId, ref: "User"}],
    timestamp: Date,
    messages: IMessage[]
}