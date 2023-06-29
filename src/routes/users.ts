import { createJWT, getUserById, getUserByUsername, registerUser, removeFriend, searchUsers } from "../controllers/users";
import express from "express";
import AuthService from "../services/auth";

export const usersRouter = express.Router();

usersRouter.post("/register", registerUser)
.post('/login', AuthService.login)

.use(AuthService.isValid)
.get('/byUsername/:username', getUserByUsername)

.get('/search', searchUsers)

.get('/byUserID/:userID', getUserById)

.post('/jwt/create', createJWT)
.get('/byUserID/:userID', getUserById)

.delete("/friends/remove", removeFriend);