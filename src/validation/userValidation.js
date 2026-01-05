const { z } = require('zod');

/* =======================
   SCHEMAS
======================= */

// Registration
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date of Birth must be a valid date'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// URL param (user id)
const userIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Invalid user id')
    .transform(Number)
    .refine((n) => n > 0, 'Invalid user id'),
});

/* =======================
   GENERIC VALIDATOR
======================= */

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // Replace with validated + sanitized data
    req[property] = result.data;
    next();
  };
};

// Convenience wrappers for body and params
const validateBody = (schema) => validate(schema, 'body');
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
  registerSchema,
  loginSchema,
  userIdParamSchema,
  validate,
  validateBody,
  validateParams,
};
