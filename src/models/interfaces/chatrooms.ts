import { HydratedArraySubdocument, ObjectId } from "mongoose"

export interface IMessageContent {
    type: string,
    value: string
}

export interface IMessage {
    sender: {type: ObjectId, ref: "User"},
    created: Number,
    lastModified: Number,
    readed: boolean,
    edited: boolean,
    content: IMessageContent[]
}

export interface IChatroom {
    name?: string,
    type: string,
    owners?:  [{type: ObjectId, ref: "User"}],
    members: [{type: ObjectId, ref: "User"}],
    messages: IMessage[]
}
 