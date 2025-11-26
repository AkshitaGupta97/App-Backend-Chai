import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

// cors -> cross origin resource service. which is of different server,
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({
    limit:"10kb"
}));
app.use(express.static("public")); // it is used to store static files as image, pdf etc...
// to perform crud operations with cookies
app.use(cookieParser());

// this is for: if we ssee url the special characters is used as: [+ , %, $...] as urlencoded is used
app.use(express.urlencoded({extended: true, limit: "10kb"}))

 
export {app}
