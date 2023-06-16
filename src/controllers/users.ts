import { User } from "../models/users";

export const addUser = (req, res) => {
    User.create({
        username: req.body.username,
        email: req.body.email,
        bio: req.body.bio,
        avatar: req.body.avatar
      }).then(u => res.json(u));
};

export const getUserById = (req, res) => {
    User.findById(req.params.userID)
    .then(u => res.json(u));
};

export const getUserByUsername = (req, res) => {
    User.findOne({username: req.params.username})
    .then(u => res.json(u));
};