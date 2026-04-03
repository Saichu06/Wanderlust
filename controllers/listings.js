const Listing = require("../models/listing")

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
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
                path: "author"   // 🔥 THIS FIXES YOUR ISSUE
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
    let url = req.file.path;
    let filename = req.file.filename;
    // console.log(url, filename);

    if (!req.body.listing) {
        throw new ExpressError(400, "Send valid data");
    }

    const newListing = new Listing(req.body.listing);

    // 🔥 Assign owner
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

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
    originalImageUrl= originalImageUrl.replace("/upload","/upload/h_300,w_250");  

    res.render("listings/edit.ejs", { listing , originalImageUrl});
}

module.exports.updateListing = async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "Send valid data");
    }

    const { id } = req.params;

    const listing = await Listing.findByIdAndUpdate(id, req.body.listing, {
        new: true,
        runValidators: true
    });

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    // Only update image if a new file was uploaded
    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
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