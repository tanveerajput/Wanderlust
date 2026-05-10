const review=require("../models/reviews.js");
const listing=require("../models/listing.js");


module.exports.createReviews=async (req, res) => {
    const { id } = req.params;

    // 1️⃣ Find listing DOCUMENT
    const foundListing = await listing.findById(id);

    // ❗ SAFETY CHECK
    if (!foundListing) {
      throw new expresserror(404, "Listing not found");
    }

    // 2️⃣ Create review
    const newReview = new review(req.body.review);
newReview.author=req.user._id;
    // 3️⃣ Push review ID into listing
    foundListing.reviews.push(newReview._id);

    // 4️⃣ Save both
    await newReview.save();
    await foundListing.save();
    req.flash("success","new reveiw created");
    res.redirect(`/listings/${id}`);
  };



  module.exports.destroyReview=async(req,res)=>{
    let {id,reviewId}=req.params;
    await listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    await review.findByIdAndDelete(reviewId);
    req.flash("success","review deleted");
    res.redirect(`/listings/${id}`);
  };