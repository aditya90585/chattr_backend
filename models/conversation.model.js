import mongoose from "mongoose";


const conversationSchema = mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "message"
    }]
})

const conversationmodel = mongoose.model("conversation", conversationSchema)

export default conversationmodel