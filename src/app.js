require('dotenv').config();
const express = require('express');
const app = express();

const { httpLogger } = require('./lib/logger');

// Request logging + request-id header
app.use(httpLogger);
app.use(express.json());
app.use((req, res, next) => {
  if (req.id) res.setHeader('X-Request-Id', req.id);
  next();
});

// Routes
const userRoutes = require('./routes/userRoutes');

app.use('/api/users', userRoutes);

// Debug / test routes (useful for graceful shutdown testing)
app.get('/test/sleep/:ms', async (req, res) => {
  const ms = Math.max(0, Math.min(60000, parseInt(req.params.ms, 10) || 5000));
  await new Promise((r) => setTimeout(r, ms));
  res.json({ done: true, waited: ms });
});
// Global error handler
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;
