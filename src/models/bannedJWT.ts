import { Schema, Types, model } from "mongoose";
import { IBannedJWT } from "./interfaces/bannedJWT";


const bannedJWTSchema = new Schema<IBannedJWT>({
    jwt: {type: String, required: true},
    removeDate: {type: Date, required: true, default: new Date()},
})

export const BannedJWT = model<IBannedJWT>("BannedJWT", bannedJWTSchema);