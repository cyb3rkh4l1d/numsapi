require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../../src/lib/prisma');
const { logger } = require('../../src/lib/logger');

async function main() {
  const email = 'admin@example.com';
  const password = 'Admin@123'; // change if you like

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (existingAdmin) {
    logger.info({ email }, 'Admin already exists');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin User',
      dob: new Date('1990-01-01'),
      email,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    },
  });

  logger.info({ id: admin.id, email: admin.email }, 'Admin user created');
}

main()
  .catch((e) => {
    logger.error({ e }, 'Error seeding admin');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
