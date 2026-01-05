const prisma = require('../lib/prisma');
const { logger } = require('../lib/logger');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// REGISTER USER
exports.registerUser = async (req, res) => {
  try {
    // Input validated by middleware
    const { fullName, dob, email, password } = req.body;

    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ message: 'Email already registered' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        dob: new Date(dob),
        email,
        password: hashedPassword,
        role: 'user',
        status: 'active',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        dob: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userSafe = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      dob: user.dob
        ? {
            iso: user.dob.toISOString(),
            local: new Date(user.dob).toLocaleString(),
            timezone: tz,
          }
        : null,
      createdAt: user.createdAt
        ? {
            iso: user.createdAt.toISOString(),
            local: new Date(user.createdAt).toLocaleString(),
            timezone: tz,
          }
        : null,
    };

    res.status(201).json({ message: 'User registered successfully', user: userSafe });
  } catch (err) {
    if (req && req.log) req.log.error({ err }, 'registerUser failed');
    else logger.error({ err }, 'registerUser failed');
    res.status(500).json({ message: 'Internal server error' });
  }
};

// LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        password: true,
        role: true,
        status: true,
        dob: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      },
    );

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userSafe = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      dob: user.dob
        ? {
            iso: user.dob.toISOString(),
            local: new Date(user.dob).toLocaleString(),
            timezone: tz,
          }
        : null,
      createdAt: user.createdAt
        ? {
            iso: user.createdAt.toISOString(),
            local: new Date(user.createdAt).toLocaleString(),
            timezone: tz,
          }
        : null,
    };

    res.json({ message: 'Login successful', token, user: userSafe });
  } catch (err) {
    if (req && req.log) req.log.error({ err }, 'loginUser failed');
    else logger.error({ err }, 'loginUser failed');
    res.status(500).json({ message: 'Internal server error' });
  }
};
// GET USER BY ID (admin or user himself)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin or user himself
    if (req.user.role !== 'admin' && req.user.id != id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await prisma.user.findUnique({
      where: { id },

      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        dob: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userSafe = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      dob: user.dob
        ? {
            iso: user.dob.toISOString(),
            local: new Date(user.dob).toLocaleString(),
            timezone: tz,
          }
        : null,
      createdAt: user.createdAt
        ? {
            iso: user.createdAt.toISOString(),
            local: new Date(user.createdAt).toLocaleString(),
            timezone: tz,
          }
        : null,
    };

    res.json(userSafe);
  } catch (err) {
    if (req && req.log) req.log.error({ err }, 'getUserById failed');
    else logger.error({ err }, 'getUserById failed');
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // parse pagination params
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    // total users count
    const totalUsers = await prisma.user.count();

    // fetch users with pagination
    const users = await prisma.user.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      pagination: {
        totalUsers,
        limit,
        offset,
        returned: users.length,
      },
      users,
    });
  } catch (error) {
    if (req && req.log) req.log.error({ error }, 'getAllUsers failed');
    else logger.error({ error }, 'getAllUsers failed');
    return res.status(500).json({ message: 'Internal server error' });
  }
};
// BLOCK USER (admin or user himself)
exports.blockUser = async (req, res) => {
  try {
    const { id } = req.params; // id is coerced to number by validateParams

    if (req.user.role !== 'admin' && req.user.id != id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
      },
    });

    res.json({ message: 'User blocked successfully', user });
  } catch (err) {
    // handle record-not-found error from Prisma
    if (err && err.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (req && req.log) req.log.error({ err }, 'blockUser failed');
    else logger.error({ err }, 'blockUser failed');
    res.status(500).json({ message: 'Internal server error' });
  }
};
