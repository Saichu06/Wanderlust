const express = require("express");
const router = express.Router();

const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapasync");
const ExpressError = require("../utils/ExpressError");
const { listingSchema } = require("../schema");

const { isLoggedin, isOwner } = require("../middleware.js");

const listingController = require("../controllers/listings.js");

const multer = require('multer')
const { storage } = require("../cloud_config.js");
const upload = multer({ storage })


// Validation
const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    next();
};

// Routes
router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedin,upload.single('listing[image]'),validateListing ,wrapAsync(listingController.createListing));

router.route("/new")
    .get(isLoggedin, listingController.renderNewForm);

router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedin, isOwner, upload.single('listing[image]') , validateListing, wrapAsync(listingController.updateListing))
    .delete(isLoggedin, isOwner, wrapAsync(listingController.deleteListing));

router.route("/:id/edit")
    .get(isLoggedin, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;