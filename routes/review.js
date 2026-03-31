const express = require("express");
const router = express.Router({ mergeParams: true });

const Listing = require("../models/listing");
const Review = require("../models/review");

const wrapAsync = require("../utils/wrapasync");
const ExpressError = require("../utils/ExpressError");
const { reviewSchema } = require("../schema");

const { isLoggedin, isReviewAuthor } = require("../middleware.js");

/* ---------------- VALIDATION ---------------- */
const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    next();
};

/* ---------------- CREATE REVIEW ---------------- */
/* ---------------- CREATE REVIEW ---------------- */
router.post("/",
    isLoggedin,
    validateReview,
    wrapAsync(async (req, res) => {
        const { id } = req.params;

        const listing = await Listing.findById(id);
        if (!listing) {
            throw new ExpressError(404, "Listing not found");
        }

        // 🔥 ADD THIS CHECK - prevents user from reviewing same listing twice
        const existingReview = await Review.findOne({
            author: req.user._id,
            _id: { $in: listing.reviews }
        });

        if (existingReview) {
            req.flash("error", "You can only leave ONE review per listing!");
            return res.redirect(`/listings/${id}`);
        }

        const newReview = new Review(req.body.review);
        newReview.author = req.user._id;

        listing.reviews.push(newReview);

        await newReview.save();
        await listing.save();

        req.flash("success", "Review Added!");
        res.redirect(`/listings/${id}`);
}));
/* ---------------- DELETE REVIEW ---------------- */
router.delete("/:reviewId",
    isLoggedin,
    isReviewAuthor,
    wrapAsync(async (req, res) => {
        const { id, reviewId } = req.params;

        await Listing.findByIdAndUpdate(id, {
            $pull: { reviews: reviewId }
        });

        await Review.findByIdAndDelete(reviewId);

        req.flash("success", "Review Deleted!");
        res.redirect(`/listings/${id}`);
}));

module.exports = router;