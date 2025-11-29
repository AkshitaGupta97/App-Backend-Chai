import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

// Configuration - This sets up Cloudinary with credentials stored in environment variables.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLODNARY_API_KEY,
    api_secret: process.env.CLODNARY_API_SECRET 
});

const uploadOnCloudinary = async(localFilePath) => {
    try{
        if(!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" //lets Cloudinary automatically detect the file type (image, video, etc.).
        })
        // file has been uploaded successfully
        //console.log("file is uploaded on cloudianry", response.url);
        fs.unlinkSync(localFilePath); // now we will unlink synchronously, 
        return response;
    }
    catch(error){ //- If upload fails, it deletes the local temporary file using
        fs.unlinkSync(localFilePath); // return the locally saved temporary files as the upload operation got failed
    }
}

export {uploadOnCloudinary}