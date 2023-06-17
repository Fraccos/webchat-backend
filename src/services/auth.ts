import express, { Application } from "express";
import { sessionSK } from "../Environment";
import expressSession from "express-session"
import passportLocal from "passport-local"
import passport from "passport"
import { User } from "../models/users"

import { Request, Response, NextFunction } from 'express';

export default class AuthService {
    private app:Application;

	constructor($app: Application) {
		this.app = $app;
	}   
    
    init():void {
        const LocalStrategy = passportLocal.Strategy;
        this.app.use(expressSession({secret: sessionSK}));
        this.app.use(passport.initialize());
        this.app.use(passport.session());
        passport.use(new LocalStrategy(User.authenticate()));
        passport.serializeUser(User.serializeUser());
        passport.deserializeUser(User.deserializeUser());
    }

    static isValid(req: Request, res: Response, next: NextFunction) {
        if (!req.isAuthenticated()) {
            res.json({type: "error", msg: "User not authenticated"});
        }
        else {
            next();
        }
    }
}




