import jwt from "jsonwebtoken"
import conversationmodel from "../models/conversation.model.js"
import { findCreateConversation, storeMessage } from "../controllers/chat.controllers.js";



export const handleSocket = async (io, socket) => {
    const token = socket.handshake?.headers?.cookie
    if (!token) {
        console.log(" No token found");
        socket.disconnect()
        return;
    }
    try {
        const payload = jwt.verify(token?.replace("token=", ""), process.env.JWT_KEY)
        const userId = payload.userid

        console.log("user connected with user_id:", userId)

        // const conversation = await conversationmodel.find({ participants: socket.id })
        // conversation.forEach((conv) => socket.join(conv._id.toString()))

        socket.on("direct:join", async ({ peerId }) => {
            const convo = await findCreateConversation({ peerId, userId })
            socket.join(convo?._id.toString())
            socket.emit("joined", { conversationId: convo?._id.toString() })
        })

        socket.on("message", async ({ peerId, message, conversationId }) => {

            const messagedata = await storeMessage({ sender: userId, receiver: peerId, message, conversationId })

            io.to(conversationId).emit("message", { message: messagedata })
        })



    } catch (error) {
        console.log(error)
    }
}