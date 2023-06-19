import { ObjectId } from "mongoose"

export interface IMessageContent {
    type: string,
    value: string
}

export interface IMessage {
    _id: ObjectId
    sender: ObjectId,
    created: Date,
    lastModified: Date,
    readed: boolean,
    edited: boolean,
    content: IMessageContent[]
}

export interface IChatroom {
    name?: string,
    type: string,
    owners?:  [{type: ObjectId, ref: "User"}]
    members: [{type: ObjectId, ref: "User"}],
    timestamp: Date,
    messages: IMessage[]
}
 