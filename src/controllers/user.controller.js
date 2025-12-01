import { trusted } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

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
   const existedUser = await User.findOne({
      $or: [{ username }, { email }]
   })
   if(existedUser){  // if user is existed then throw error.
      throw new ApiError(409, "User with email already exist")
   }
   // 4. check for images, check for avatar
   //req.files is accessed by multer.
   const avatarLocalPath = req.files?.avatar?.[0]?.path;
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
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

//5. access and refresh token from loginUser
const generateAccessAndRefreshToken = async(userId) => {
   try {
      // 1. Find the user by their ID in the database
      const user = await User.findById(userId);
      // 2. Generate a new access and refresh token using a method defined on the user model
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
      // 4. Save the refresh token in the user's record
      user.refreshToken = refreshToken
      await user.save({validateBeforeSave: false}); //Saves the updated user document without running schema validations
      // 5. Return both tokens so they can be sent to the client
      return {accessToken, refreshToken}
   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating refresh and access token")
   }
}

const loginUser = asyncHandler( async(req, res) => {
   //1.  Extract login data from request body
   const {email, username, password} = req.body;
   //2. username, email
   if(!(username || email)){
      throw new ApiError(400, "username or password is required");
   }
   // 3.find the user
   const user = await User.findOne({
      $or:[{username}, {email}]
   })
   // check whether user exist
   if(!user){
      throw new ApiError(404, "User does not exist")
   }
   // 4.password check
   const isPasswordValid = await user.isPasswordCorrect(password)
   if(!isPasswordValid){
      throw new ApiError(404, "Invalid password")
   }
   // access and refresh token
   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
   //Fetch user details again, excluding sensitive fields
   const loggedInUser = await User.findById(user._id).select((
      "-password -refreshToken"
   ))
   // 6. send cookies  (httpOnly & secure for safety)
   const options = {
      httpOnly: true, // prevents client-side JS from accessing cookies
      secure: true     // ensures cookies are sent only over HTTPS
   }
   //Send response with cookies + JSON payload
   return res.status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
      new ApiResponse(
         200, { user: loggedInUser, accessToken, refreshToken}, 
         "User Logged in successfully"
      )
   )
})

const logOutUser = asyncHandler( async (req, res) => {
   await User.findByIdAndUpdate(
      req.user._id ,     // now you are able to access req.user from auth.middleware as req.user = user
      {
         $set: {
            refreshToken: undefined
         }
      },
      {
         new: true // means the updated user document would be returned
      }
   )  
   const options = {
      httpOnly: true,
      secure: true
   }
   return res.status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccesssToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken; //- Looks for the refresh token either in cookies or in the request body.
   if(!incomingRefreshToken){
      throw new ApiError(401, "Unauthorized user")
   }
   try {
      const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      )
      const user = await User.findById(decodedToken?._id); //- Retrieves the user by the id,  
      if(!user){
         throw new ApiError(401, "Invalid refresh token from user")
      }
      if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, "Refresh token is expired or used")
      }
      const options = {
         httpOnly: true, 
         secure: true
      }
      // - Calls a helper function to generate a new access token and refresh token.
      const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id)
      return res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
         new ApiResponse(
            200, {accessToken, refreshToken: newrefreshToken}, 
            "Access and Refresh token "
         )
      )
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token" )
   }
})

const changeCurrentUserPassword = asyncHandler(async(req, res) => {
   const {oldPassword, newPassword, confirmPassword} = req.body;
   if(!(newPassword === confirmPassword)){
      throw new ApiError(200, "Password is incorrect");
   }
   const user = await User.findById(req.user?._id);
   const IsPasswordCorrect = await user.isPasswordCorrect(oldPassword)
   if(!IsPasswordCorrect){
      throw new ApiError(400, "Password is incorrect")
   }
   user.password = newPassword;
   await user.save({validateBeforeSave: false})
   
   return res.status(200)
   .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res)=> {
   return res.status(200)
   .json(200, req.user, "current user fetched successfully") // req.user -> fetched from middleware
})

const updateAccountDetails = asyncHandler( async(req, res) => {
   const {fullname,email  } = req.body;
   if(!(fullname || email)){
      throw new ApiError(400, "All fields are required")
   }
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullname: fullname,
            email: email,
         }
      },
      {new: true}
   ).select(" -password ")

   res.status(200)
   .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
   const avatarLocalPath = req.file?.path;
   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is missing");
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   if(!avatar.url){
      throw new ApiError(400, "Error while uploading on avatar")
   }
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            avatar: avatar.url
         }
      },
      {new: true}
   ).select(" -password");
   return res.status(200)
   .json(200, user, "Avatar is updated");
});

const updateUserCoverImage = asyncHandler( async(req, res) => {
   const coverImageLocalPath = req.file?.path;
   if(!coverImageLocalPath){
      throw new ApiError(400,"Cover Image file is missing");
   }
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if(!coverImage.url){
      throw new ApiError(400, "Error while uploading on Cover Image")
   }
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverImage: coverImage.url
         }
      },
      {new: true}
   ).select(" -password");

   return res.status(200)
   .json(
      new ApiResponse(200, user, "Cover Image updated successfully")
   )
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
   const {username} = req.params
   if(!username?.trim()){
      throw new ApiError(400, "Username is missing")
   }
   // runs aggregation pipelines
   const channel = await User.aggregate([
      {
         $match: {
            username: username?.toLowerCase()
         }
      },
      {
         $lookup: {
            from:"subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
         }
      },
      {
         $lookup: {
            from:"subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscriberdTo"
         }
      },
      {
         $addFields: {
            subscribersCount: {
               $size: "$subscribers"
            },
            chnnelsSubscribedToCount: {
               $size: "$subscribedTo"
            },
            isSubscribed: {
               $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"]},
                  then: true,
                  else: false
               }
            }
         }
      },
      {
         $project: {
            fullname: 1,
            username: 1,
            subscribersCount:1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
         }
      }
   ])

   console.log("Channel pipelines value from user-controller -> ", channel);

   if(!channel?.length){
      throw new ApiError(404, "Channel doesn't exists")
   }

   return res.status(200)
   .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully" )
   )

})

export {
   registerUser, 
   loginUser, 
   logOutUser, 
   refreshAccesssToken, 
   changeCurrentUserPassword, 
   getCurrentUser, 
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
}

/* steps for user registration
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
/* steps for loginUser
   1. req body -> data
   2. username, email
   3. find the user
   4. password check
   5. access and refresh token
   6. send cookies
 */