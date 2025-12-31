require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

// Routes
const userRoutes = require("./routes/userRoutes");

app.use("/api/users", userRoutes);

// Global error handler
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

module.exports = app;
