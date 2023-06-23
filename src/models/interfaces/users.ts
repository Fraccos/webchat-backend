import { ObjectId, PassportLocalDocument, Types} from "mongoose";
import { IChatroom } from "./chatrooms";

export interface IUser extends PassportLocalDocument {
    username: string,
    email: string,
    bio?: string,
    chats: IChatroom
    avatar?: string,
    friends: Types.Array<ObjectId>
}