const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock canvas for Jimp compatibility  
    '^canvas$': '<rootDir>/__mocks__/canvas.js',
    // Mock Jimp to avoid canvas dependency
    '^jimp$': '<rootDir>/__mocks__/jimp.js',
    // Mock native binary files
    '\\.node$': '<rootDir>/__mocks__/native-module.js',
  },
  // Tell Jest to ignore transforming these modules
  transformIgnorePatterns: [
    'node_modules/(?!(jimp|canvas)/)',
  ],
  // Add setup to mock modules globally
  setupFiles: ['<rootDir>/jest.mocks.js'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/app/layout.tsx', // Exclude layout as it's mostly boilerplate
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)