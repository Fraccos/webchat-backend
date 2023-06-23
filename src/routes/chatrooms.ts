import express from "express";
import AuthService from "../services/auth";
import {addMember, addMessage, createChatroom, deleteChatroom, editMessage, retriveLatestMessages} from "../controllers/chatrooms";
import { Request,  Response} from "express";
export const chatroomsRouter = express.Router();

chatroomsRouter.use(AuthService.isValid);
chatroomsRouter.post("/create", createChatroom);
chatroomsRouter.delete("/delete", deleteChatroom);
chatroomsRouter.post("/members/add", addMember);
chatroomsRouter.post("/message/create", addMessage);
chatroomsRouter.put("/message/update", editMessage);
chatroomsRouter.get("/latestedited/:lastmessageiso", retriveLatestMessages)