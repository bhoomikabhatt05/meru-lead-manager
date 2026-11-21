/**
 * Middleware to validate request body against a Zod schema
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    // Replace req.body with parsed/coerced data
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
