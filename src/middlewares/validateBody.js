const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return res.status(400).json({ errors });
  }
  req.body = result.data; // sanitized/coerced input
  next();
};

module.exports = validateBody;
