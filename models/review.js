const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewModel = new Schema({
    comment: String,
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now  // Remove parentheses - should be Date.now, not Date.now()
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

module.exports = mongoose.model("Review", reviewModel);