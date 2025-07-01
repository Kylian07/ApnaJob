require('dotenv').config()
const bcrypt = require('bcrypt')
const otpGenerator = require("otp-generator");

const user = require("../models/User");
const OTP = require('../models/Otpmodel');
const mailSender = require("../utils/mailSender");

function passwordValidator(str) {
  // Check for at least one digit
  const hasNumber = /\d/.test(str);
  // Check for at least one non-digit character (letters, symbols, etc.)
  // The \W regex matches any non-word character (e.g., symbols, spaces)
  // The [a-zA-Z] matches any letter
  const hasCharacter = /[a-zA-Z\W_]/.test(str);

  return hasNumber && hasCharacter;
}

exports.signup = async (req, res) => {
  try {
    const { email, otp1, otp2, otp3, otp4 } = req.body;

    // Check if All Details are there or not
    if (
      !email ||
      !otp1 || !otp2 || !otp3 || !otp4
    ) {
      return res.render("signup", {
        error: "All Fields are required",
        otp_viewer: true,
        email: email
      });
    }

    console.log(otp1, otp2, otp3, otp4);

    const otp = parseInt(`${otp1}${otp2}${otp3}${otp4}`);
    console.log("Combined" + otp);

    //Password validation
    // if (password.length < 8) {
    //   return res.render("/signup", {
    //     error: "password should contain atleast 8 characters",
    //     // name: name,
    //     // username: username,
    //     // email: email,
    //     //role: role,
    //     // pasword: null
    //   });
    // }

    // if (!passwordValidator(password)) {
    //   return res.render("/signup", {
    //     error: "Password must contain Number and character",
    //     // name: name,
    //     // username: username,
    //     // email: email,
    //     //role: role,
    //     // pasword: null
    //   });
    // }

    //check if use already exists?
    if (await user.findOne({ email: email }).exec()) {
      return res.render("signup", {
        error: "Email already exist",
        otp_viewer: null
      });
    }

    //check if use already exists?
    // const existingUsername = await user.findOne({ username })
    // if (await user.findOne({ username: username }).exec()) {
    //   return res.render("/signup", {
    //     error: "Username already exist",
    //     // name: name,
    //     // username: null,
    //     // email: email,
    //     //role: role,
    //     // pasword: password
    //   });
    // }

    const result = await OTP.findOne({ email: email });
    console.log(result);
    if (result.otp === otp) {
      // Hash password
      // const hashedPassword = await bcrypt.hash(password, process.env.DB_PASS_HASH_KEY);

      // const name = result.name;
      // const username = result.username;
      // const pas
      //save in database
      console.log(result);

      await user.create({
        name: result.name,
        username: result.username,
        email: email,
        password: result.password,
        role: result.role
      });

      console.log("data saved in database user");

      const client = await user.findOne({
        $or: [{ username: result.username }, { email: result.email }]
      });

      req.session.user = {
        id: client._id,
        username: client.username,
        role: client.role
      };

      // return res.render("job_website");
      return res.redirect("/home")

    }

    return res.render("signup", {
      error: "Wrong Otp",
      otp_viewer: true,
      email: email
    });

  } catch (error) {
    console.error(error)
    return res.render("signup", {
      error: "Server Error! Please signup again",
      otp_viewer: null
    });
  }
}


exports.sendotp = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body

    // Check if All Details are there or not
    if (!name ||
      !username ||
      !email ||
      !password ||
      !role
    ) {
      return res.render("signup", {
        error: "All Fields are required",
        otp_viewer: null,
        name: name,
        username: username,
        email: email,
        // role: role,
        pasword: password
      });
    }


    //Password validation
    if (password.length < 8) {
      return res.render("signup", {
        error: "password should contain atleast 8 characters",
        otp_viewer: null,
        name: name,
        username: username,
        email: email,
        // role: role,
        pasword: null
      });
    }

    if (!passwordValidator(password)) {
      return res.render("signup", {
        error: "Password must contain Number and character",
        otp_viewer: null,
        name: name,
        username: username,
        email: email,
        // role: role,
        pasword: null
      });
    }

    //check if use already exists?
    if (await user.findOne({ email: email }).exec()) {
      return res.render("signup", {
        error: "Email already exist",
        otp_viewer: null,
        name: name,
        username: username,
        email: null,
        // role: role,
        pasword: password
      });
    }

    //check if use already exists?
    // const existingUsername = await user.findOne({ username })
    if (await user.findOne({ username: username }).exec()) {
      return res.render("signup", {
        error: "Username already exist",
        otp_viewer: null,
        name: name,
        username: null,
        email: email,
        // role: role,
        pasword: password
      });
    }

    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log(otp);

    const result = await OTP.findOne({ email: email }).exec();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("password hashed")

    if (result) {
      const filter = { email: email };
      await OTP.updateOne(filter, { name: name, username: username, email: email, password: hashedPassword, role: role, otp: otp });
    }
    else {
      await OTP.create({ name: name, username: username, email: email, password: hashedPassword, role: role, otp: otp });
    }

    await mailSender(email, "OTP Verification", `Your Verification OTP : ${otp}`);
    console.log("mail send");

    return res.render("signup", {
      error: null,
      otp_viewer: true,
      email: email,
    });

  } catch (error) {
    console.error(error)
    return res.render("signup", {
      error: "Server Error! Please signup again",
      otp_viewer: null
    });
  }
}

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const client = await user.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });

    console.log(client)

    if (!client) return res.render("login", {
      error: "Invalid username or email",
      identifier: identifier,
      password: password
    });

    const isMatch = await bcrypt.compare(password, client.password);
    
    console.log(isMatch)

    if (!isMatch) return res.render("login", {
      error: "Invalid password",
      identifier: identifier,
      password: null
    });

    req.session.user = {
      id: client._id,
      username: client.username,
      role: client.role
    };

    console.log(req.session.user);

    // res.render("home");
    // return res.render("job_website");
    return res.redirect("/home")
  } catch (error) {
    console.error(error)
    return res.render("login", { error: "Server Error! Please login again" });
  }
}

exports.logout = async (req, res) => {
  req.session.destroy(() => res.render("login", { error: null }));
}
