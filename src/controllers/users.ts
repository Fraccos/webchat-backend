import { User } from "../models/users";
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

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

export const getFriends = (req: Request, res: Response) => {
  User.findById(req.body.userID)
  .then(u => res.json(u.friends))
}

export const registerUser = (req:Request, res:Response) => {
    User.register(
      new User({ 
        email: req.body.email, 
        username: req.body.username,
        friends: [] 
      }), req.body.password, function (err, user) {
        if (err) {
          res.send(err);
        } else {
          res.send({ message: "Successful" });
        }
      }
    )
}