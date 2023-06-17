import { PassportLocalDocument} from "mongoose";


export interface IUser extends PassportLocalDocument {
    username: string,
    email: string,
    bio?: string,
    avatar?: string,
}