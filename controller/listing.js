const listing = require("../models/listing.js");
const { cloudinary } = require("../cloudinary");
const axios = require("axios");
const expresserror = require("../utils/expresserror.js");

module.exports.index = async (req, res) => {
    const allListings = await listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res, next) => {
    let { id } = req.params;
    const llisting = await listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");
    if (!llisting) {
        return next(new expresserror(404, "Listing not found"));
    }
   return res.render("listings/show.ejs", { llisting });
};

module.exports.createListing = async (req, res) => {
    try {
        // Fetch coordinates FIRST
        const geoResponse = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: req.body.listing.location + ", " + req.body.listing.country,
                format: "json",
                limit: 1
            },
            headers: { "User-Agent": "WanderlustApp/1.0" }
        });

        const newlisting = new listing(req.body.listing);

        if (req.file) {
            newlisting.image = {
                url: req.file.path,
                filename: req.file.filename,
            };
        }

        newlisting.owner = req.user._id;

        // Save geometry if found
        if (geoResponse.data.length > 0) {
            newlisting.geometry = {
                type: "Point",
                coordinates: [
                    parseFloat(geoResponse.data[0].lon),
                    parseFloat(geoResponse.data[0].lat)
                ]
            };
            console.log("Geometry saved:", newlisting.geometry);
        } else {
            console.log("No geometry found for:", req.body.listing.location);
            // Default to India coordinates
            newlisting.geometry = {
                type: "Point",
                coordinates: [77.2090, 28.6139]
            };
        }

        await newlisting.save();
        req.flash("success", "new listing created");
      return  res.redirect("/listings");

    } catch (err) {
        console.error("Error in createListing:", err.message);
        req.flash("error", "Error creating listing: " + err.message);
      return  res.redirect("/listings/new");
    }
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const llisting = await listing.findById(id);
   return res.render("listings/edit.ejs", { llisting });
};

module.exports.updateListing = async (req, res) => {
    try {
        let { id } = req.params;

        const geoResponse = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: req.body.listing.location + ", " + req.body.listing.country,
                format: "json",
                limit: 1
            },
            headers: { "User-Agent": "WanderlustApp/1.0" }
        });

        let update = await listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

        if (geoResponse.data.length > 0) {
            update.geometry = {
                type: "Point",
                coordinates: [
                    parseFloat(geoResponse.data[0].lon),
                    parseFloat(geoResponse.data[0].lat)
                ]
            };
        }

        if (typeof req.file !== "undefined") {
            update.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        await update.save();
        req.flash("success", "listing updated");
       return res.redirect(`/listings/${id}`);

    } catch (err) {
        console.error("Error in updateListing:", err.message);
        req.flash("error", "Error updating listing");
      return  res.redirect(`/listings`);
    }
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    const deletedListing = await listing.findByIdAndDelete(id);
    if (deletedListing?.image?.filename) {
        await cloudinary.uploader.destroy(deletedListing.image.filename);
    }
    req.flash("success", "listing deleted");
   return res.redirect("/listings");
};