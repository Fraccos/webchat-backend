import { createJWT, getFriendsByUserid, getUserById, getUserByUsername, registerUser, removeFriend, searchUsersByUsername, } from "../controllers/users";
import express from "express";
import AuthService from "../services/auth";

export const usersRouter = express.Router();

usersRouter.post("/register", registerUser)
.post('/login', AuthService.login)

.use(AuthService.isValid)
.get('/byUsername/:username', getUserByUsername)

.get('/search/byUsername', searchUsersByUsername)


.get('/friends', getFriendsByUserid)

.get('/byUserID/:userID', getUserById)

.post('/jwt/create', createJWT)
.get('/byUserID/:userID', getUserById)

.delete("/friends/remove", removeFriend);