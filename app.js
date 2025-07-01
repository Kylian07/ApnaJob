// app.js
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require('cors');
const methodOverride = require("method-override");
const path = require("path");
const { notFound, errorHandler } = require('./middleware/errorHandler');
const corsOptions = require('./config/corsOptions');
const {logger, logEvents} = require('./middleware/logEvents');
require('dotenv').config();

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// View engine
app.set("view engine", "ejs");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(methodOverride("_method"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});



// Import routes
const authRoutes = require("./routes/authRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

// Mount routes
app.use("/", authRoutes);
app.use("/recruiter", recruiterRoutes);
app.use("/employee", employeeRoutes);
app.use("/", applicationRoutes);

// Home page
app.get("/", (req, res) => res.redirect("/home"));
app.get("/home", (req, res) => {
  res.render("job_website");
});
app.get("/contact", (req, res) => {
  res.render("contact");
});

// custom middleware logger
app.use(logger);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.use(notFound);
app.use(errorHandler);
