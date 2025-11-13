import commentmodel from "../models/comment.model.js";
import postmodel from "../models/post.model.js";
import usermodel from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { config } from "dotenv";
config()


export const createPost = async (req, res) => {
    try {
        const user_id = req.user.userid
        const caption = await req.body.caption
        const imagelocalPath = await req.file?.path
        if (!imagelocalPath) {
            return res.status(401).json({
                message: "image file is missing...",
                success: false
            })
        }
        const cloudinaryuploader = await uploadOnCloudinary({ localFilePath: imagelocalPath })
        if (!cloudinaryuploader) {
            return res.status(401).json(
                {
                    message: "error occur while uploading file to cloud",
                    success: false
                }
            )
        }
        const post = await postmodel.create({
            author_id: user_id,
            imageUrl: cloudinaryuploader.url,
            caption: caption
        })

        if (post) {
            const user = await usermodel.findOneAndUpdate({ _id: user_id }, { $push: { posts: post._id } })
            if (user) {
                return res.status(201).json({
                    message: "Post created successfull...",
                    success: "true"
                })
            }
        }
    } catch (error) {
        console.log(error.message, "error in create post")
        return res.status(401).json({
            message: "something is missing",
            success: false
        })
    }
}

export const deletePost = async (req, res) => {
    try {
        const { userid } = await req?.user
        const post_id = await req?.params?.id
        const findPost = await postmodel.findOne({ _id: post_id }).select("author_id")

        if (findPost?.author_id == userid) {
            const post = await postmodel.findOneAndDelete({ _id: post_id })
            const comments = await commentmodel.deleteMany({ post: post_id })

            const deletefromcloud = await deleteFromCloudinary({ fileUrl: post?.imageUrl })

            if (!deletefromcloud) {
                return res.status(401).json(
                    {
                        message: "error occur while deleting file from cloud",
                        success: false
                    }
                )
            }
            return res.status(201).json({
                message: "Post deleted successfull...",
                success: "true"
            })
        }
        else {
            return res.status(401).json({
                message: "you are not authorized",
                success: false
            })
        }

    } catch (error) {
        console.log(error.message, "error in deleting post")
        return res.status(401).json({
            message: "something went wrong while deleting post",
            success: false
        })
    }

}

export const getAllPosts = async (req, res) => {
    try {
        const limit = await parseInt(req.query.limit) || 5
        const cursor = await req.query.cursor

        let query = {}
        if (cursor === "null") {
            query = {}

        } else {
            query = { _id: { $lt: cursor } }
        }


        const posts = await postmodel.find(query)
            .sort({ _id: -1 })
            .limit(limit)
            .populate("author_id")
            .populate({
                path: "comments",
                populate: {
                    path: "author"
                }
            })
            .populate("like")


        const nextcursor = posts.length > 0 ? posts[posts.length - 1]._id.toString() : null

        res.status(201).json({
            posts,
            nextcursor
        })

    } catch (error) {
        console.log(error.message, "error in getallpost")
        return res.status(401).json({
            message: error.message || "something went wrong Please check your connection",
            success: false
        })
    }
}

export const likePost = async (req, res) => {
    try {
        const { userid } = await req?.user
        console.log(userid, req.user)
        const post_id = await req?.params?.id
        const findPost = await postmodel.findOne({ _id: post_id }).select("like")

        const user = await usermodel.findOne({ _id: userid })


        if (findPost.like.indexOf(userid) == -1) {
            const post = await postmodel.findOneAndUpdate({ _id: post_id }, { $push: { like: userid } })

            return res.status(201).json({
                success: true,
                message: "post liked",
                user: user
            })
        } else {
            const newPostLikeData = findPost.like.filter((userId) => {
                return userId != userid
            })

            const post = await postmodel.findOneAndUpdate({ _id: post_id }, { $set: { like: newPostLikeData } })

            return res.status(201).json({
                success: true,
                message: "post disliked",
                user: user
            })
        }

    } catch (error) {
        console.log(error.message, "error in like")
        return res.status(401).json({
            message: error?.message || "something went wrong while like or unlike post",
            success: false
        })
    }

}

export const PostComment = async (req, res) => {
    try {
        const { userid } = await req?.user
        const { data, post_id } = await req.body


        const comment = await commentmodel.create({
            text: data?.comment,
            author: userid,
            post: post_id
        })

        const post = await postmodel.findOneAndUpdate({ _id: post_id }, { $push: { comments: comment._id } })
        const commentres = await commentmodel.findOne({ _id: comment._id }).populate("author")
        if (commentres && post) {
            return res.status(201).json({
                success: true,
                message: "comment posted success",
                data: commentres
            })
        } else {
            return res.status(401).json({
                message: "some error occur while posting comment",
                success: false
            })
        }

    } catch (error) {
        console.log(error.message, "error in comment")
        return res.status(401).json({
            message: error?.message || "some error occur while posting comment",
            success: false
        })
    }
}