import { Friends } from "../models/friends";
import { User } from "../models/users";
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export const addUser = (req:Request, res:Response) => {
    User.create({
        username: req.body.username,
        email: req.body.email,
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
      }), req.body.password, function (err, user) {
        if (err) {
          res.send(err);
        } else {
          Friends.create({
            user: user._id,
            friends: []
          })
          res.send({ message: "Successful" });
        }
      }
    )
}