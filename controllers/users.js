const Listing = require("../models/listing")
const Review = require("../models/review")
const User = require("../models/user")

module.exports.signupRenderForm = (req, res) => {
    res.render("users/signup.ejs");
}

module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;

        const newUser = new User({ username, email });

        const registeredUser = await User.register(newUser, password);

        console.log(registeredUser);

        // 🔥 Auto login after signup
        req.login(registeredUser, (err) => {
            if (err) return next(err);

            req.flash("success", "Welcome to WanderLust!");
            res.redirect("/listings");
        });

    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
}



module.exports.loginRenderForm = (req, res) => {
    res.render("users/login.ejs");
}


module.exports.login = (req, res) => {

    req.flash("success", "Welcome Wanderer!");

    const redirectUrl = res.locals.redirectUrl || "/listings"; // 🔥 FIX
    res.redirect(redirectUrl);
}

module.exports.logout = (req,res,next) =>{
    req.logout((err) =>{
        if(err){
            next(err);
        }
        req.flash("success","you are logged out!");
        res.redirect("/listings");
    })
}