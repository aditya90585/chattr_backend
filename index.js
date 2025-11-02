import express from "express"
import cookieParser from "cookie-parser"
import connection from "./configs/mongoose-connection.js"
import userRoute from "./routes/user.route.js"
import cors from "cors"
import postRoute from "./routes/posts.route.js"
import { config } from "dotenv"
import path from "path"


const app = express()
config()
const port = process.env.PORT || 3000


app.use(express.urlencoded({ extended: true }))
// app.use(express.static("public"))
app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.json())
app.use(cookieParser())

app.use(cors({
    origin: process.env.CORS_ORIGIN ,
    credentials: true
}))


app.use("/api/v1/user", userRoute)
app.use("/api/v1/posts", postRoute)


app.get("/", (req, res) => {
    res.send("backend api is working...")
})


app.listen(port, () => {
    console.log("server running at port : ", port)
})