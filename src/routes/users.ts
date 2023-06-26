import { createJWT, getUserById, getUserByUsername, registerUser } from "../controllers/users";
import express from "express";
import AuthService from "../services/auth";

export const usersRouter = express.Router();

usersRouter.get('/', (req, res) => {
    res.json({message: "ok"});
})
.post("/register", registerUser)
.post('/login', AuthService.login)

.use(AuthService.isValid)
.get('/byUsername/:username', getUserByUsername)

.get('/byUserID/:userID', getUserById)

.post('/jwt/create', createJWT)
.get('/byUserID/:userID', getUserById);