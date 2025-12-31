const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return res.status(400).json({ errors });
  }
  req.params = result.data; // parsed/coerced params (e.g., id as number)
  next();
};

module.exports = validateParams;
