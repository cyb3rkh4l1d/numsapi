const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = require('../src/lib/prisma');
// set mock functions for prisma user methods
prisma.user.findUnique = jest.fn();
prisma.user.create = jest.fn();
prisma.user.update = jest.fn();
prisma.user.findMany = jest.fn();
prisma.user.count = jest.fn();

const app = require('../src/app');

beforeEach(() => jest.resetAllMocks());

describe('Validation & Auth integration', () => {
  test('POST /api/users/register -> 400 on invalid body', async () => {
    const res = await request(app).post('/api/users/register').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  test('POST /api/users/register -> 201 on valid body', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 999,
      fullName: 'Test',
      email: 'x@e.com',
      dob: new Date('1990-01-01'),
      role: 'user',
      status: 'active',
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/users/register')
      .send({ fullName: 'Test', dob: '1990-01-01', email: 'x@e.com', password: 'Test@1234' });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('dob');
  });

  test('POST /api/users/login -> 200 with token & user', async () => {
    const pwHash = await bcrypt.hash('Test@1234', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 2,
      fullName: 'Test',
      email: 'x@e.com',
      password: pwHash,
      role: 'admin',
      status: 'active',
      dob: new Date('1990-01-01'),
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'x@e.com', password: 'Test@1234' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('dob');
  });
});
