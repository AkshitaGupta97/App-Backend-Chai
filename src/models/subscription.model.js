import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,  // one who is subscribing the user
        ref: "User",
    },
    channel: {
        type: Schema.Types.ObjectId,   // one whom subscriber is subscribing
        ref: "User"
    }
})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)
// Subscription will go in user.controller pipeline as "subscriptions"
