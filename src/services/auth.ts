import express, { Application } from "express";
import { dbUrl, sessionSK } from "../Environment";
import expressSession from "express-session";
import passportLocal from "passport-local";
import passport from "passport";
import { User } from "../models/users";
import MongoStore  from "connect-mongo";
import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/interfaces/users";
import mongoose from "mongoose";
import jsonWebToken, { JwtPayload } from "jsonwebtoken";
import { Socket } from "socket.io";
import { BannedJWT } from "../models/bannedJWT";
import { SocketService } from "./socket";

const bannedJWTMap = new Map<string, Date>();


export default class AuthService {
  private app: Application;


  constructor($app: Application) {
    this.app = $app;
  }

  init(): void {
    const LocalStrategy = passportLocal.Strategy;
    this.app.use(expressSession({ secret: sessionSK,
      saveUninitialized: true,
      resave: false,
      cookie: {
        secure: true,
        sameSite: "strict"
      },
      store: new MongoStore({ mongoUrl: dbUrl }) }));
    this.app.use(passport.initialize());
    this.app.use(passport.session(
      
    ));
    passport.use(new LocalStrategy({
      usernameField: 'email'
    }, User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
  }

  static isValid(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
      res.status(401);
      res.json({ type: "error", msg: "User not authenticated" });
    } else {
      next();
    }
  }

  static requestJWT(userId:any) {
    return jsonWebToken.sign(
      {
        data: userId,
      },
      sessionSK,
      { expiresIn: "1h" });
  }

  static removeExpiredJWTFromCache() {
    [...bannedJWTMap.keys()].forEach(
      key => {
        const expDate = bannedJWTMap.get(key);
        if (expDate) {
          if (Date.now() > expDate.getTime()) {
            //Token is expired
            bannedJWTMap.delete(key);
          }
        }
    })
  }

  static removeExpiredJWTFromDB() {
    BannedJWT.deleteMany({
      removeDate: {
        $gte: new Date()
      }
    })
  }


  static login(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("local", (errors: Error, user: IUser) => {
      if (user) {
        req.login(user, (loginErr)  => {
            if (loginErr) {
              res.send(loginErr);
          }
          let signedToken = AuthService.requestJWT(user._id);
          res.json({
            success: true,
            token: signedToken,
            user: {
              _id : user._id,
              chats: user.chats,
              username: user.username,
              email: user.email
            }
          });
        })
      } else {
        console.log(JSON.stringify(req.body));
        console.log("----");
        next(new Error("Could not authenticate user."));
        return;
      }
    })(req, res, next);
  }

  /*
  static logout(req: Request, res: Response, next: NextFunction) {
    req.logout(function(err) {
      if (err) {
         return next(err); 
      }
      res.sendStatus(200);
    });
  }
  */

  static async isJWTBanned(jwt: string) {
    if (bannedJWTMap.get(jwt)) {
      return true;
    }
    else {
      const foundJWT = await BannedJWT.findOne({jwt: jwt});
      if (foundJWT) {
        bannedJWTMap.set(jwt, foundJWT.removeDate);
        return true;
      }
    }
    return false;
  }
  
  static logout(req: Request, res: Response, next: NextFunction) {
    let token = req.body.token as string;
    const loggedUser = req.user as IUser;
    if (token) {
      jsonWebToken.verify(
        token,
        sessionSK,
        (error: Error, payload: JwtPayload) => {
          if (payload) {
            if (payload.data.toString() !== loggedUser._id.toString()) {
              next(new Error("Invalid match between user and JWT"))
              return;
            }
            AuthService.isJWTBanned(token).then(
              (isBanned) =>  {
                if (isBanned) {
                  next("JWT is not valid anymore");
                }
                else {
                  User.findById(payload.data).then((user) => {
                    if (user) {
                      req.logout(function(err) {
                        if (err) {
                           return next(err); 
                        }
                        BannedJWT.create({
                          jwt: token,
                          removeDate: new Date(payload.exp + Date.now())
                        }).then((createdJWT)=> {
                          bannedJWTMap.set(createdJWT.jwt, createdJWT.removeDate);
                          res.sendStatus(200);
                          SocketService.disconnetUser(payload.data);
                        })
                      });
                    } else {
                      res.status(403).json({
                        error: true,
                        message: "No User account found.",
                      });
                    }
                  });
                }
              }
            )
            
          } else {
            res.status(401).json({
              error: true,
              message: "Cannot verify API token.",
            });
            next();
          }
        }
      );
    } else {
      next("JWT Token is missing")
    }
  }


  static authSocket(socket: Socket, next: NextFunction) {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication is Missing'));
    }
    jsonWebToken.verify(
        token,
        sessionSK,
        (error: Error, payload: JwtPayload) => {
            if (error) {
                return next(new Error('Invalid Token'))
            }
            if (payload) {
                AuthService.isJWTBanned(token.toString()).then(
                  isBanned => {
                    if (!isBanned) {
                      User.findById(payload.data).then((user) => {
                        if (user) {
                            socket.data = {
                                ...socket.data,
                                user: user
                            }
                            next();
                        }
                        else {
                          return next(new Error('User not found'));
                        }
                      })
                    }
                    else {
                      next(new Error("JWT Token is banned!"))
                    }
                  }
                )
                
            } 
        }
    )
  }
}
