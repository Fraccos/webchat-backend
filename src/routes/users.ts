import { createJWT, getFriendsByUserid, getUserById, getUserByUsername, getUsernamesMapByUserIdArray, registerUser, removeFriend, searchNewFriendsByUsername, searchUsersByUsername, } from "../controllers/users";
import express from "express";
import AuthService from "../services/auth";

export const usersRouter = express.Router();

usersRouter.post("/register", registerUser)
    .post('/login', AuthService.login)
    .post('/test', (req,res)=> {
        console.log(JSON.stringify(
            {
                body: req.body
            }
        ))
        res.sendStatus(200);
    })
    .use(AuthService.isValid)
    .post('/logout', AuthService.logout)

    .get('/byUsername/:username', getUserByUsername)

    .get('/search/byUsername', searchUsersByUsername)

    .get('/search/newfriends/byUsername', searchNewFriendsByUsername)


    .get('/friends/retrive/:id', getFriendsByUserid)

    .get('/byUserID/:userID', getUserById)

    .post('/jwt/create', createJWT)
    .get('/byUserID/:userID', getUserById)

    .delete("/friends/remove", removeFriend)

    .post("/usernamesMap/retrive", getUsernamesMapByUserIdArray);
