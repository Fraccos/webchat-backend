import { Schema, Types, model } from "mongoose";
import { IUser } from "./interfaces/users";
import passportLocalMongoose from "passport-local-mongoose"
import { Document, PassportLocalModel, PassportLocalSchema } from "mongoose";

interface UserModelGeneric <T extends Document> extends PassportLocalModel<T> {}
type UserModel = UserModelGeneric<IUser>;

/**
 * Schema dell'utente
 * @param {String} username - nome utente
 * @param {String} email - email
 * @param {String} bio - biografia
 * @param {String} avatar - immagine in formato base64
 * @param {Array} friends - lista degli amici, array di oggetti di tipo User
 */
const userSchema = new Schema<IUser, UserModel>({
    username: {type: String, required: true, unique:true},
    email: {type: String, required: true, unique:true},
    bio: {type: String, required: false},
    avatar: {type: String, required: false},
    friends: [{type: Types.ObjectId, ref: "User", required: true}],
    chats: [{type: Types.ObjectId, ref: "Chatroom", required: true}]
}) as PassportLocalSchema<IUser, UserModel>;

userSchema.plugin(passportLocalMongoose, {
    usernameField: 'email'
});

export const User:UserModel = model<IUser>("User", userSchema);