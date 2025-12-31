module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const payload = {
    success: false,
    error: {
      message: err.message || "Internal server error",
      status,
    },
  };
  // Use console.error for now; replace with logger if added
  console.error(err.stack || err);
  res.status(status).json(payload);
};