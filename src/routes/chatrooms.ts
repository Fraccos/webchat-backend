import express from "express";
import AuthService from "../services/auth";
import {createChatroom} from "../controllers/chatrooms";

export const chatroomsRouter = express.Router();

//chatroomsRouter.use(AuthService.isValid);

chatroomsRouter.post("/newChat", createChatroom)
