const express=require("express");
const router=express.Router();
const expresserror=require("../utils/expresserror.js");
const wrapasync=require("../utils/wrapasync.js");
const review=require("../models/reviews.js");
const listing=require("../models/listing.js");
const {validateReview, isLoggedIn,isReviewAuthor}=require("../middleware.js");
const reviewcontroller=require("../controller/reviews.js");


//post route
router.post(
  "/:id/reviews",isLoggedIn ,validateReview,
  wrapasync(reviewcontroller.createReviews)
);


//delete review route
router.delete(
  "/:id/reviews/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  wrapasync(reviewcontroller.destroyReview)
);

module.exports=router;