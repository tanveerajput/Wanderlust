// Load .env from the project root, regardless of where this is run from
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

// Same DNS override as app.js — this script opens its own connection
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const db_url = process.env.ATLAS_URL;

if (!db_url) {
  console.error("FATAL: ATLAS_URL not set. Is .env in the project root?");
  process.exit(1);
}

// The user who will own every seeded listing.
// Must be a real _id from the users collection in THIS database.
const OWNER_ID = process.env.SEED_OWNER_ID;

if (!OWNER_ID) {
  console.error("FATAL: SEED_OWNER_ID not set in .env");
  console.error("Sign up a user at http://localhost:8080/signup, then find");
  console.error("their _id in Atlas > Browse Collections > users, and add:");
  console.error("  SEED_OWNER_ID=paste_the_id_here");
  process.exit(1);
}

main()
  .then(() => initDB())
  .then(() => {
    console.log("done");
    return mongoose.connection.close();
  })
  .catch((err) => {
    console.error("SEED FAILED:", err.message);
    process.exit(1);
  });

async function main() {
  await mongoose.connect(db_url);
  console.log("connected to db");
}

const initDB = async () => {
  // Verify the owner actually exists before wiping anything
  const User = require("../models/user.js");
  const owner = await User.findById(OWNER_ID);
  if (!owner) {
    throw new Error(
      `No user found with _id ${OWNER_ID}. Check SEED_OWNER_ID in .env.`
    );
  }
  console.log(`seeding with owner: ${owner.username}`);

  const deleted = await Listing.deleteMany({});
  console.log(`deleted ${deleted.deletedCount} existing listings`);

  const seeded = initData.data.map((obj) => ({
    ...obj,
    owner: OWNER_ID,
  }));

  const inserted = await Listing.insertMany(seeded);
  console.log(`inserted ${inserted.length} listings`);
};