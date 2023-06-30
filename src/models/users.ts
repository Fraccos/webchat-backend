import { Schema, Types, model } from "mongoose";
import { IUser } from "./interfaces/users";
import passportLocalMongoose from "passport-local-mongoose"
import { Document, PassportLocalModel, PassportLocalSchema } from "mongoose";

interface UserModelGeneric <T extends Document> extends PassportLocalModel<T> {}
type UserModel = UserModelGeneric<IUser>;

/**
 * Schema dell'utente
 * @param username - nome utente, univoco
 * @param email - email, univoco
 * @param bio - biografia, non obbligatorio
 * @param avatar - immagine in formato base64, non obbligatorio
 * @param friends - array di user id degli amici dell'utente
 * @param chats - array delle chat dell'utente 
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