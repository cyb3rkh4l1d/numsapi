const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/register", userController.registerUser); // worked
router.post("/login", userController.loginUser); // <-- THIS MUST EXIST

module.exports = router;
