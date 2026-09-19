const express=require("express");
const router=express.Router();
const wrapasync=require("../utils/wrapasync.js");
const {isLoggedIn,validateBooking}=require("../middleware.js");
const bookingcontroller=require("../controller/booking.js");

//create booking
router.post(
  "/:id/bookings",
  isLoggedIn,
  validateBooking,
  wrapasync(bookingcontroller.createBooking)
);

//cancel booking
router.delete(
  "/:id/bookings/:bookingId",
  isLoggedIn,
  wrapasync(bookingcontroller.cancelBooking)
);

//booked dates for a calendar month: GET /listings/:id/availability?month=YYYY-MM
router.get("/:id/availability", wrapasync(bookingcontroller.showAvailability));

module.exports=router;
