import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"; 

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
export default router;