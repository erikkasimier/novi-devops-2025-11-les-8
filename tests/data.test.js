const data = require('../src/data');

describe('Data Module', () => {
  
  beforeEach(() => {
    data.reset();
  });

  describe('getAll()', () => {
    test('returns all items', () => {
      const items = data.getAll();
      expect(items.length).toBe(3);
    });
  });

  describe('getById()', () => {
    test('returns item by id', () => {
      const item = data.getById(1);
      expect(item).toBeDefined();
      expect(item.id).toBe(1);
    });

    test('returns undefined for non-existent id', () => {
      const item = data.getById(999);
      expect(item).toBeUndefined();
    });
  });

  describe('create()', () => {
    test('creates new item with auto-generated id', () => {
      const newItem = data.create({ name: 'Test', description: 'Test item' });
      
      expect(newItem.id).toBe(4);
      expect(newItem.name).toBe('Test');
      expect(newItem.description).toBe('Test item');
      expect(newItem.createdAt).toBeDefined();
    });

    test('adds item to collection', () => {
      data.create({ name: 'Test' });
      const items = data.getAll();
      
      expect(items.length).toBe(4);
    });
  });

  describe('update()', () => {
    test('updates existing item', () => {
      const updated = data.update(1, { name: 'Updated Name' });
      
      expect(updated.name).toBe('Updated Name');
      expect(updated.updatedAt).toBeDefined();
    });

    test('returns null for non-existent item', () => {
      const result = data.update(999, { name: 'Test' });
      expect(result).toBeNull();
    });

    test('preserves original id', () => {
      const updated = data.update(1, { id: 999, name: 'Test' });
      expect(updated.id).toBe(1);
    });
  });

  describe('remove()', () => {
    test('removes existing item', () => {
      const result = data.remove(1);
      expect(result).toBe(true);
      
      const items = data.getAll();
      expect(items.length).toBe(2);
    });

    test('returns false for non-existent item', () => {
      const result = data.remove(999);
      expect(result).toBe(false);
    });
  });

  describe('reset()', () => {
    test('resets data to initial state', () => {
      data.create({ name: 'Extra' });
      data.remove(1);
      
      data.reset();
      
      const items = data.getAll();
      expect(items.length).toBe(3);
      expect(items[0].id).toBe(1);
    });
  });

});
