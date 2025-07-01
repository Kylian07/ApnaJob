const express = require("express");
const router = express.Router();
const employee = require("../controllers/employeeController");
const { requireLogin, requireRole } = require("../middleware/auth");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireLogin, requireRole("employer"));

router.get("/jobs", employee.listJobs);
router.get("/jobs/:id", employee.viewJob);
router.post("/jobs/:id/apply", upload.single("resume"), employee.applyJob);

module.exports = router;
