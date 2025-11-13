import usermodel from "../models/user.model.js"
import conversationmodel from "../models/conversation.model.js"
import { messagemodel } from "../models/message.model.js"
import mongoose from "mongoose"

export const getfollowedfollowingUsers = async (req, res) => {
    try {

    } catch (error) {

    }
}

export const findCreateConversation = async ({ peerId, socket, userId }) => {
    if (!peerId || !userId) return

    let convo = await conversationmodel.findOne({
        participants: { $all: [userId, peerId] }
    })

    if (!convo) {
        convo = await conversationmodel.create({ participants: [userId, peerId] })
    }
    return convo
}

export const storeMessage = async ({ sender, receiver, message, conversationId }) => {
    const createdMessage = await messagemodel.create({
        sender,
        receiver,
        message,
        conversation: conversationId
    })

    const conversation = await conversationmodel.findOneAndUpdate({ _id: conversationId }, {
        $push: {
            messages: createdMessage?._id
        }
    })

    return createdMessage

}


export const getConversationMessages = async (req, res) => {
    try {
        const conversationId = await req?.params?.conversationId
        if(!conversationId){
            res.status(401).json({
                success:false,
                message:"could not find conversationId"
            })
        }
        const conversation = await conversationmodel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(conversationId) } },
            {
                $lookup: {
                    from: "messages",
                    localField: "messages",
                    foreignField: "_id",
                    as: "messages",
                }
            }

        ])
        if(!conversation){
            res.status(401).json({
                success:false,
                message:"could not find conversation"
            })
        }

        res.status(201).json({
                success:true,
                message:"conversation send success",
                conversation:conversation[0]
            })
    } catch (error) {

    }
}