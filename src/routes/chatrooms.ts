import express from "express";
import AuthService from "../services/auth";
import {addMessage, createChatroom, retriveLatestMessages} from "../controllers/chatrooms";
import { Request,  Response} from "express";
export const chatroomsRouter = express.Router();

chatroomsRouter.use(AuthService.isValid);
chatroomsRouter.post("/newChat", createChatroom)
chatroomsRouter.post("/newMessage", addMessage)
chatroomsRouter.get("/lastedited/:lastmessageiso", retriveLatestMessages)