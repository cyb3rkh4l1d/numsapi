const request = require('supertest');
const jwt = require('jsonwebtoken');

const prisma = require('../src/lib/prisma');
// set mock functions for prisma user methods
prisma.user.findUnique = jest.fn();
prisma.user.create = jest.fn();
prisma.user.update = jest.fn();
prisma.user.findMany = jest.fn();
prisma.user.count = jest.fn();

const app = require('../src/app');

const adminToken = (id = 2) =>
  jwt.sign(
    { id, email: 'admin@example.com', role: 'admin' },
    process.env.JWT_SECRET || 'testsecret',
  );

beforeEach(() => jest.resetAllMocks());

describe('Block user route', () => {
  test('returns 400 for invalid id', async () => {
    const res = await request(app)
      .put('/api/users/block/abc')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(400);
  });

  test('returns 404 when user not found', async () => {
    prisma.user.update.mockRejectedValue({ code: 'P2025' });
    const res = await request(app)
      .put('/api/users/block/999')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(404);
  });

  test('returns 200 when blocked', async () => {
    prisma.user.update.mockResolvedValue({
      id: 3,
      fullName: 'User',
      email: 'u@e.com',
      role: 'user',
      status: 'inactive',
    });
    const res = await request(app)
      .put('/api/users/block/3')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.user.status).toBe('inactive');
  });

  test('user can block themselves', async () => {
    prisma.user.update.mockResolvedValue({
      id: 5,
      fullName: 'Self User',
      email: 'self@example.com',
      role: 'user',
      status: 'inactive',
    });
    const userToken = jwt.sign(
      { id: 5, email: 'self@example.com', role: 'user' },
      process.env.JWT_SECRET || 'testsecret',
    );

    const res = await request(app)
      .put('/api/users/block/5')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.status).toBe('inactive');
  });

  test('user cannot block another user', async () => {
    const userToken = jwt.sign(
      { id: 6, email: 'user6@example.com', role: 'user' },
      process.env.JWT_SECRET || 'testsecret',
    );

    const res = await request(app)
      .put('/api/users/block/7')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});
