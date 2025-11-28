import multer from "multer"

//tells Multer to save uploaded files directly to disk
const storage = multer.diskStorage({   //Creates a storage engine that saves files to the file system
    destination: function (req, file, cb){ // destination -> specifies folder where file is stored
        cb(null, "../public/temp") //, every file is saved inside
    },
    //determines the name of the file once saved as originalname
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})
// creates (upload) middleware using the storage configuration
export const upload = multer({
    storage,
}); 