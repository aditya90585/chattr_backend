import express from "express";
import isloggedin from "../middlewares/isLoggedIn.js";
import { getConversationMessages } from "../controllers/chat.controllers.js";

const chatRoute = express.Router()

chatRoute.get("/convo/:conversationId",isloggedin,getConversationMessages)

export default chatRoute