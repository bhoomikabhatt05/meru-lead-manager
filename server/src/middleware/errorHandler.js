/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error(`[Error] ${err.message}`);

  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Handle specific error types
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Duplicate entry — a record with this value already exists' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
}

module.exports = { errorHandler };
