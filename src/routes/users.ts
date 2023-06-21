import { getUserById, getUserByUsername, registerUser } from "../controllers/users";
import express from "express";
import AuthService from "../services/auth";
import passport from "passport";
import { IUser } from "../models/interfaces/users";

export const usersRouter = express.Router();

usersRouter.get('/', (req, res) => {
    res.json({message: "ok"});
});

usersRouter.post("/register", registerUser)
usersRouter.post('/login', AuthService.login);

usersRouter.use(AuthService.isValid)
usersRouter.get('/byUsername/:username', getUserByUsername);

usersRouter.get('/byUserID/:userID', getUserById);