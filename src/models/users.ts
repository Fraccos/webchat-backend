import mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    bio: String,
    avatar: String,
});

module.exports = mongoose.model("User", userSchema);