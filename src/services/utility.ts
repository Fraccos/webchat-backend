import { Types } from "mongoose";

function isStringIdValid(id: string): boolean {
    try {
        const castedId = new Types.ObjectId(id.toString())
    }
    catch (e) {
        return false;
    }
    return true;
}