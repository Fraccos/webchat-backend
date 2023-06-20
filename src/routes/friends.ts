import express from "express";
import AuthService from "../services/auth";
import { acceptFriendshipRequest, getFriends, rejectFriendshipRequest, sendFriendshipRequest } from "../controllers/friends";

const friendsRouter = express.Router();

friendsRouter.get('/', (req, res) => {
    res.json({message: "ok"});
})
.use(AuthService.isValid)
.post("/sendRequest", sendFriendshipRequest)
.post("/acceptRequest", acceptFriendshipRequest)
.post("/rejectRequest", rejectFriendshipRequest)
.get("/friends", getFriends);