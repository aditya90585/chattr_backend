import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    fullname: String,
    username: String,
    email: String,
    password: String,
    profile_pic_url: {
        type: String,
        default: "https://res.cloudinary.com/dm3xoqps6/image/upload/v1759296413/tq7hzya06f5vagcfle8l.jpg"
    },
    bio: {
        type: String,
        default: ''
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ],
    save_posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ]
})

const usermodel = mongoose.model("user", userSchema);

export default usermodel;