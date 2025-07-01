const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Application = require("../models/Application");
require("dotenv").config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const jobId = process.argv[2];
  if (!jobId) throw "Provide job ID.";

  const outDir = path.join(__dirname, "../tmp-resumes");
  fs.mkdirSync(outDir, { recursive: true });

  const apps = await Application.find({ job: jobId });
  for (const app of apps) {
    const filepath = path.join(outDir, app.resume.filename);
    fs.writeFileSync(filepath, app.resume.data);
    console.log(`Exported: ${app.resume.filename}`);
  }
  console.log("✅ All resumes exported.");
  process.exit(0);
})();
