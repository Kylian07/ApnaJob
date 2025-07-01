// 404 Not Found Handler
function notFound(req, res, next) {
  res.status(404);
  res.render("404", { url: req.originalUrl });
}

// General Error Handler
function errorHandler(err, req, res, next) {
  console.error("🔥 Error:", err.stack || err.message);
  res.status(err.status || 500);
  res.render("error", {
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
}

module.exports = { notFound, errorHandler };
