const express = require("express");
const router = express.Router();
const passport = require("passport");

const wrapAsync = require("../utils/wrapasync");
const { saveRedirectUrl } = require("../middleware");

const userController = require("../controllers/users");

// Routes
router.route("/signup")
    .get(userController.signupRenderForm)
    .post(wrapAsync(userController.signup));

router.route("/login")
    .get(userController.loginRenderForm)
    .post(saveRedirectUrl, passport.authenticate('local', { 
        failureRedirect: '/login', 
        failureFlash: true 
    }), userController.login);

router.route("/logout")
    .get(userController.logout);

module.exports = router;