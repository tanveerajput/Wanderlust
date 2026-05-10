
const express=require("express");
const router=express.Router();
const wrapasync=require("../utils/wrapasync.js");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });
const { cloudinary } = require("../cloudinary");
const listingcontroller=require("../controller/listing.js");
//const listing=require("../models/listing.js");
const {isLoggedIn,isowner,validatelisting}=require("../middleware.js");


//index route+ post route //create route
router
.route("/")
.get(wrapasync(listingcontroller.index))
.post(
  isLoggedIn,
  upload.single("image"),   // ⭐ multer must come first
  validatelisting,
  wrapasync(listingcontroller.createListing)
);


//new route
    router.get("/new",isLoggedIn,listingcontroller.renderForm);

//show route + upadate route + delete route
router
.route("/:id")
.get(wrapasync(listingcontroller.showListing))
.put(
isLoggedIn,isowner,validatelisting,
  upload.single("image"),
 wrapasync(listingcontroller.updateListing)
)
.delete(
  isLoggedIn,
  isowner,
  wrapasync(listingcontroller.destroyListing)
);  


//edit route
router.get("/:id/edit",isLoggedIn,isowner,wrapasync(listingcontroller.renderEditForm));


module.exports=router;