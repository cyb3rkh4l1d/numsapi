const { logger } = require('../lib/logger');

module.exports = (err, req, res, _next) => {
  // mark `_next` as intentionally unused to satisfy linter
  void _next;
  const status = err.status || 500;
  const payload = {
    success: false,
    error: {
      message: err.message || 'Internal server error',
      status,
    },
  };

  // log with request-scoped logger if available
  if (req && req.log) {
    req.log.error({ err, status }, 'Unhandled error');
  } else {
    logger.error({ err, status }, 'Unhandled error');
  }

  res.status(status).json(payload);
};
