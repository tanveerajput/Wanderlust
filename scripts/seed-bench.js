// Load .env from the project root, regardless of where this is run from
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env"), quiet: true });

// Same DNS override as app.js / init/index.js — this script opens its own connection
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Review = require("../models/reviews.js");

const db_url = process.env.ATLAS_URL;

if (!db_url) {
    console.error("FATAL: ATLAS_URL not set. Is .env in the project root?");
    process.exit(1);
}

const USER_COUNT = 10;
const LISTING_COUNT = 100;
const REVIEWS_PER_LISTING = 10;

const CITIES = [
    ["Malibu", "United States"],
    ["New York City", "United States"],
    ["Aspen", "United States"],
    ["Tuscany", "Italy"],
    ["Kyoto", "Japan"],
    ["Manali", "India"],
    ["Cape Town", "South Africa"],
    ["Reykjavik", "Iceland"],
    ["Queenstown", "New Zealand"],
    ["Lisbon", "Portugal"],
];

const COMMENTS = [
    "Great stay, would book again!",
    "Beautiful views and very clean.",
    "Host was responsive and helpful.",
    "A bit noisy at night but otherwise lovely.",
    "Exactly as described, highly recommend.",
    "Comfortable beds and a great location.",
    "Loved the neighborhood, lots to explore.",
    "Perfect for a weekend getaway.",
    "Would stay here again in a heartbeat.",
    "Good value for the price.",
];

async function main() {
    await mongoose.connect(db_url);
    console.log("connected to db");
}

async function seedUsers(runId) {
    const users = [];
    for (let i = 0; i < USER_COUNT; i++) {
        const username = `bench_user_${runId}_${i}`;
        const newUser = new User({ username, email: `${username}@example.com` });
        const registered = await User.register(newUser, "benchpass123");
        users.push(registered);
    }
    return users;
}

async function seedListings(users) {
    const listingDocs = [];
    for (let i = 0; i < LISTING_COUNT; i++) {
        const [location, country] = CITIES[i % CITIES.length];
        const owner = users[i % users.length];
        listingDocs.push({
            title: `Benchmark Listing #${i}`,
            description: `A realistic sample listing (#${i}) generated for benchmarking, located in ${location}.`,
            price: 1000 + (i % 20) * 100,
            location,
            country,
            geometry: { type: "Point", coordinates: [0, 0] },
            owner: owner._id,
        });
    }
    return Listing.insertMany(listingDocs);
}

async function seedReviews(users, listings) {
    const reviewDocs = [];
    for (const listing of listings) {
        for (let r = 0; r < REVIEWS_PER_LISTING; r++) {
            const author = users[Math.floor(Math.random() * users.length)];
            reviewDocs.push({
                comment: COMMENTS[(listing.title.length + r) % COMMENTS.length],
                rating: (r % 5) + 1,
                author: author._id,
            });
        }
    }

    const insertedReviews = await Review.insertMany(reviewDocs);

    const bulkOps = listings.map((listing, listingIndex) => {
        const start = listingIndex * REVIEWS_PER_LISTING;
        const reviewIds = insertedReviews
            .slice(start, start + REVIEWS_PER_LISTING)
            .map((review) => review._id);
        return {
            updateOne: {
                filter: { _id: listing._id },
                update: { $push: { reviews: { $each: reviewIds } } },
            },
        };
    });

    await Listing.bulkWrite(bulkOps);

    return insertedReviews;
}

main()
    .then(async () => {
        const runId = Date.now();

        const users = await seedUsers(runId);
        console.log(`created ${users.length} users`);

        const listings = await seedListings(users);
        console.log(`created ${listings.length} listings`);

        const reviews = await seedReviews(users, listings);
        console.log(`created ${reviews.length} reviews`);

        console.log("done");
        await mongoose.connection.close();
    })
    .catch((err) => {
        console.error("SEED-BENCH FAILED:", err.message);
        process.exit(1);
    });
