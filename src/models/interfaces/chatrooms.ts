import { Document } from "mongoose"
import { IUser } from "./users"

export interface IMessageContent {
    type: string,
    value: string
}

export interface IMessage {
    sender: IUser["_id"],
    created: Date,
    lastModified: Date,
    readed?: Date,
    edited: boolean,
    content: IMessageContent[]
}

export interface IChatroom extends Document {
    name?: string,
    type: string,
    owners?:  [IUser["_id"]],
    members: [IUser["_id"]],
    messages: IMessage[]
}
 