    if(process.env.NODE_ENV!="production"){
        require("dotenv").config();   
    }

    const express = require("express");
    const app = express();
    const mongoose = require("mongoose");

    const Listing = require("./models/listing.js");
    const Review = require("./models/review.js");
    const session = require("express-session");
    const MongoStore = require("connect-mongo");
    const flash = require("connect-flash");

    const listingRouter = require("./routes/listing");
    const reviewRouter = require("./routes/review");
    const userRouter = require("./routes/user");

    const wrapAsync = require("./utils/wrapAsync.js");
    const ExpressError = require("./utils/ExpressError.js");

    const path = require("path");
    const engine = require("ejs-mate");

    // Passport
    const passport = require("passport");
    const LocalStrategy = require("passport-local").Strategy;
    const User = require("./models/user.js");

    const { listingSchema, reviewSchema } = require("./schema.js");


    const methodOverride = require("method-override");

    // View Engine
    app.engine("ejs", engine);
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));

    // Middleware
    app.use(express.static(path.join(__dirname, "public")));
    app.use(express.urlencoded({ extended: true }));
    app.use(methodOverride("_method"));

    // ---------------- DB CONNECTION ----------------
    // const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

    const dbUrl = process.env.ATLASDB_URL;

    async function main() {
        await mongoose.connect(dbUrl)
    .then(() => console.log("Connected"))
    .catch(err => console.log(err));
    }

    main();

    const store = MongoStore.create({
        mongoUrl: dbUrl,   // use your .env URL
        crypto: {
            secret: "mysupersecretcode",
        },
        touchAfter: 24 * 3600, // reduce DB writes (1 day)
    });

    store.on("error", (err) => {
        console.log("❌ ERROR in Mongo Session Store", err);
    });

    // ---------------- SESSION ----------------
    const sessionOptions = {
        store, // 🔥 THIS IS THE KEY ADDITION
        secret: "mysupersecretcode",
        resave: false,
        saveUninitialized: true,
        cookie: {
            expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
        },
    };

    app.use(session(sessionOptions));
    app.use(flash());

    // ---------------- PASSPORT ----------------
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(User.authenticate()));

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    // ---------------- GLOBAL MIDDLEWARE ----------------
    app.use((req, res, next) => {
        res.locals.success = req.flash("success");
        res.locals.error = req.flash("error");
        res.locals.currUser = req.user; // 🔥 important
        next();
    });

    // ---------------- DEMO USER ----------------
    // app.get("/demouser", async (req, res) => {
    //     let fakeuser = new User({
    //         email: "chuchu@gmail.com",
    //         username: "Saichu"
    //     });

    //     let registeredUser = await User.register(fakeuser, "password123");
    //     res.send(registeredUser);
    // });

    // ---------------- ROUTES ----------------
    app.get("/", (req, res) => {
        res.redirect("/listings");
    });

    app.use("/listings", listingRouter);
    app.use("/listings/:id/reviews", reviewRouter);
    app.use("/",userRouter)
    // ---------------- SERVER ----------------
    app.listen(8080, () => {
        console.log("Server is running on port 8080");
    });