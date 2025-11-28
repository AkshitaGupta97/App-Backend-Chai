import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler( async (req, res) => {
   //1.get user detail from frontend
   const {username, fullname, email, password } = req.body
   console.log("email", email, "username", username, "password", password);
   //2.validation 
   if(
      [fullname, email, username, password].some((field) => field?.trim() === "")
   ){
      throw new ApiError(400, "All fields are required")
   }
   //3.check if user already exist by username or email
   const existedUser = User.findOne({
      $or: [{ username }, { email }]
   })
   if(existedUser){  // if user is existed then throw error.
      throw new ApiError(409, "User with email already exist")
   }
   // 4. check for images, check for avatar
   //req.files is accessed by multer.
   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;
   console.log("Files path by multer", req.files)

   if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is required");
   }
   // 5. upload them to clouduinary. for avatar
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if(!avatar){
      throw new ApiError(400, "Avatar file is required");
   }

   // 6. create user object - create entry in db
   const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })

   // 7. remove password and refreshToken from response
   // .select(). by default sare selected hote hai, so -password use karte hai taki oo select naa ho.
   // as after creating the user we want to remove password and refreshToken.
   const createdUser = await User.findById(user._id).select(
      " -password -refreshToken "
   )
   //  8. check for user creation, either null or success
   if(!createdUser){
      throw new ApiError(500, "Internal error, registering user")
   }
   // 9. return response
   return res.status(201).json(
      new ApiResponse(200, createdUser, "user registered successfully")
   )
})

export {registerUser}

/* steps
 1.get user detail from frontend
 2. validation - not empty
 3. check if user already exist by username or email
 4. check for images, check for avatar
 5. upload them to clouduinary. for avatar
 6. create user object - create entry in db
 7. remove password and refreshToken from response
 8. check for user creation, either null or success
 9. return response
 */