const Job = require("../models/Job");
const Application = require("../models/Application");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

exports.listJobs = async (req, res) => {
  const jobs = await Job.find({ recruiter: req.session.user.id });
  res.render("recruiter1", { jobs });
};

exports.newJobForm = (req, res) => {
  res.render("new_job");
};

exports.createJob = async (req, res) => {
  const { title, description, requirements, salary, skillsRequired, skillsPreferred } = req.body;
  await Job.create({
    recruiter: req.session.user.id,
    title,
    description,
    requirements,
    salary,
    skillsRequired: skillsRequired.split(",").map(s => s.trim()),
    skillsPreferred: skillsPreferred.split(",").map(s => s.trim())
  });
  res.redirect("/recruiter/jobs");
};

exports.viewJob = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, recruiter: req.session.user.id });
  if (!job) return res.status(404).send("Job not found.");
  res.render("recruiter_job_detail", { job });
};

exports.editJobForm = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, recruiter: req.session.user.id });
  if (!job) return res.status(404).send("Job not found.");
  res.render("recruiter_job_edit", { job });
};

exports.updateJob = async (req, res) => {
  const updated = await Job.findOneAndUpdate(
    { _id: req.params.id, recruiter: req.session.user.id },
    {
      title: req.body.title,
      description: req.body.description,
      requirements: req.body.requirements,
      salary: req.body.salary,
      skillsRequired: req.body.skillsRequired.split(",").map(s => s.trim()),
      skillsPreferred: req.body.skillsPreferred.split(",").map(s => s.trim())
    },
    { new: true }
  );
  if (!updated) return res.status(404).send("Job not found or unauthorized.");
  res.redirect(`/recruiter/jobs/${req.params.id}`);
};

exports.deleteJob = async (req, res) => {
  const job = await Job.findOneAndDelete({ _id: req.params.id, recruiter: req.session.user.id });
  if (!job) return res.status(403).send("Job not found or not authorized.");
  await Application.deleteMany({ job: req.params.id });
  res.redirect("/recruiter/jobs");
};

exports.listApplicants = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, recruiter: req.session.user.id });
  if (!job) return res.status(403).send("Forbidden");

  const applicants = await Application.find({ job: job._id }).populate("employer");
  const tempDir = path.join(__dirname, "..", "temp_resumes", `job_${job._id}`);
  fs.mkdirSync(tempDir, { recursive: true });

  for (const app of applicants) {
    if (!app.resume || !app.resume.data) continue;
    const filename = `${app._id}_${app.fullName.replace(/\s+/g, "_")}.docx`;
    fs.writeFileSync(path.join(tempDir, filename), app.resume.data);
  }

  const requiredSkills = Array.isArray(job.skillsRequired)
    ? job.skillsRequired.map(s => s.trim())
    : (typeof job.skillsRequired === "string" ? job.skillsRequired.split(",").map(s => s.trim()) : []);
  const preferredSkills = Array.isArray(job.skillsPreferred)
    ? job.skillsPreferred.map(s => s.trim())
    : (typeof job.skillsPreferred === "string" ? job.skillsPreferred.split(",").map(s => s.trim()) : []);

  const atsProcess = spawn("python", [
    path.join(__dirname, "..", "scripts", "ats.py"),
    "--folder", tempDir,
    "--required", requiredSkills.join(","),
    "--preferred", preferredSkills.join(",")
  ]);

  let atsOutput = "";
  atsProcess.stdout.on("data", (data) => atsOutput += data.toString());
  atsProcess.stderr.on("data", (data) => console.error("ATS error:", data.toString()));

  atsProcess.on("close", (code) => {
    if (code !== 0) return res.status(500).send("ATS scoring failed");

    let rankedResults;
    try {
      rankedResults = JSON.parse(atsOutput);
    } catch (err) {
      console.error("ATS JSON parse error:", err);
      return res.status(500).send("Failed to parse ATS results");
    }

    const rankedApplicants = rankedResults
      .map(result => {
        const idFromFilename = result.filename.split("_")[0];
        const matched = applicants.find(app => app._id.toString() === idFromFilename);
        return {
          applicant: matched,
          score: result.score,
          details: result
        };
      })
      .filter(item => !!item.applicant);

    res.render("recruiter_applicants", { job, rankedApplicants });
  });
};

exports.viewApplicantDetail = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, recruiter: req.session.user.id });
  if (!job) return res.status(403).send("Forbidden");
  const application = await Application.findOne({ _id: req.params.appId, job: job._id }).populate("employer", "username");
  if (!application) return res.status(404).send("Application not found");
  res.render("recruiter_applicant_detail", { job, application });
};
