require("dotenv").config();
const mongoose = require("mongoose");
const listing = require("./models/listing.js");
const { data: sampleListings } = require("./init/data.js"); // adjust path if data.js is elsewhere
const axios = require("axios");

const db_url = process.env.ATLAS_URL;

async function seedDB() {
    await mongoose.connect(db_url);
    console.log("✅ Connected to MongoDB");

    // Clear existing listings
    await listing.deleteMany({});
    console.log("🗑️  Cleared old listings");

    for (let l of sampleListings) {
        try {
            const query = `${l.location}, ${l.country}`;
            console.log(`📍 Fetching coordinates for: ${query}`);

            const response = await axios.get(
                "https://nominatim.openstreetmap.org/search",
                {
                    params: { q: query, format: "json", limit: 1 },
                    headers: { "User-Agent": "WanderlustApp/1.0" }
                }
            );

            let geometry = {
                type: "Point",
                coordinates: [77.2090, 28.6139] // default Delhi
            };

            if (response.data.length > 0) {
                geometry = {
                    type: "Point",
                    coordinates: [
                        parseFloat(response.data[0].lon),
                        parseFloat(response.data[0].lat)
                    ]
                };
            }

            const newListing = new listing({
                ...l,
                geometry,
            });

            await newListing.save();
            console.log(`✅ Saved: ${l.title}`);

            // 1.1 second delay (Nominatim rate limit = 1 req/sec)
            await new Promise(resolve => setTimeout(resolve, 1100));

        } catch (err) {
            console.error(`❌ Error for ${l.title}:`, err.message);
        }
    }

    console.log("\n🎉 All listings seeded successfully!");
    await mongoose.connection.close();
}

seedDB().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});