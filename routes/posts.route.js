import express, { Router } from "express"
import isloggedin from "../middlewares/isLoggedIn.js"
import { createPost, deletePost, getAllPosts, likePost, PostComment, savePost } from "../controllers/post.controllers.js"
import { upload } from "../middlewares/multer.js"

const postRoute = express.Router()

postRoute.post("/createpost", upload.single("post-image"), isloggedin, createPost)
postRoute.get("/getposts", getAllPosts)
postRoute.get("/like/:id", isloggedin, likePost)
postRoute.post("/comment", isloggedin, PostComment)
postRoute.get("/delete/:id", isloggedin, deletePost)
postRoute.get("/savepost/:id",isloggedin,savePost)

export default postRoute