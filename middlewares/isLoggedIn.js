import jwt from "jsonwebtoken"
import { config } from "dotenv";
config()


const isloggedin = async(req, res, next) =>{
    const cookies = await req?.cookies?.token
    if (cookies === "" || cookies === undefined) {
       return res.status(401).json({
            success:false,
            message:"|You are not logged In| please login..."
        })
    }
    else {
        let user = await jwt.verify(cookies,process.env.JWT_KEY)
        req.user = user
    }
    next();
}
export default isloggedin
