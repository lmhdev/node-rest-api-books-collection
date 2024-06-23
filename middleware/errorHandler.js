const errorHandler = (err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    res.status(401).json({
      error: "Unauthorized: Access is denied due to invalid credentials",
      code: 401,
    });
  } else {
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      code: err.status || 500,
    });
  }
};

module.exports = errorHandler;
