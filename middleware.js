 const listing = require("./models/listing.js");
 
 const expresserror=require("./utils/expresserror.js");
const{ listingschema,reviewSchema}=require("./schema.js");
const reviews = require("./models/reviews.js");


 module.exports.isLoggedIn=(req,res,next)=>{

 if(!req.isAuthenticated()){
  req.session.redirectUrl=req.originalUrl;//session is the object thta stores the information
        req.flash("error","you must be logged in to modify listing!")
        return res.redirect("/login");
      }
      next();
    } ;

    module.exports.saveRedirectUrl=(req,res,next)=>{
      if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
      }
      next();
    };

 module.exports.isowner=async(req,res,next)=>{
    let { id } = req.params;//id will come from req ke parameters
let Listing=await listing.findById(id);//db se hum listing kolekar aayenge
if(!Listing.owner.equals(res.locals.currUser._id)){
   req.flash("error","you are not the owner of this listing");
   return res.redirect(`/listings/${id}`);
}
next();
 };



 module.exports.validatelisting=(req,res,next)=>{
 let {error} =listingschema.validate(req.body);
  if(error){
   let errmsg=error.details.map((el)=> el.message).join(".");
   throw new expresserror(400,errmsg);
  }
  else{
   next();
  }
 } ;


 module.exports.validateReview=(req,res,next)=>{
 let {error} =reviewSchema.validate(req.body);
  if(error){
   let errmsg=error.details.map((el)=> el.message).join(".");
   throw new expresserror(400,errmsg);
  }
  else{
   next();
  }
 } ;
 

 module.exports.isReviewAuthor=async(req,res,next)=>{
    let { id,reviewId } = req.params;//id will come from req ke parameters
let Review=await reviews.findById(reviewId );//db se hum listing kolekar aayenge
if(!Review.author.equals(res.locals.currUser._id)){
   req.flash("error","you are not the author of this review");
   return res.redirect(`/listings/${id}`);
}
next();
 };

