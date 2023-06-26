import express from "express";
import AuthService from "../services/auth";
import {addMember, addMessage, createChatroom, deleteChatroom, deleteMessage, editMessage, removeMember, retriveLatestMessages} from "../controllers/chatrooms";
export const chatroomsRouter = express.Router();

chatroomsRouter.use(AuthService.isValid)
.post("/create", createChatroom)
.delete("/delete", deleteChatroom)
.post("/members/add", addMember)
.delete("/members/remove", removeMember)
.post("/message/create", addMessage)
.put("/message/update", editMessage)
.delete("/message/delete", deleteMessage)
.get("/latestedited/:lastmessageiso", retriveLatestMessages);