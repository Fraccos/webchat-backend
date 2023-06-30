import { User } from "../models/users";
import { Request, Response } from 'express';
import AuthService from "../services/auth";
import { IUser } from "../models/interfaces/users";
import { Types } from "mongoose";
import { SocketService } from "../services/socket";

/**
 * Restituisce l'utente a partire dal suo Id
 * @param {Request} req 
 * @prop params
 * @prop userID - Id utente
 * @param {Response} res 
 */
export const getUserById = (req:Request, res:Response) => {
    User.findById(req.params.userID)
    .then(u => res.json(u));
};

/**
 * Restituisce l'utente a partire dal suo username
 * @param {Request} req 
 * @prop params
 * @prop username - nome utente
 * @param {Response} res 
 */
export const getUserByUsername = (req:Request, res:Response) => {
    User.findOne({username: req.params.username})
    .then(u => res.json(u));
};

/**
 * Rimuove un amico dall lista di amici, gli utenti vengono informati tramite web socket con l'evento removedFromFriends
 * @param {Request} req 
 * @prop body
 * @prop oldFriend - utente da rimuovere dagli amici
 * @param {Response} res 
 */
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

/**
 * Ricerca nel database utenti
 * @param {Request} req 
 * @prop query 
 * @prop q - stringa di ricerca
 * @param {Response} res 
 */
export const searchUsers = (req:Request, res:Response) => {
  User.find({"username": {"$regex": req.query.q, "$options": "i"}})
  .then(u => res.json(u));
};

/**
 * Registrazione di un nuovo utente
 * @param {Request} req 
 * @prop body
 * @prop email 
 * @prop username
 * @prop password
 * @param {Response} res 
 */
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

/**
 * Creazione del JSON Web Token
 * @param {Request} req 
 * @param {Response} res 
 */
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

