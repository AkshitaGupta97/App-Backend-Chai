import mongoose, {Schema} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true // for searchable, make index true. to enable searching field
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        refreshToken: {
            type: String
        }

    },
    {timestamps: true}
)
/* 
    here we are using pre middleware, which is used befor "save", 
    here normal function is used instead of arrow because arrow function doesnot have "this" property.
    - Purpose: This is a Mongoose middleware hook that runs before saving a user document to the database.

 */
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();  // If the password field hasn’t been changed, skip hashing and move on
    this.password = await bcrypt.hash(this.password, 6);  // - If the password is new/modified, hash it using bcrypt with a salt round of 10.
    next() //Continue with the save operation.
})
/*
- Purpose: Checks if a given password matches the stored hashed password.
*/
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)  // Compares the plain text password entered by the user with the hashed password in the database.
}
/*
- Purpose: Creates a JWT access token for the user.
👉 Access tokens are short-lived and used to authenticate API requests
 */
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_ACCESS_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema);
