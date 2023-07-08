import { ObjectId, PassportLocalDocument, Types} from "mongoose";
import { IChatroom } from "./chatrooms";

export interface IUser extends PassportLocalDocument {
    username: string,
    email: string,
    bio?: string,
    chats: Types.Array<IChatroom["_id"]>,
    avatar?: string,
    friends: Types.Array<IChatroom["_id"]>
}