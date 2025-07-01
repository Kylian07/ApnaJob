const Job = require("../models/Job");
const Application = require("../models/Application");

exports.listJobs = async (req, res) => {
  const jobs = await Job.find({}).populate("recruiter", "username");
  res.render("employee", { jobs });
};

exports.viewJob = async (req, res) => {
  const job = await Job.findById(req.params.id).populate("recruiter", "username");
  if (!job) return res.status(404).send("Job not found");
  const alreadyApplied = await Application.findOne({ job: req.params.id, employer: req.session.user.id });
  res.render("employee_apply", { job, alreadyApplied });
};

exports.applyJob = async (req, res) => {
  const exists = await Application.findOne({
    job: req.params.id,
    employer: req.session.user.id
  });
  if (exists) return res.send("You have already applied for this job.");
  if (!req.file) return res.status(400).send("Please upload a resume file.");
  await Application.create({
    job: req.params.id,
    employer: req.session.user.id,
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    currentUniversity: req.body.currentUniversity,
    majorIn: req.body.majorIn,
    country: req.body.country,
    city: req.body.city,
    CGPA: req.body.CGPA,
    coverLetter: req.body.coverLetter || '',
    resume: {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname
    }
  });
  res.redirect("/employee/jobs");
};
