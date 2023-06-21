import express from "express";
import AuthService from "../services/auth";
import {createChatroom} from "../controllers/chatrooms";
import { Request,  Response} from "express";
export const chatroomsRouter = express.Router();

chatroomsRouter.use(AuthService.isValid);
chatroomsRouter.post("/newChat", createChatroom)
