import { Model, Schema, model } from "mongoose";
import { IUser } from "./interfaces/users";
import passportLocalMongoose from "passport-local-mongoose"
import { Document, PassportLocalDocument, PassportLocalModel, PassportLocalSchema } from "mongoose";

interface UserModelGeneric <T extends Document> extends PassportLocalModel<T> {}
type UserModel = UserModelGeneric<IUser>;


const userSchema = new Schema<IUser, UserModel>({
    username: {type: String, required: true, unique:true},
    email:  {type: String, required: true, unique:true},
    bio:  {type: String, required: true},
    avatar:  {type: String},
}) as PassportLocalSchema<IUser, UserModel>;

userSchema.plugin(passportLocalMongoose, {
    usernameField: "email"
});

export const User:UserModel = model<IUser>("User", userSchema);