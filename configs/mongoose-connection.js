import mongoose from "mongoose";
import { config } from "dotenv";
config()
let connection;

mongoose.connect(process.env.mongodb_uri)
.then(()=>{
    connection = mongoose.connection;

    console.log("mongodb  connected")

    connection.on("error",(err)=>{
        console.log(" mongodb connection error")
    })
})
.catch(err=>{
    console.error(err)
})

export default connection

