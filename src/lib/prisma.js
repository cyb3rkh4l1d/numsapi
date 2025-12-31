require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

// Single shared Prisma client across the app
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL),
});

module.exports = prisma;

// When running tests, jest.mock('../src/lib/prisma') will replace this module with mocked functions.
