import { User } from "../models/users";
import { Request, Response } from 'express';
import AuthService from "../services/auth";
import { IUser } from "../models/interfaces/users";
import { Types } from "mongoose";
import { SocketService } from "../services/socket";


export const getUserById = (req:Request, res:Response) => {
    User.findById(req.params.userID)
    .then(u => res.json(u));
};

export const getUserByUsername = (req:Request, res:Response) => {
    User.findOne({username: req.params.username})
    .then(u => res.json(u));
};

export const removeFriend = (req: Request, res: Response) => {
  let user = req.user as IUser;
  User.findById(req.body.oldFriend).then(u => {
    u.friends = u.friends.filter(f => f !== user._id) as Types.Array<IUser["_id"]>
    return u.save();
  }).then(uU => SocketService.sendAll([req.body.oldFriend], "removedFromFriends", uU));
  User.findById(user._id).then(u => {
    u.friends = u.friends.filter(f => f !== req.body.oldFriend) as Types.Array<IUser["_id"]>
    return u.save();
  }).then(uU => {
    SocketService.sendAll([user._id], "removedFromFriends", uU);
    res.sendStatus(200);
  });
};

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
};

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
};

