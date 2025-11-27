import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema(
    {
        videoFile: {
            type: String,
            required: true
        },
        thumbnail: {
            type:String,
            required: true
        },
        description: {
            type:String,
            required: true
        },
        duration: {
            type:Number,  // cloudinary
            required: true
        },
        views: {
            type:Number,
            default: 0
        },
        isPublished: {
            type:Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {timestamps: true}
)

videoSchema.plugin(mongooseAggregatePaginate) 
/*- This line enhances your schema with a new method:
Model.aggregatePaginate()*/

export const Video = mongoose.model("Video", videoSchema)

/*
- This brings in the mongoose-aggregate-paginate-v2 package,
 which adds pagination support to Mongoose aggregate queries.

 👉 So in short:
videoSchema.plugin(mongooseAggregatePaginate) adds a pagination helper for aggregate 
queries to your Video model, making it easy to fetch results page by page with metadata.

 */