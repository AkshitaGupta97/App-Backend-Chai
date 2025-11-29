import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import {User} from "../modles/user.model";

// as here (res) is not used, you can [put (_)]
export const verifyJWT = asyncHandler( async(req, res, next) => {
    try {
        //First, it looks for a token(req.cookies?.accessToken), If not found, it checks the Authorization, and remove bearer prefix
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
        // uses jwt.verify, to decode and validate the token against the secret key
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        //- Extracts the user ID(_id), Excludes sensitive fields as password and refreshToken
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){  //- If the token is invalid or expired, an error will be thrown.
            throw new ApiError(401, "Invalid Access Token")
        }
        // Adds the user object 
        req.user = user;
        next(); // to pass control to the next middleware/route handler.
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})