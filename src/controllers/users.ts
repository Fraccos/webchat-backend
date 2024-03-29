import { User } from "../models/users";
import { NextFunction, Request, Response } from 'express';
import AuthService from "../services/auth";
import { IUser } from "../models/interfaces/users";
import { Types } from "mongoose";
import { SocketService } from "../services/socket";
import { FriendshipRequests } from "../models/friendshipRequests";

/**
 * Restituisce un utente a partire dal suo Id
 * @param req 
 * @prop params
 * @prop userID - Id utente
 * @param res 
 */
export const getUserById = (req:Request, res:Response) => {
    User.findById(req.params.userID)
    .then(u => res.json(u));
};

/**
 * Restituisce un utente a partire dal suo username
 * @param req 
 * @prop params
 * @prop username - nome utente
 * @param res 
 */
export const getUserByUsername = (req:Request, res:Response) => {
    User.findOne({username: req.params.username})
    .then(u => res.json(u));
};

/**
 * Rimuove un amico dall lista di amici dell'utente corrente, gli utenti vengono informati tramite web socket con l'evento removedFromFriends
 * @param req
 * @prop req.body.oldFriend - user id da rimuovere
 * @param res 
 */
export const removeFriend = (req: Request, res: Response) => {
  let user = req.user as IUser;
  let friendsOfRemoved : Array<IUser["_id"]>| undefined;
  let remover: IUser | undefined;
  let removed: IUser | undefined;
  User.findById(req.body.oldFriend).then(u => {
    friendsOfRemoved = u.friends.map(el => el._id);
    u.friends = u.friends.filter(f => f.toString() !== user._id.toString()) as Types.Array<IUser["_id"]>
    //Rimuove dalla lista di amici di oldFriend l'utente loggato (che ha richiesto il remove)
    return u.save();
  }).then(uU => {
    removed = uU
    User.findById(user._id).then(u => {
      u.friends = u.friends.filter(f => f.toString() !==  req.body.oldFriend.toString() ) as Types.Array<IUser["_id"]>
      return u.save();
    }).then(uU => {
      remover = uU;
      SocketService.sendAll([req.body.oldFriend.toString()], "removedFromFriends", 
      {
        user: remover,
        type: "removed"
      });
      SocketService.sendAll([user._id.toString()], "removedFromFriends", 
        {
          user: removed,
          type: "remover"
        }
      );
      res.sendStatus(200);
    });

  });
};

/**
 * Restituisce la lista popolata degli amici di un utente
 * @param req
 * @prop req.params.id - Id utente
 * @param res 
 */
export const getFriendsByUserid = (req:Request, res:Response) => {
  User.findById(req.params.id).populate('friends')
  .then(u => res.json(u.friends));
};

/**
 * Restituisce gli utenti con username contente la stringa di ricerca
 * @param req 
 * @prop req.query.q - stringa di ricerca
 * @prop req.query.friendOnly - restituisce solo gli amici
 * @param res 
 */
export const searchUsersByUsername = (req:Request<{},{},{},{friendOnly:string, q: RegExp}>, res:Response) => {
  const user = req.user as IUser;
  if (req.query.friendOnly === "true") {
    User.findById(user._id).populate('friends')
    .then(u => {
      let friends = u.friends;
      const filtered = friends.filter( friend => new RegExp(req.query.q).test(friend.username)  );
      res.json(filtered);
    });
  }
  else {
    User.find({"username": {"$regex": req.query.q, "$options": "i"}})
    .then(u => res.json(u));
  }
  
};

/**
 * Restituisce gli utenti non appartenti agli amici dell'utente corrente o a cui è stata inviata una richiesta di amicizia con username contente la stringa di ricerca
 * @param req
 * @prop req.query.q - stringa di ricerca
 * @param res 
 */
export const searchNewFriendsByUsername = (req:Request<{},{},{},{q: RegExp}>, res: Response) => {
  const user = req.user as IUser;
  const friends = user.friends as Array<Types.ObjectId>;
  FriendshipRequests.find({sender: user._id, rejected: false}).then(r => r.map(el => el.receiver))
  .then(rS => {
    User.find({"username": {"$regex": req.query.q, "$options": "i"}, _id: {
      $nin: [...friends, ...rS]
    }})
    /*
    .then(u => u.filter(el => !friends.includes(el.id)))
    .then(u => u.filter(el => !rS.includes(el.id))) */
    .then(users => res.json(users));
  })//.then(uF => res.json(uF));
}

/**
 * Registrazione di un nuovo utente
 * @param req 
 * @prop req.body.email - E-mail
 * @prop req.body.username - Username
 * @prop req.body.password - Password
 * @param res 
 */
export const registerUser = (req:Request, res:Response, next: NextFunction) => {
  User.exists({email: req.body.email}).then(
    (ex) => { 
      if (ex !== null) {
        next(new Error("Email already used"));
        return;
      }
      User.exists({username: req.body.username}).then(
        (ex) => { 
          if (ex !== null) {
            next(new Error("Username already used"));
            return;
          }
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
      )
    }
  )
};

/**
 * Genera e restituisce un token JWT per l'autenticazione dei web socket
 * @param req 
 * @param res 
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

export const getUsernamesMapByUserIdArray = (req: Request, res: Response) => {
  const objIdArray = req.body.idArray.map(el => new Types.ObjectId(el));
  User.find({_id: {
    $in: objIdArray
  }}).then( users => {
    const newObj:any = {};
    users.forEach( u => newObj[u._id] = u.username);
    res.json( newObj);
  })
}
