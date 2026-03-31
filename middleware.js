const Review = require("./models/review");
const Listing = require("./models/listing"); 

module.exports.isLoggedin = (req, res, next) => {
    console.log(req.user);  
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "Login to create listing!");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
        delete req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not the owner of this listing!");
        return res.redirect(`/listings/${id}`);
    }

    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;

    const review = await Review.findById(reviewId);
    
    if (!review) {
        req.flash("error", "Review not found!");
        return res.redirect(`/listings/${id}`);
    }

    // Get the listing to check if current user is the owner
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Allow BOTH: review author OR listing owner
    if (
        review.author.equals(req.user._id) ||
        listing.owner.equals(req.user._id)
    ) {
        return next();
    }

    req.flash("error", "You are not authorized to delete this review!");
    res.redirect(`/listings/${id}`);
};