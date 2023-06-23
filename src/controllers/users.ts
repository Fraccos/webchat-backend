import { User } from "../models/users";
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import AuthService from "../services/auth";
import { IUser } from "../models/interfaces/users";
import passport from "passport";

export const addUser = (req:Request, res:Response) => {
    User.create({
        username: req.body.username,
        email: req.body.email,
        chats: [],
        bio: req.body.bio,
        avatar: req.body.avatar
      }).then(u => res.json(u));
};


export const getUserById = (req:Request, res:Response) => {
    User.findById(req.params.userID)
    .then(u => res.json(u));
};

export const getUserByUsername = (req:Request, res:Response) => {
    User.findOne({username: req.params.username})
    .then(u => res.json(u));
};

export const registerUser = (req:Request, res:Response) => {
    User.register(
      new User({ 
        email: req.body.email, 
        username: req.body.username 
      }), req.body.password, function (err, msg) {
        if (err) {
          res.send(err);
        } else {
          res.send({ message: "Successful" });
        }
      }
    )
}

export const createJWT = (req:Request, res:Response) => {
  const user = req.user as IUser;
  User.findById(user._id).then(
    u => {
      res.json(
        {
          token: AuthService.requestJWT(user._id),
          user: u
        }
      ) 
    }
  )
}

