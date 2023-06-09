import { Model, Schema, model } from "mongoose";

export interface IUSer {
    username: String,
    email: String,
    bio: String,
    avatar?: String,
}
type UserModelType = Model<IUSer>;

const userSchema = new Schema<IUSer, UserModelType>({
    username: {type: String, required: true},
    email:  {type: String, required: true},
    bio:  {type: String, required: true},
    avatar:  {type: String},
});

export const User = model<IUSer>("User", userSchema);