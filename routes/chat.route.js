import express from "express";
import isloggedin from "../middlewares/isLoggedIn.js";
import { getConversationMessages, getPreviousChats } from "../controllers/chat.controllers.js";

const chatRoute = express.Router()

chatRoute.get("/convo/:conversationId",isloggedin,getConversationMessages)
chatRoute.get("/prevchats",isloggedin,getPreviousChats)

export default chatRoute