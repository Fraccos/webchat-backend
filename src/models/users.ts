import { Model, Schema, model } from "mongoose";
import { IUser } from "./interfaces/users";

type UserModelType = Model<IUser>;

const userSchema = new Schema<IUser, UserModelType>({
    username: {type: String, required: true},
    email:  {type: String, required: true},
    bio:  {type: String, required: true},
    avatar:  {type: String},
});

export const User = model<IUser>("User", userSchema);