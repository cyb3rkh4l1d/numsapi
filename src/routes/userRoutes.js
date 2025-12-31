const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authenticate = require("../middlewares/auth");

// PUBLIC
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// PROTECTED
router.get("/all", authenticate, userController.getAllUsers);
router.put("/block/:id", authenticate, userController.blockUser);
router.get("/:id", authenticate, userController.getUserById);

module.exports = router;
