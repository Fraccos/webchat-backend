import express from "express";
import AuthService from "../services/auth";
import { acceptFriendshipRequest, getPendingFriendshipRequests, rejectFriendshipRequest, sendFriendshipRequest } from "../controllers/friendshipRequests";

export const friendsRouter = express.Router();

friendsRouter.use(AuthService.isValid)
.get("/pendingrequest", getPendingFriendshipRequests)
.post("/sendrequest", sendFriendshipRequest)
.post("/acceptrequest", acceptFriendshipRequest)
.delete("/rejectrequest", rejectFriendshipRequest);