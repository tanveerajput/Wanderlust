require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const listing = require("./models/listing.js");

const db_url = process.env.ATLAS_URL;

async function fixGeometry() {
    try {
        await mongoose.connect(db_url ,{ tlsAllowInvalidCertificates: true, });
        console.log("✅ Connected to MongoDB");

        const listings = await listing.find({});
        console.log(`Found ${listings.length} total listings\n`);

        for (let l of listings) {
            try {
                const query = `${l.location}, ${l.country}`;
                console.log(`📍 Fetching: ${query}`);

                const response = await axios.get(
                    "https://nominatim.openstreetmap.org/search",
                    {
                        params: { q: query, format: "json", limit: 1 },
                        headers: { "User-Agent": "WanderlustApp/1.0" }
                    }
                );

                if (response.data.length > 0) {
                    l.geometry = {
                        type: "Point",
                        coordinates: [
                            parseFloat(response.data[0].lon),
                            parseFloat(response.data[0].lat)
                        ]
                    };
                    await l.save();
                    console.log(`✅ ${l.title} → [${l.geometry.coordinates}]`);
                } else {
                    l.geometry = {
                        type: "Point",
                        coordinates: [77.2090, 28.6139]  // default: Delhi
                    };
                    await l.save();
                    console.log(`⚠️  ${l.title} → no result, used default Delhi coords`);
                }

                // Nominatim allows 1 request/second
                await new Promise(resolve => setTimeout(resolve, 1100));

            } catch (err) {
                console.error(`❌ Error for "${l.title}":`, err.message);
            }
        }

        console.log("\n🎉 Done! All listings updated.");
        await mongoose.connection.close();

    } catch (err) {
        console.error("Connection error:", err.message);
        process.exit(1);
    }
}

fixGeometry();