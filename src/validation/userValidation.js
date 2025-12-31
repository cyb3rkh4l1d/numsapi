const { z } = require("zod");

// Registration validation
const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  dob: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      "Date of Birth must be a valid date"
    ),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Login validation
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const blockUserParamsSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9]+$/, "Invalid user id")
    .transform((s) => parseInt(s, 10))
    .refine((n) => Number.isInteger(n) && n > 0, {
      message: "Invalid user id",
    }),
});

module.exports = { registerSchema, loginSchema, blockUserParamsSchema };
