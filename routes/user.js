const express=require("express");
const router=express.Router();
const User=require("../models/user.js");
const wrapAsync=require("../utils/wrapAsync");
const passport=require("passport");
const {saveRedirectUrl}=require("../middleware.js");
 const usercontroller=require("../controller/users.js");

//signup route
router
.route("/signup")
.get(usercontroller.renderSignup)
.post(wrapAsync(usercontroller.signup)
);

//login route
router
.route("/login")
.get(usercontroller.renderLogin)
.post(
    saveRedirectUrl,
    passport.authenticate("local",
    {failureRedirect:"/login", failureFlash: true, }),
    usercontroller.login
  );
//post request willbe async as it has to validate whether the uset exists or not
//and that work will be done by our passport.authenticate middelware function

router.get("/logout",usercontroller.logout);

module.exports=router;