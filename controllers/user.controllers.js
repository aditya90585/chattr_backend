import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

import usermodel from "../models/user.model.js"
import postmodel from "../models/post.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { deleteFromCloudinary } from "../utils/cloudinary.js"
import mongoose from "mongoose"


export const register = async (req, res) => {

    try {
        let { fullname, username, email, password } = await req.body.data

        let existeduser = await usermodel.findOne(
            {
                $or: [{ username }, { email }]
            }
        )
        if (existeduser) {
            return res.status(401).json({
                message: "user already exist : please login",
                success: false
            })
        }
        else {
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, async (err, hash) => {
                    let user = await usermodel.create({
                        fullname,
                        username,
                        email,
                        password: hash
                    })
                    let createdUser = await usermodel.findOne({ email: user.email }).select("-password")
                    let token = jwt.sign({ email: createdUser.email, userid: createdUser._id }, process.env.JWT_KEY)
                    return res.cookie("token", token, {
                        httpOnly: true,
                        secure: true,
                        sameSite: "None",
                        maxAge: 1 * 24 * 60 * 60 * 1000,
                    })
                        .json({
                            message: "user created successful",
                            success: true,
                            user: createdUser
                        })

                })
            })
        }
    } catch (error) {
        console.log(error)
        if (error) {
            return res.status(401).json({
                message: error?.message || "Network error",
                success: false
            })
        }
    }
}

export const login = async (req, res) => {
    try {
        let { email, password } = await req.body.data

        let existeduser = await usermodel.findOne({ email })

        if (!existeduser) {
            return res.status(401).json({
                message: `user with ${email} not found  : create new account or try with another email`,
                success: false
            })
        }
        else {

            bcrypt.compare(password, existeduser.password, async (err, result) => {
                if (result == true) {
                    //populate posts of user 

                    const user = await usermodel.aggregate([
                        { $match: { email } },
                        {
                            $lookup: {
                                from: "posts",
                                localField: "posts",
                                foreignField: "_id",
                                as: "posts",
                                // lookup for user
                                pipeline: [
                                    { $sort: { _id: -1 } },
                                    {
                                        $lookup: {
                                            from: "users",
                                            localField: "author_id",
                                            foreignField: "_id",
                                            as: "author_id",
                                            pipeline: [
                                                {
                                                    $project: {
                                                        password: 0
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        $addFields: {
                                            author_id: { $arrayElemAt: ["$author_id", 0] }
                                        }
                                    },

                                    //lookup for comments
                                    {
                                        $lookup: {
                                            from: "comments",
                                            localField: "comments",
                                            foreignField: "_id",
                                            as: "comments",
                                            pipeline: [
                                                { $sort: { _id: -1 } },
                                                {
                                                    $lookup: {
                                                        from: "users",
                                                        localField: "author",
                                                        foreignField: "_id",
                                                        as: "author",
                                                        pipeline: [
                                                            {
                                                                $project: {
                                                                    password: 0
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    $addFields: {
                                                        author: { $arrayElemAt: ["$author", 0] }
                                                    }
                                                }
                                            ]
                                        }
                                    },

                                    //lookup for likes
                                    {
                                        $lookup: {
                                            from: "users",
                                            localField: "like",
                                            foreignField: "_id",
                                            as: "like",
                                            pipeline: [{ $project: { password: 0 } }]
                                        }
                                    },

                                ]
                            },
                        },
                        //lookup for followers
                        {
                            $lookup: {
                                from: "users",
                                localField: "followers",
                                foreignField: "_id",
                                as: "followers",
                                pipeline: [{ $project: { password: 0 } }]
                            }
                        },
                        //lookup for following
                        {
                            $lookup: {
                                from: "users",
                                localField: "following",
                                foreignField: "_id",
                                as: "following",
                                pipeline: [{ $project: { password: 0 } }]
                            }
                        },
                        { $project: { password: 0 } },
                    ])


                    let token = jwt.sign({ email: email, userid: user[0]._id }, process.env.JWT_KEY)
                    console.log(token, "token")

                    return res.cookie("token", token, {
                        httpOnly: true,
                        secure: true,
                        sameSite: "none",
                        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    })
                        .json({
                            message: "user login successful...",
                            success: true,
                            user: user[0]
                        })

                }
                else {
                    res.status(401).json({
                        message: `user not found with ${email} and ${password}`,
                        success: false,
                    })
                }
            })
        }
    } catch (error) {
        console.log(error)
        if (error) {
            return res.status(401).json({
                message: error?.message || "Network error",
                success: false
            })
        }
    }
}

export const logout = (req, res) => {
    try {
        return res.cookie("token", "", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
            .json({
                message: "user logout successful...",
                success: true,
            })


    } catch (error) {
        console.log(error)
        if (error) {
            return res.status(401).json({
                message: error?.message || "Network error in logout",
                success: false
            })
        }

    }
}

export const getCurrentUser = async (req, res) => {
    try {
        const email = await req?.user?.email
        if (email) {
            // populate posts of user

            const user = await usermodel.aggregate([
                { $match: { email } },
                {
                    $lookup: {
                        from: "posts",
                        localField: "posts",
                        foreignField: "_id",
                        as: "posts",
                        // lookup for user
                        pipeline: [
                            { $sort: { _id: -1 } },
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "author_id",
                                    foreignField: "_id",
                                    as: "author_id",
                                    pipeline: [
                                        {
                                            $project: {
                                                password: 0
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $addFields: {
                                    author_id: { $arrayElemAt: ["$author_id", 0] }
                                }
                            },

                            //lookup for comments
                            {
                                $lookup: {
                                    from: "comments",
                                    localField: "comments",
                                    foreignField: "_id",
                                    as: "comments",
                                    pipeline: [
                                        { $sort: { _id: -1 } },
                                        {
                                            $lookup: {
                                                from: "users",
                                                localField: "author",
                                                foreignField: "_id",
                                                as: "author",
                                                pipeline: [
                                                    {
                                                        $project: {
                                                            password: 0
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            $addFields: {
                                                author: { $arrayElemAt: ["$author", 0] }
                                            }
                                        }
                                    ]
                                }
                            },

                            //lookup for likes
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "like",
                                    foreignField: "_id",
                                    as: "like",
                                    pipeline: [{ $project: { password: 0 } }]
                                }
                            },

                        ]
                    },
                },
                //lookup for followers
                {
                    $lookup: {
                        from: "users",
                        localField: "followers",
                        foreignField: "_id",
                        as: "followers",
                        pipeline: [{ $project: { password: 0 } }]
                    }
                },
                //lookup for following
                {
                    $lookup: {
                        from: "users",
                        localField: "following",
                        foreignField: "_id",
                        as: "following",
                        pipeline: [{ $project: { password: 0 } }]
                    }
                },
                { $project: { password: 0 } },
            ])

            if (user) {
                return res.status(201)
                    .json({
                        success: true,
                        message: "user log in successfully...",
                        user: user[0]
                    })
            }
        }
        else {
            return res.status(401)
                .json({
                    success: false,
                    message: "unexpected no token found or session in expired",
                })
        }
    } catch (error) {
        console.log(error?.message, "error")
        if (error) {
            return res.status(401).json({
                message: error?.message,
                success: false
            })
        }
    }

}

export const SearchUser = async (req, res) => {
    try {
        const allUsers = await usermodel.find().select("-password")
        const query = await req.query.search
        if (query && allUsers) {
            const resultUsers = await allUsers.filter((e) => e.username.includes(query) || e.fullname.includes(query))
            return res.status(201).json({
                success: true,
                data: resultUsers
            })
        }
    } catch (error) {
        if (error) {
            console.log(error?.message, "error")
            return res.status(401).json({
                message: error?.message,
                success: false
            })
        }
    }
}



export const getUserProfile = async (req, res) => {
    try {
        const username = await req?.params?.username
        let _id
        if (mongoose.Types.ObjectId.isValid(username)) {
            _id = new mongoose.Types.ObjectId(username)
        }

        if (username) {
            //populate posts of user

            const user = await usermodel.aggregate([
                {
                    $match:
                    {
                        $or: [
                            { username },
                            { _id }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: "posts",
                        localField: "posts",
                        foreignField: "_id",
                        as: "posts",
                        // lookup for user
                        pipeline: [
                            { $sort: { _id: -1 } },
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "author_id",
                                    foreignField: "_id",
                                    as: "author_id",
                                    pipeline: [
                                        {
                                            $project: {
                                                password: 0
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $addFields: {
                                    author_id: { $arrayElemAt: ["$author_id", 0] }
                                }
                            },

                            //lookup for comments
                            {
                                $lookup: {
                                    from: "comments",
                                    localField: "comments",
                                    foreignField: "_id",
                                    as: "comments",
                                    pipeline: [
                                        { $sort: { _id: -1 } },
                                        {
                                            $lookup: {
                                                from: "users",
                                                localField: "author",
                                                foreignField: "_id",
                                                as: "author",
                                                pipeline: [
                                                    {
                                                        $project: {
                                                            password: 0
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            $addFields: {
                                                author: { $arrayElemAt: ["$author", 0] }
                                            }
                                        }
                                    ]
                                }
                            },

                            //lookup for likes
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "like",
                                    foreignField: "_id",
                                    as: "like",
                                    pipeline: [{ $project: { password: 0 } }]
                                }
                            },



                        ]
                    },
                },
                //lookup for followers
                {
                    $lookup: {
                        from: "users",
                        localField: "followers",
                        foreignField: "_id",
                        as: "followers",
                        pipeline: [{ $project: { password: 0 } }]
                    }
                },
                //lookup for following
                {
                    $lookup: {
                        from: "users",
                        localField: "following",
                        foreignField: "_id",
                        as: "following",
                        pipeline: [{ $project: { password: 0 } }]
                    }
                },


                { $project: { password: 0 } },
            ])


            if (user) {
                return res.status(201)
                    .json({
                        success: true,
                        message: "user profile fetched successfully...",
                        user: user[0]
                    })
            }
        }
        else {
            return res.status(401)
                .json({
                    success: false,
                    message: "error occur while fetching profile",
                })
        }
    } catch (error) {
        console.log(error?.message, "error")
        if (error) {
            return res.status(401).json({
                message: error?.message,
                success: false
            })
        }
    }
}

export const followUnfollowUser = async (req, res) => {
    try {
        const user_id = await req?.params?.id
        const currentUser_id = await req?.user?.userid

        if (user_id == currentUser_id) {
            return res.status(401).json({
                message: "you cannot follow yourself",
                success: false
            })
        }

        const userFollowers = await usermodel.findOne({ _id: user_id }).select("followers")
        const currentuser_data = await usermodel.findOne({ _id: currentUser_id }).select("-password")

        if (userFollowers?.followers?.indexOf(currentUser_id) == -1) {
            const followuser = await usermodel.findOneAndUpdate({ _id: user_id }, { $push: { followers: currentUser_id } })
            const following_current_user = await usermodel.findOneAndUpdate({ _id: currentUser_id }, { $push: { following: user_id } })
            return res.status(201).json({
                success: true,
                message: "user followed done",
                user: currentuser_data
            })
        } else {
            const newFollowersData = userFollowers?.followers.filter((userId) => {
                return userId != currentUser_id
            })
            const newFollowingData = currentuser_data?.following.filter((userId) => {
                return userId != user_id
            })

            const updateuser = await usermodel.findOneAndUpdate({ _id: user_id }, { $set: { followers: newFollowersData } })
            const updatecurrentuser = await usermodel.findOneAndUpdate({ _id: currentUser_id }, { $set: { following: newFollowingData } })

            return res.status(201).json({
                success: true,
                message: "user unfollowed done",
                user: currentuser_data

            })
        }

    } catch (error) {
        console.log(error?.message, "error")
        if (error) {
            return res.status(401).json({
                message: error?.message,
                success: false
            })
        }

    }
}

export const changeProfilePic = async (req, res) => {
    try {
        const email = await req?.user?.email
        const imagelocalPath = await req.file?.path

        const user = await usermodel.findOne({ email: email })


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

        const updateduser = await usermodel.findOneAndUpdate({ email }, { $set: { profile_pic_url: cloudinaryuploader.url } })
        if (updateduser) {
            if (user.profile_pic_url != "https://res.cloudinary.com/dm3xoqps6/image/upload/v1759296413/tq7hzya06f5vagcfle8l.jpg") {
                const deleteOldpic = deleteFromCloudinary({ fileUrl: user.profile_pic_url })
            }
            return res.status(201).json({
                message: "Profile_pic changed  successfull...",
                success: "true",
                data: cloudinaryuploader.url
            })
        }

    } catch (error) {
        console.log(error?.message, "error")
        if (error) {
            return res.status(401).json({
                message: error?.message,
                success: false
            })
        }
    }
}

export const editProfileDetails = async (req, res) => {
    try {
        const email = await req?.user?.email
        const data = await req.body.data
        if (!data) return res.status(401).json(
            {
                message: "no data found to update",
                success: false
            }
        )

        const user = await usermodel.findOneAndUpdate({ email }, { $set: { fullname: data.fullname, bio: data.bio } })
        if (user) return res.status(201).json({
            message: "profile updated successfully...",
            success: "true",
        })
    } catch (error) {
        console.log(error?.message, "error")
        if (error) {
            return res.status(401).json({
                message: error?.message,
                success: false
            })
        }
    }
}