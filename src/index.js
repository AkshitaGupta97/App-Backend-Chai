//require('dotenv').config({path: '/.env'});
// or as the below method is not in use. to use this add the given configuration and in package.json add -> ["dev": "nodemon -r dotenv/config  --experimental-json-modules  src/index.js"]
import dotenv from "dotenv";

//import mongoose from "mongoose";
//import { DB_NAME } from "./constant";

import connectDB from "./DB/databse.js";
import { app } from "./app.js";

dotenv.config({
    path: "/.env"
})
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MongoDb connection failed !!", err)
})


/*
import express from express;
const app = express();
// iife [immediately invoked function expression]
;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("Errorrr", error);
            throw error;
        })
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT} `)
        })

    }
    catch(error){
        console.log("Error in", error);
        throw error;
    }
})()
*/
