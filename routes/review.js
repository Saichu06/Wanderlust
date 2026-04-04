const express = require("express");
const router = express.Router({ mergeParams: true });

const Listing = require("../models/listing");
const Review = require("../models/review");

const wrapAsync = require("../utils/wrapasync.js");
const ExpressError = require("../utils/ExpressError");
const { reviewSchema } = require("../schema");

const { isLoggedin, isReviewAuthor } = require("../middleware.js");

const reviewController = require("../controllers/reviews.js");

// Validation
const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    next();
};

// Routes
router.route("/")
    .post(isLoggedin, validateReview, wrapAsync(reviewController.createReview));

router.route("/:reviewId")
    .delete(isLoggedin, isReviewAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;