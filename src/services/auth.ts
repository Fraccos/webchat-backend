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

type nextFnSocket = (err?: Error) => void

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
        sameSite: "none"
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
        next(new Error("Could not authenticate user."));
        return;
      }
    })(req, res, next);
  }





  static expressJWT(req: Request, res: Response, next: NextFunction) {
    let token = req.headers.token as string;
    if (token) {
      jsonWebToken.verify(
        token,
        sessionSK,
        (error: Error, payload: JwtPayload) => {
          if (payload) {
            User.findById(payload.data).then((user) => {
              if (user) {
                next();
              } else {
                res.status(403).json({
                  error: true,
                  message: "No User account found.",
                });
              }
            });
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
      res.status(401).json({
        error: true,
        message: "Provide Token",
      });
    }
  }


  static authSocket(socket: Socket, next: NextFunction) {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authetication is Missing'));
    }
    jsonWebToken.verify(
        token,
        sessionSK,
        (error: Error, payload: JwtPayload) => {
            if (error) {
                return next(new Error('Invalid Token'))
            }
            if (payload) {
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
        }
    )
  }
}
