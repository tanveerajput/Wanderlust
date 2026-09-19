const express=require("express");
const router=express.Router();
const wrapasync=require("../utils/wrapasync.js");
const {isLoggedIn}=require("../middleware.js");
const bookingcontroller=require("../controller/booking.js");

//current user's bookings: GET /bookings
router.get("/", isLoggedIn, wrapasync(bookingcontroller.listMyBookings));

//booking confirmation page: GET /bookings/:bookingId
router.get("/:bookingId", isLoggedIn, wrapasync(bookingcontroller.showBooking));

module.exports=router;
