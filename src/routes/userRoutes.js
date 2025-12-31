// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getAllUsers, getUserById, blockUser } = require("../controllers/userController");
const { authenticate, adminMiddleware } = require("../middlewares/auth");
const validateParams = require("../middlewares/validateParams");
const validateBody = require("../middlewares/validateBody");
const {
  blockUserParamsSchema,
  registerSchema,
  loginSchema,
} = require("../validation/userValidation");

// Public routes
router.post("/register", validateBody(registerSchema), registerUser);
router.post("/login", validateBody(loginSchema), loginUser);

// Protected routes
router.get("/all", authenticate, adminMiddleware, getAllUsers);
router.get("/:id", authenticate, validateParams(blockUserParamsSchema), getUserById);
router.put(
  "/block/:id",
  authenticate,
  adminMiddleware,
  validateParams(blockUserParamsSchema),
  blockUser
);

module.exports = router;
