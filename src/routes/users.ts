import { addUser, getUserById, getUserByUsername } from "../controllers/users";
import express from "express";
import AuthService from "../services/auth";

export const usersRouter = express.Router();

usersRouter.get('/', (req, res) => {
    res.json({message: "ok"});
});

//usersRouter.post('/add', addUser);

usersRouter.use(AuthService.isValid)
usersRouter.get('/byUsername/:username', getUserByUsername);
usersRouter.get('/byUserID/:userID', getUserById);