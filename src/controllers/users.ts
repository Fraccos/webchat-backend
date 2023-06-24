import { User } from "../models/users";
import { Request, Response } from 'express';
import AuthService from "../services/auth";
import { IUser } from "../models/interfaces/users";


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

