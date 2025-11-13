import mongoose from 'mongoose'

const messageSchema = mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    message: {
        type: String,
    },
    conversation:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "conversation"
    }
})

export const messagemodel = mongoose.model("message", messageSchema)