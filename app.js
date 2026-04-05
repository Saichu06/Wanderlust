if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");

const Listing = require("./models/listing.js");


const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");

const wrapAsync = require("./utils/wrapasync.js");
const ExpressError = require("./utils/ExpressError.js");

const path = require("path");
const engine = require("ejs-mate");

// Passport
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");


const methodOverride = require("method-override");

// ---------------- VIEW ENGINE ----------------
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------------- MIDDLEWARE ----------------
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// ---------------- DB URL ----------------
const dbUrl = process.env.ATLASDB_URL;

if (!dbUrl) {
    console.log("❌ ATLASDB_URL is missing");
    process.exit(1);
}

if (process.env.NODE_ENV !== "production") {
    console.log("DB URL:", dbUrl);
}

// ---------------- MAIN FUNCTION ----------------
async function main() {
    try {
        // ✅ CONNECT DB
        await mongoose.connect(dbUrl);
        console.log("✅ MongoDB Connected");

        // ✅ SESSION STORE (AFTER DB CONNECTS)
        const store = MongoStore.create({
            client: mongoose.connection.getClient(),
            crypto: {
                secret: process.env.SESSION_SECRET,
            },
            touchAfter: 24 * 3600,
        });

        store.on("error", (err) => {
            console.log("❌ SESSION STORE ERROR:", err);
        });

        // ✅ SESSION CONFIG
        app.use(session({
            store,
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: true,
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 7,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
            },
        }));

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
            res.locals.currUser = req.user;
            next();
        });

        // ---------------- ROUTES ----------------
        app.get("/", (req, res) => {
            res.redirect("/listings");
        });

        app.use("/listings", listingRouter);
        app.use("/listings/:id/reviews", reviewRouter);
        app.use("/", userRouter);

        // ---------------- SERVER ----------------
        const PORT = process.env.PORT || 8080;

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (err) {
        console.log("❌ ERROR:", err);
    }
}

// ---------------- START APP ----------------
main();