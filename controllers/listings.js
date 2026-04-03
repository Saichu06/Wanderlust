const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const axios = require('axios');

// Helper function to get coordinates from address
async function getCoordinates(location, country) {
    const query = `${location}, ${country}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Airbnb-Clone/1.0' }
        });
        
        if (response.data && response.data[0]) {
            return {
                type: 'Point',
                coordinates: [parseFloat(response.data[0].lon), parseFloat(response.data[0].lat)]
            };
        }
    } catch (error) {
        console.error("Geocoding error:", error);
    }
    return null;
}

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({}).populate("owner");
    res.render("listings/index.ejs", { allListings });
}

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
}

module.exports.createListing = async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "Send valid data");
    }

    // Check if user already has a listing
    const existingListing = await Listing.findOne({ owner: req.user._id });
    if (existingListing) {
        req.flash("error", "You can only create ONE listing per account!");
        return res.redirect("/listings");
    }

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // Get coordinates from location
    const coords = await getCoordinates(req.body.listing.location, req.body.listing.country);
    if (coords) {
        newListing.geometry = coords;
    }

    // Handle image upload
    if (req.file) {
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");  

    res.render("listings/edit.ejs", { listing, originalImageUrl });
}

module.exports.updateListing = async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "Send valid data");
    }

    const { id } = req.params;

    // Check if location changed
    const oldListing = await Listing.findById(id);
    const locationChanged = oldListing.location !== req.body.listing.location || 
                           oldListing.country !== req.body.listing.country;

    const listing = await Listing.findByIdAndUpdate(id, req.body.listing, {
        new: true,
        runValidators: true
    });

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    // Update coordinates if location changed
    if (locationChanged) {
        const coords = await getCoordinates(req.body.listing.location, req.body.listing.country);
        if (coords) {
            listing.geometry = coords;
            await listing.save();
        }
    }

    // Only update image if a new file was uploaded
    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
}

module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findByIdAndDelete(id);

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
}