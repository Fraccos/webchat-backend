import { Document, Types } from "mongoose"
import { IUser } from "./users"

export interface IMessageContent {
    type: string,
    value: string
}

export interface IMessage {
    sender: IUser["_id"],
    created: Date,
    lastModified: Date,
    edited: boolean,
    content: IMessageContent[]
}

export interface IChatroom extends Document {
    name?: string,
    type: string,
    lastRead: Map<string, Date>,
    owners?:  [IUser["_id"]],
    members: [IUser["_id"]],
    messages: IMessage[]
}
 
export interface IReadInfo {
    user: IUser["_id"],
    date: Date,
}