const request = require("supertest");
const axios = require("axios");
const app = require("../app.js");
const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Review = require("../models/reviews.js");
const { registerAndLogin } = require("./helpers/auth.js");
const { createListing, createReview } = require("./helpers/factories.js");

afterEach(() => {
    jest.restoreAllMocks();
});

test("5. GET /listings returns 200 and shows seeded listings", async () => {
    await createListing({ title: "Mountain Retreat" });

    const res = await request(app).get("/listings");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Mountain Retreat");
});

test("6. POST /listings while logged out redirects to /login and creates nothing", async () => {
    const res = await request(app)
        .post("/listings")
        .type("form")
        .send({ listing: { title: "Should not exist" } });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");

    const count = await Listing.countDocuments();
    expect(count).toBe(0);
});

test("7. POST /listings while logged in creates a listing with owner set to that user", async () => {
    // createListing controller geocodes via a live nominatim.openstreetmap.org
    // call - stub it so the test doesn't depend on network/a third party API.
    jest.spyOn(axios, "get").mockResolvedValue({ data: [] });

    const { agent, user } = await registerAndLogin(app);
    const owner = await User.findOne({ username: user.username });

    const res = await agent.post("/listings").type("form").send({
        listing: {
            title: "Beach House",
            description: "Sunny and bright",
            location: "Goa",
            country: "India",
            price: 3000,
        },
    });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/listings");

    const created = await Listing.findOne({ title: "Beach House" });
    expect(created).not.toBeNull();
    expect(created.owner.equals(owner._id)).toBe(true);
});

test("8. POST /listings with a missing required field is rejected, creates nothing", async () => {
    const { agent } = await registerAndLogin(app);

    const res = await agent.post("/listings").type("form").send({
        listing: {
            title: "Missing Fields House",
            // description omitted on purpose - required by the Joi schema
            location: "Goa",
            country: "India",
            price: 3000,
        },
    });

    expect(res.status).toBe(400);

    const count = await Listing.countDocuments();
    expect(count).toBe(0);
});

test("9. PUT /listings/:id by a NON-owner is rejected and does not modify the document", async () => {
    const listing = await createListing({ title: "Original Title" });
    const { agent } = await registerAndLogin(app);

    const res = await agent.put(`/listings/${listing._id}`).type("form").send({});

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`/listings/${listing._id}`);

    const unchanged = await Listing.findById(listing._id);
    expect(unchanged.title).toBe("Original Title");
});

test("PUT /listings/:id by the OWNER with a missing required field is rejected and leaves the document unchanged", async () => {
    const { agent, user } = await registerAndLogin(app);
    const owner = await User.findOne({ username: user.username });

    const listing = await createListing({ owner: owner._id, title: "Original Title" });

    // The real edit form posts multipart/form-data (it has a file input), so
    // req.body is only populated once multer runs - unlike the urlencoded
    // .type("form") requests used elsewhere in this file. Using .field() here
    // reproduces that and is what actually exercises the middleware-order bug.
    const res = await agent
        .put(`/listings/${listing._id}`)
        .field("listing[title]", "Updated Title")
        .field("listing[location]", "Goa")
        .field("listing[country]", "India")
        .field("listing[price]", "3000");
    // listing[description] omitted on purpose - required by the Joi schema

    expect(res.status).toBe(400);

    const unchanged = await Listing.findById(listing._id);
    expect(unchanged.title).toBe("Original Title");
});

test("10. DELETE /listings/:id by a NON-owner is rejected and the listing still exists", async () => {
    const listing = await createListing();
    const { agent } = await registerAndLogin(app);

    const res = await agent.delete(`/listings/${listing._id}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`/listings/${listing._id}`);

    const stillThere = await Listing.findById(listing._id);
    expect(stillThere).not.toBeNull();
});

test("11. DELETE /listings/:id by the owner removes it AND cascade-deletes its reviews", async () => {
    const { agent, user } = await registerAndLogin(app);
    const owner = await User.findOne({ username: user.username });

    const listing = await createListing({ owner: owner._id });
    const review1 = await createReview({ listing: listing._id, author: owner._id });
    const review2 = await createReview({ listing: listing._id, author: owner._id });

    const res = await agent.delete(`/listings/${listing._id}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/listings");

    const deletedListing = await Listing.findById(listing._id);
    expect(deletedListing).toBeNull();

    const remainingReviews = await Review.find({
        _id: { $in: [review1._id, review2._id] },
    });
    expect(remainingReviews).toHaveLength(0);
});
