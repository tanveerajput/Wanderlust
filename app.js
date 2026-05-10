require("dotenv").config();
const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const methodoverride=require("method-override");
const ejsmate=require("ejs-mate");
const expresserror=require("./utils/expresserror.js");
const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const session=require("express-session");
const MongoStore = require("connect-mongo");
const flash=require("connect-flash");
const passport=require("passport");
const localstrategy=require("passport-local");
const user=require("./models/user.js");
const userRouter=require("./routes/user.js");
const db_url=process.env.ATLAS_URL;



main()
.then(()=>{
    console.log("connected to db");
})
.catch((err)=>
{console.log(err);});


async function main(){
    await mongoose.connect(db_url, {
      tlsAllowInvalidCertificates: true, 
    });
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodoverride("_method"));
app.engine("ejs",ejsmate);
app.use(express.static(path.join(__dirname,"/public")));


const store = MongoStore.create({
  mongoUrl: db_url,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in Mongo Session Store", err);
});


const sessionoptions={
  store, //mongostore info that is goin in sessions
  secret: process.env.SECRET,
  resave:false,
saveUninitialized: true,
  cookie: {
   expires: new Date(Date.now()+7 *24*60*60*1000),
   maxAge:7 *24*60*60*1000,   //milliseconds in 1 week
    httpOnly:true,
},
};

// app.get("/",(req,res)=>{
//     res.send("hi, i am root");
// }); 


app.use(session(sessionoptions));
app.use(flash());//phele flash aayega and then routes ayenge 


app.use(passport.initialize());
app.use(passport.session());
passport.use(new localstrategy(user.authenticate()));//used to verify thee users while login
passport.serializeUser(user.serializeUser());//used to store the users data
passport.deserializeUser(user.deserializeUser());//used to delete / unstore the data from the user



 app.use((req,res,next)=>{
  res.locals.success=req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser=req.user;
  next();
 });//creaated a middleware to store any success mss in res.locals and then called next so that it will match to other routes like listings and reviews
//and then in index.ejs in listing.js in views folder we have initialised success to print 


// app.get("/demouser",async(req,res)=>{
//     let fakeuser=new User({
//         email: "student@gmail.com",
//         username:"delta-stud",
//     });
//     let registeredUser=await User.register(fakeuser,"helloworld");
//     res.send(registeredUser);
// });


app.use("/listings",listingRouter);//routes
app.use("/listings",reviewRouter);
app.use("/",userRouter);

app.use((req, res, next) => {
  next(new expresserror(404, "page not found"));
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs",{message});

});

app.listen(8080,()=>{
    console.log("server is listening to port 8080");
});  




