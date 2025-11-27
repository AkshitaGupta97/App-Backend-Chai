import multer from "multer"

//tells Multer to save uploaded files directly to disk
const storage = multer.diskStorage({  
    destination: function (req, file, cb){ // destination -> specifies folder where file is stored
        cb(null, "../public/temp")
    },
    //determines the name of the file once saved as originalname
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

export const upload = multer({
    storage,
}); 