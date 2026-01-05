const app = require('./app');
const prisma = require('./lib/prisma');

const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT = parseInt(process.env.SHUTDOWN_TIMEOUT_MS, 10) || 10000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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
  console.log(`Graceful shutdown initiated: ${reason}`);

  // Stop accepting new connections
  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    console.log('HTTP server closed');
  } catch (err) {
    console.error('Error closing HTTP server:', err);
  }

  // Give existing connections some time, then forcefully destroy them
  const forceTimeout = setTimeout(() => {
    console.warn('Forcing open connections to close');
    connections.forEach((socket) => {
      try {
        socket.destroy();
      } catch (e) {
        console.error('Error destroying socket:', e);
      }
    });
  }, SHUTDOWN_TIMEOUT);

  // Disconnect Prisma
  try {
    await prisma.$disconnect();
    console.log('Prisma disconnected');
  } catch (err) {
    console.error('Error disconnecting Prisma:', err);
  }

  clearTimeout(forceTimeout);
  console.log('Shutdown complete. Exiting process.');
  process.exit(0);
}

// Signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
  gracefulShutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

module.exports = { server, gracefulShutdown };
