const express = require("express");
const router = express.Router();

const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapasync");
const ExpressError = require("../utils/ExpressError");
const { listingSchema } = require("../schema");

const { isLoggedin ,isOwner } = require("../middleware.js");

/* ---------------- VALIDATION ---------------- */
const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    next();
};

/* ---------------- INDEX ---------------- */
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));

/* ---------------- NEW ---------------- */
router.get("/new", isLoggedin, (req, res) => {
    res.render("listings/new.ejs");
});

/* ---------------- CREATE ---------------- */
router.post("/",
    isLoggedin,              // ✅ FIRST check login
    validateListing,         // ✅ THEN validate
    wrapAsync(async (req, res) => {

        if (!req.body.listing) {
            throw new ExpressError(400, "Send valid data");
        }

        const newListing = new Listing(req.body.listing);

        // 🔥 Assign owner
        newListing.owner = req.user._id;

        await newListing.save();

        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
}));

/* ---------------- EDIT ---------------- */
router.get("/:id/edit", isOwner, 
    isLoggedin,
    wrapAsync(async (req, res) => {

        const { id } = req.params;
        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }

        res.render("listings/edit.ejs", { listing });
}));

/* ---------------- UPDATE ---------------- */
router.put("/:id", isOwner , 
    isLoggedin,
    validateListing,
    wrapAsync(async (req, res) => {

        if (!req.body.listing) {
            throw new ExpressError(400, "Send valid data");
        }

        const { id } = req.params;

        const listing = await Listing.findByIdAndUpdate(id, req.body.listing, {
            new: true
        });

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }

        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
}));

/* ---------------- SHOW ---------------- */
router.get("/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate("reviews").populate("owner");

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
}));

/* ---------------- DELETE ---------------- */
router.delete("/:id", isOwner ,
    isLoggedin,
    wrapAsync(async (req, res) => {

        const { id } = req.params;

        const listing = await Listing.findByIdAndDelete(id);

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }

        req.flash("success", "Listing Deleted!");
        res.redirect("/listings");
}));

module.exports = router;