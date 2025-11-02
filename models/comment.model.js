import { text } from "express";
import mongoose from "mongoose";

const commentSchema = mongoose.Schema({
    text: {
        type: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
    },
})

const commentmodel = mongoose.model("comment",commentSchema)

export default commentmodel