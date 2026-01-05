const pino = require('pino');

const isProd = process.env.NODE_ENV === 'production';

// Enable pretty transport only when explicitly requested (e.g. LOG_PRETTY='true')
const transport =
  !isProd && process.env.LOG_PRETTY === 'true'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  transport,
  base: { pid: process.pid },
});

// Lightweight request logging middleware that attaches a request-scoped logger
function httpLogger(req, res, next) {
  req.id =
    req.headers['x-request-id'] || Date.now().toString(36) + Math.random().toString(36).slice(2);
  req.log = logger.child({ reqId: req.id });
  res.setHeader('X-Request-Id', req.id);

  const start = Date.now();
  res.on('finish', () => {
    const latency = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    req.log[level](
      { method: req.method, url: req.originalUrl, status, latency },
      'request completed',
    );
  });

  next();
}

module.exports = { logger, httpLogger };
