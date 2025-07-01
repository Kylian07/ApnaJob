const express = require("express");
const router = express.Router();
const application = require("../controllers/applicationController");

router.get("/resume/:appId", application.downloadResume);

module.exports = router;
