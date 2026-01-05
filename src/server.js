const app = require('./app');
const prisma = require('./lib/prisma');
const { logger } = require('./lib/logger');

const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT = parseInt(process.env.SHUTDOWN_TIMEOUT_MS, 10) || 10000;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server running');
});

// Track open connections so we can destroy them on forced shutdown
const connections = new Set();
server.on('connection', (socket) => {
  connections.add(socket);
  socket.on('close', () => connections.delete(socket));
});

let isShuttingDown = false;

async function gracefulShutdown(reason) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ reason }, 'Graceful shutdown initiated');

  // Stop accepting new connections
  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    logger.info('HTTP server closed');
  } catch (err) {
    logger.error({ err }, 'Error closing HTTP server');
  }

  // Give existing connections some time, then forcefully destroy them
  const forceTimeout = setTimeout(() => {
    logger.warn('Forcing open connections to close');
    connections.forEach((socket) => {
      try {
        socket.destroy();
      } catch (e) {
        logger.error({ e }, 'Error destroying socket');
      }
    });
  }, SHUTDOWN_TIMEOUT);

  // Disconnect Prisma
  try {
    await prisma.$disconnect();
    logger.info('Prisma disconnected');
  } catch (err) {
    logger.error({ err }, 'Error disconnecting Prisma');
  }

  clearTimeout(forceTimeout);
  logger.info('Shutdown complete. Exiting process.');
  // eslint-disable-next-line no-process-exit
  process.exit(0);
}

// Signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection');
  gracefulShutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  gracefulShutdown('uncaughtException');
});

module.exports = { server, gracefulShutdown };
