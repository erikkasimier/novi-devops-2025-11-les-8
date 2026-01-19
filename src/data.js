/**
 * Simple in-memory data store
 * In production, this would be a database
 */

let items = [
  { id: 1, name: 'Item 1', description: 'First item', createdAt: new Date().toISOString() },
  { id: 2, name: 'Item 2', description: 'Second item', createdAt: new Date().toISOString() },
  { id: 3, name: 'Item 3', description: 'Third item', createdAt: new Date().toISOString() }
];

let nextId = 4;

/**
 * Get all items
 * @returns {Array} All items
 */
function getAll() {
  return items;
}

/**
 * Get item by ID
 * @param {number} id - Item ID
 * @returns {Object|undefined} Item or undefined
 */
function getById(id) {
  return items.find(item => item.id === id);
}

/**
 * Create new item
 * @param {Object} data - Item data
 * @returns {Object} Created item
 */
function create(data) {
  const newItem = {
    id: nextId++,
    name: data.name,
    description: data.description || '',
    createdAt: new Date().toISOString()
  };
  items.push(newItem);
  return newItem;
}

/**
 * Update item
 * @param {number} id - Item ID
 * @param {Object} data - Updated data
 * @returns {Object|null} Updated item or null
 */
function update(id, data) {
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  
  items[index] = {
    ...items[index],
    ...data,
    id: items[index].id,
    updatedAt: new Date().toISOString()
  };
  
  return items[index];
}

/**
 * Delete item
 * @param {number} id - Item ID
 * @returns {boolean} Success
 */
function remove(id) {
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return false;
  
  items.splice(index, 1);
  return true;
}

/**
 * Reset data (for testing)
 */
function reset() {
  items = [
    { id: 1, name: 'Item 1', description: 'First item', createdAt: new Date().toISOString() },
    { id: 2, name: 'Item 2', description: 'Second item', createdAt: new Date().toISOString() },
    { id: 3, name: 'Item 3', description: 'Third item', createdAt: new Date().toISOString() }
  ];
  nextId = 4;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  reset
};
