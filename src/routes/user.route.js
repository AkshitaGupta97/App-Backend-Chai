import { Router } from "express";
import { loginUser, logOutUser, refreshAccesssToken, registerUser } from "../controllers/user.controller.js";
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


export default router;