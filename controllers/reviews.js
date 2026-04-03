const Listing = require("../models/listing")
const Review = require("../models/review")

module.exports.createReview = async (req, res) => {
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
}

module.exports.deleteReview = async (req, res) => {
        const { id, reviewId } = req.params;

        await Listing.findByIdAndUpdate(id, {
            $pull: { reviews: reviewId }
        });

        await Review.findByIdAndDelete(reviewId);

        req.flash("success", "Review Deleted!");
        res.redirect(`/listings/${id}`);
}