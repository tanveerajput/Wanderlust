require("dotenv").config({ quiet: true });

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const compression = require("compression");
const app = express();

const mongoose = require("mongoose");
if (process.env.NODE_ENV === "development") {
    mongoose.set("debug", true);
}
const path = require("path");
const methodoverride = require("method-override");
const ejsmate = require("ejs-mate");

const expresserror = require("./utils/expresserror.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const bookingRouter = require("./routes/booking.js");
const myBookingsRouter = require("./routes/mybookings.js");
const userRouter = require("./routes/user.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");

const flash = require("connect-flash");
const passport = require("passport");
const localstrategy = require("passport-local");
const user = require("./models/user.js");

const db_url = process.env.ATLAS_URL;

// Fail fast with a readable message instead of a driver stack trace
if (!db_url) {
    console.error("FATAL: ATLAS_URL is not set. Check your .env file.");
    process.exit(1);
}
if (!db_url.startsWith("mongodb://") && !db_url.startsWith("mongodb+srv://")) {
    console.error("FATAL: ATLAS_URL has a bad scheme. It starts with:",
        JSON.stringify(db_url.substring(0, 25)));
    process.exit(1);
}

if (process.env.NODE_ENV !== "test") {
    mongoose
        .connect(db_url)
        .then(() => console.log("connected to db"))
        .catch((err) => console.log("DATABASE CONNECTION ERROR", err));
}

// In tests, fall back to express-session's default MemoryStore instead of
// opening a MongoStore connection to the production Atlas URL. express-session
// only prints its MemoryStore production warning when NODE_ENV === "production"
// (node_modules/express-session/index.js), so no suppression is needed here.
const store = process.env.NODE_ENV === "test"
    ? undefined
    : MongoStore.create({
        mongoUrl: db_url,
        touchAfter: 24 * 3600,
    });

if (store) {
    store.on("error", (err) => {
        console.log("SESSION STORE ERROR", err);
    });
}

const sessionoptions = {
    ...(store && { store }),
    secret: process.env.SECRET || "fallbacksecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(methodoverride("_method"));
app.engine("ejs", ejsmate);
app.use(express.static(path.join(__dirname, "public")));

app.use(session(sessionoptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localstrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use("/listings", listingRouter);
app.use("/listings", reviewRouter);
app.use("/listings", bookingRouter);
app.use("/bookings", myBookingsRouter);
app.use("/", userRouter);

app.use((req, res, next) => {
    next(new expresserror(404, "page not found"));
});

app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    console.log(err);
    if (res.headersSent) return next(err);
    // Fetch clients that ask for JSON (the booking widget) get the error as data.
    if (req.accepts(["html", "json"]) === "json") {
        return res.status(statusCode).json({ message, unavailableDates: err.unavailableDates });
    }
    res.status(statusCode).render("error.ejs", { message });
});

module.exports = app;