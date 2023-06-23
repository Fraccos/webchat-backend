import { ObjectId, PassportLocalDocument, Types} from "mongoose";


export interface IUser extends PassportLocalDocument {
    username: string,
    email: string,
    bio?: string,
    avatar?: string,
    friends: Types.Array<ObjectId>
}