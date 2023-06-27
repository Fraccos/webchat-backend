import express from "express";
import AuthService from "../services/auth";
import { acceptFriendshipRequest, rejectFriendshipRequest, sendFriendshipRequest } from "../controllers/friendshipRequests";

export const friendsRouter = express.Router();

friendsRouter.get('/', (req, res) => {
    res.json({message: "ok"});
})
.use(AuthService.isValid)
.post("/sendRequest", sendFriendshipRequest)
.post("/acceptRequest", acceptFriendshipRequest)
.delete("/rejectRequest", rejectFriendshipRequest);