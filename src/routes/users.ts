import { getUserById, getUserByUsername, registerUser } from "../controllers/users";
import express from "express";
import AuthService from "../services/auth";

export const usersRouter = express.Router();

usersRouter.get('/', (req, res) => {
    res.json({message: "ok"});
});

usersRouter.post("/register", registerUser)
usersRouter.post('/login', AuthService.login)
/*
usersRouter.post('/login', passport.authenticate('local', { 
    failureRedirect: '/login', 
    successRedirect: '/'
  }), (err, req, res, next) => {
    if (err) next(err);
  });
*/
  

//usersRouter.post('/add', addUser);
usersRouter.use(AuthService.expressJWT)
usersRouter.use(AuthService.isValid)
usersRouter.get('/byUsername/:username', getUserByUsername);

usersRouter.get('/byUserID/:userID', getUserById);