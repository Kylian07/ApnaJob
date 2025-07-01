const express = require("express");
const router = express.Router();

// AUTHENTICATION ROUTES
const { login, signup, sendotp, logout } = require("../controllers/authController");

router.get('/signup', (req, res) => {
    // if (req.session) {
    //     res.redirect('back');
    // }
    res.render('signup.ejs', { error: req.query.error, otp_viewer: req.query.otp_viewer || null })
});

router.post("/signup", signup);

router.post("/sendotp", sendotp);

router.get("/login", (req, res) => {
    // if (req.session) {
    //     res.redirect('back');
    // }
    res.render("login", { error: req.query.error });
});

router.post("/login", login);

router.get('/logout', logout);

module.exports = router;
