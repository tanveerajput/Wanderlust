const mongoose = require("mongoose");
const Listing = require("../../models/listing.js");
const Review = require("../../models/reviews.js");

async function createListing(overrides = {}) {
    const defaults = {
        title: "Cozy Cottage",
        description: "A cozy cottage by the woods",
        location: "Manali",
        country: "India",
        price: 1200,
        geometry: { type: "Point", coordinates: [77.209, 28.6139] },
        owner: new mongoose.Types.ObjectId(),
    };

    return Listing.create({ ...defaults, ...overrides });
}

async function createReview(overrides = {}) {
    const { listing, ...reviewOverrides } = overrides;
    const defaults = {
        comment: "Great stay!",
        rating: 5,
        author: new mongoose.Types.ObjectId(),
    };

    const review = await Review.create({ ...defaults, ...reviewOverrides });

    if (listing) {
        await Listing.findByIdAndUpdate(listing, { $push: { reviews: review._id } });
    }

    return review;
}

module.exports = { createListing, createReview };
