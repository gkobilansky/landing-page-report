// Global Jest mocks to handle native modules
jest.mock('canvas', () => require('./__mocks__/canvas.js'));
jest.mock('jimp', () => require('./__mocks__/jimp.js'));

// Prevent loading of .node files
const originalRequire = require;
require = jest.fn((id) => {
  if (id.endsWith('.node')) {
    return {};
  }
  return originalRequire(id);
});