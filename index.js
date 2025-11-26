import express from "express"
import cookieParser from "cookie-parser"
import connection from "./configs/mongoose-connection.js"
import userRoute from "./routes/user.route.js"
import cors from "cors"
import postRoute from "./routes/posts.route.js"
import { config } from "dotenv"
import path from "path"
import { createServer } from "http"
import { Server } from "socket.io"
import { handleSocket } from "./socket/socket.js"
import chatRoute from "./routes/chat.route.js"


const app = express()
const server = createServer(app)

const io = new Server(server, {
    cors: {
        origin: [process.env.CORS_ORIGIN , "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
    }
})

io.on("connection", (socket) => handleSocket(io, socket))

config()
const port = process.env.PORT || 3000

app.use(express.urlencoded({ extended: true }))
// app.use(express.static("public"))
app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.json())
app.use(cookieParser())

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


app.use("/api/v1/user", userRoute)
app.use("/api/v1/posts", postRoute)
app.use("/api/v1/chat",chatRoute)


app.get("/", (req, res) => {
    res.send("chattr backend api is working...")
})


server.listen(port, () => {
    console.log("server running at port : ", port)
})