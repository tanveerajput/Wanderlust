const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const db_url=process.env.ATLAS_URL;

main()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(db_url);
}

const initDB = async () => {

  await Listing.deleteMany({});
  initData.data=initData.data.map((obj)=>({
    ...obj,
    owner:"69fb3548b2cf17d90898c009"
  }));
  await Listing.insertMany(initData.data);
  console.log("data initialised");
};

initDB();