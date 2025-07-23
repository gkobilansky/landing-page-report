// Mock canvas module for testing
module.exports = {
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: new Array(4).fill(0) })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({ data: new Array(4).fill(0) })),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      fillText: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
    })),
    toBuffer: jest.fn(() => Buffer.from('fake-image-data')),
    width: 100,
    height: 100,
  })),
  createImageData: jest.fn(() => ({ data: new Array(4).fill(0) })),
  loadImage: jest.fn(() => Promise.resolve({
    width: 100,
    height: 100,
  })),
  Image: function() {
    this.width = 100;
    this.height = 100;
    this.onload = null;
    this.onerror = null;
    this.src = '';
  },
  ImageData: function(data, width, height) {
    this.data = data || new Array(width * height * 4).fill(0);
    this.width = width || 100;
    this.height = height || 100;
  }
};