import express from "express";
import AuthService from "../services/auth";

export const chatroomsRouter = express.Router();

chatroomsRouter.use(AuthService.isValid);