function errorMiddleware(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) console.error(err);
  res
    .status(status)
    .json({
      success: false,
      message:
        status >= 500
          ? err.status
            ? err.message
            : "Unexpected server error."
          : err.message,
    });
}
module.exports = errorMiddleware;
