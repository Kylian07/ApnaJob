const Application = require("../models/Application");

exports.downloadResume = async (req, res) => {
  const app = await Application.findById(req.params.appId);
  if (!app || !app.resume || !app.resume.data) return res.status(404).send("Resume not found");
  res.set("Content-Type", app.resume.contentType);
  res.set("Content-Disposition", `attachment; filename="${app.resume.filename}"`);
  res.send(app.resume.data);
};
