const request = require('supertest');
const app = require('../src/app');
const { logger } = require('../src/lib/logger');

describe('logging', () => {
  let child;

  beforeEach(() => {
    child = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    jest.spyOn(logger, 'child').mockReturnValue(child);
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('attaches req.log and logs requests', async () => {
    const res = await request(app).get('/test/sleep/10').expect(200);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(logger.child).toHaveBeenCalled();
    expect(child.info).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: '/test/sleep/10', status: 200 }),
      'request completed',
    );
  });

  test('error middleware logs errors (unit test)', async () => {
    const errorHandler = require('../src/middlewares/errorHandler');

    const err = new Error('boom');
    const fakeReq = { log: child };
    const fakeRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const fakeNext = jest.fn();

    // call the error handler directly
    errorHandler(err, fakeReq, fakeRes, fakeNext);

    expect(fakeRes.status).toHaveBeenCalledWith(500);
    expect(fakeRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.any(Object) }),
    );

    expect(child.error).toHaveBeenCalledWith(
      expect.objectContaining({ err, status: 500 }),
      'Unhandled error',
    );
  });

  test('global logger used outside request context', () => {
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    logger.info({ job: 'x' }, 'msg');
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ job: 'x' }), 'msg');
  });
});
