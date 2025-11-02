import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { config } from "dotenv";
config()


cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret 
});


export const uploadOnCloudinary = async ({ localFilePath }) => {
    try {
        if (!localFilePath) return null

        const uploadres = await cloudinary.uploader
            .upload(localFilePath, {
                resource_type: "auto"
            })

        fs.unlinkSync(localFilePath)
        return uploadres


    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

export const deleteFromCloudinary = async ({fileUrl}) =>{
    try {
        if(!fileUrl) return

       const result = await cloudinary.uploader.destroy(fileUrl)
       console.log("deleted")
       return result
    } catch (error) {
        console.log(error,"cloudinary delete error")
        return null
    }
}