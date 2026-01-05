(async () => {
  require('dotenv').config();
  const prisma = require('../src/lib/prisma');
  try {
    console.log('Attempting prisma.user.count()...');
    const c = await prisma.user.count();
    console.log('User count:', c);
  } catch (e) {
    console.error('Prisma error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
