const request = require("supertest");
const app = require("../app.js");
const Listing = require("../models/listing.js");
const Review = require("../models/reviews.js");
const { registerAndLogin } = require("./helpers/auth.js");
const { createListing, createReview } = require("./helpers/factories.js");

test("12. POST review while logged out is rejected", async () => {
    const listing = await createListing();

    const res = await request(app)
        .post(`/listings/${listing._id}/reviews`)
        .type("form")
        .send({ review: { rating: 4, comment: "Nice place" } });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");

    const updatedListing = await Listing.findById(listing._id);
    expect(updatedListing.reviews).toHaveLength(0);
    expect(await Review.countDocuments()).toBe(0);
});

test("13. POST review with rating 6 (out of range) is rejected by Joi", async () => {
    const listing = await createListing();
    const { agent } = await registerAndLogin(app);

    const res = await agent
        .post(`/listings/${listing._id}/reviews`)
        .type("form")
        .send({ review: { rating: 6, comment: "Too high a rating" } });

    expect(res.status).toBe(400);

    expect(await Review.countDocuments()).toBe(0);
    const updatedListing = await Listing.findById(listing._id);
    expect(updatedListing.reviews).toHaveLength(0);
});

test("14. DELETE review by a non-author is rejected", async () => {
    const listing = await createListing();
    const review = await createReview({ listing: listing._id });
    const { agent } = await registerAndLogin(app);

    const res = await agent.delete(`/listings/${listing._id}/reviews/${review._id}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`/listings/${listing._id}`);

    const stillExists = await Review.findById(review._id);
    expect(stillExists).not.toBeNull();
});
