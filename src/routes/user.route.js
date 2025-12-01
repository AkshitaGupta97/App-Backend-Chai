import { Router } from "express";
import { changeCurrentUserPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logOutUser, refreshAccesssToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"; 
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();  //Creates a new router object to define routes
router.route("/register").post(  //- Sets up a POST endpoint at /register
    upload.fields([  //Configures Multer to accept multiple file fields
        {
            name: "avatar",  // only one is allowed
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser // After Multer processes the files, control passes to the (registerUser) 
)

router.route("/login").post(loginUser);

// secured route 
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccesssToken)
router.route("/change-password").post(verifyJWT, changeCurrentUserPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(verifyJWT, upload.single("/coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("watch-history").get(verifyJWT, getWatchHistory)

export default router;