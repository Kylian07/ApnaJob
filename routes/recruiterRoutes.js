const express = require("express");
const router = express.Router();
const recruiter = require("../controllers/recruiterController");
const { requireLogin, requireRole } = require("../middleware/auth");

router.use(requireLogin, requireRole("recruiter"));

router.get("/jobs", recruiter.listJobs);
router.get("/jobs/new", recruiter.newJobForm);
router.post("/jobs/new", recruiter.createJob);
router.get("/jobs/:id", recruiter.viewJob);
router.get("/jobs/:id/edit", recruiter.editJobForm);
router.put("/jobs/:id", recruiter.updateJob);
router.delete("/jobs/:id", recruiter.deleteJob);
router.get("/jobs/:id/applicants", recruiter.listApplicants);
router.get("/jobs/:jobId/applicants/:appId", recruiter.viewApplicantDetail);

module.exports = router;
