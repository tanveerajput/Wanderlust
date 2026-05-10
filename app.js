require("dotenv").config();

const express = require("express");
const app = express();

const mongoose = require("mongoose");
const path = require("path");
const methodoverride = require("method-override");
const ejsmate = require("ejs-mate");

const expresserror = require("./utils/expresserror.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");

const flash = require("connect-flash");

const passport = require("passport");
const localstrategy = require("passport-local");

const user = require("./models/user.js");

const db_url = process.env.ATLAS_URL;





// DATABASE CONNECTION + SERVER START
async function main() {

    // connect mongodb
    await mongoose.connect(db_url);

    console.log("connected to db");



    // SESSION STORE
    const store = MongoStore.create({

        client: mongoose.connection.getClient(),

        crypto: {
            secret: process.env.SECRET,
        },

        touchAfter: 24 * 3600,
    });



    // SESSION STORE ERROR
    store.on("error", (err) => {
        console.log("SESSION STORE ERROR", err);
    });




    // SESSION CONFIG
    const sessionoptions = {

        store,

        secret: process.env.SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {

            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

            maxAge: 7 * 24 * 60 * 60 * 1000,

            httpOnly: true,
        },
    };




    // MIDDLEWARES
    app.set("view engine", "ejs");

    app.set("views", path.join(__dirname, "views"));

    app.use(express.urlencoded({ extended: true }));

    app.use(methodoverride("_method"));

    app.engine("ejs", ejsmate);

    app.use(express.static(path.join(__dirname, "public")));




    // SESSION
    app.use(session(sessionoptions));

    app.use(flash());




    // PASSPORT
    app.use(passport.initialize());

    app.use(passport.session());

    passport.use(new localstrategy(user.authenticate()));

    passport.serializeUser(user.serializeUser());

    passport.deserializeUser(user.deserializeUser());




    // LOCALS MIDDLEWARE
    app.use((req, res, next) => {

        res.locals.success = req.flash("success");

        res.locals.error = req.flash("error");

        res.locals.currUser = req.user;

        next();
    });




    // ROUTES
    app.use("/listings", listingRouter);

    app.use("/listings", reviewRouter);

    app.use("/", userRouter);




    // 404 HANDLER
    app.use((req, res, next) => {
        next(new expresserror(404, "page not found"));
    });




    // ERROR HANDLER
    app.use((err, req, res, next) => {

        const { statusCode = 500, message = "Something went wrong" } = err;

        console.log(err);

        if (res.headersSent) {
            return next(err);
        }

        res.status(statusCode).render("error.ejs", { message });
    });




    // SERVER
    const PORT = process.env.PORT || 8080;

    app.listen(PORT, () => {
        console.log(`server listening on port ${PORT}`);
    });

}



// START APP
main().catch((err) => {
    console.log("DATABASE CONNECTION ERROR", err);
});