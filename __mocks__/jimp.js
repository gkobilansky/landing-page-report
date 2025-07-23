// Mock Jimp module for testing
const mockJimp = {
  read: jest.fn(() => Promise.resolve({
    bitmap: {
      width: 100,
      height: 100,
      data: new Array(100 * 100 * 4).fill(255), // Mock RGBA data
    },
    scan: jest.fn((x, y, w, h, callback) => {
      // Mock scan function
      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < h; dy++) {
          const idx = ((y + dy) * w + (x + dx)) << 2;
          callback.call(this, x + dx, y + dy, idx);
        }
      }
      return this;
    }),
    getWidth: jest.fn(() => 100),
    getHeight: jest.fn(() => 100),
    clone: jest.fn(() => mockJimp),
    resize: jest.fn(() => mockJimp),
    quality: jest.fn(() => mockJimp),
    write: jest.fn(() => Promise.resolve()),
    getBuffer: jest.fn(() => Promise.resolve(Buffer.from('fake-image-data'))),
  })),
  
  // Mock constants
  MIME_PNG: 'image/png',
  MIME_JPEG: 'image/jpeg',
  AUTO: -1,
};

module.exports = mockJimp;