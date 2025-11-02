import express from "express"
import bcrypt from "bcrypt"
import { followUnfollowUser, getCurrentUser, getUserProfile, login, logout, register, SearchUser } from "../controllers/user.controllers.js"
import isloggedin from "../middlewares/isLoggedIn.js"

const userRoute = express.Router()

userRoute.post("/register",register)
userRoute.post("/login",login)
userRoute.get("/getcurrentuser",isloggedin,getCurrentUser)
userRoute.get("/logout",isloggedin,logout)
userRoute.get("/search",SearchUser)
userRoute.get("/getprofile/:username",getUserProfile)
userRoute.get("/followunfollow/:id",isloggedin,followUnfollowUser)

export default userRoute