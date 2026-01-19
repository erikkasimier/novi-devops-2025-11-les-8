const request = require('supertest');
const app = require('../src');
const data = require('../src/data');

describe('API Endpoints', () => {
  
  beforeEach(() => {
    data.reset();
  });

  describe('GET /', () => {
    test('returns welcome message', async () => {
      const res = await request(app).get('/');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Welcome');
    });
  });

  describe('GET /health', () => {
    test('returns health status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/items', () => {
    test('returns all items', async () => {
      const res = await request(app).get('/api/items');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
    });
  });

  describe('GET /api/items/:id', () => {
    test('returns item by id', async () => {
      const res = await request(app).get('/api/items/1');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.name).toBe('Item 1');
    });

    test('returns 404 for non-existent item', async () => {
      const res = await request(app).get('/api/items/999');
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/items', () => {
    test('creates new item', async () => {
      const newItem = { name: 'New Item', description: 'A new item' };
      
      const res = await request(app)
        .post('/api/items')
        .send(newItem);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('New Item');
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('createdAt');
    });

    test('returns 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ description: 'No name' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Name is required');
    });
  });

});
