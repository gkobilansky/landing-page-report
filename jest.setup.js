import '@testing-library/jest-dom'

// Polyfill for Web APIs needed by Next.js API routes
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill fetch and related APIs
require('whatwg-fetch')

// Polyfill setImmediate for puppeteer compatibility
global.setImmediate = global.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: jest.fn().mockResolvedValue(data),
      status: init?.status || 200,
      headers: new Map()
    }))
  }
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-id' },
            error: null
          }))
        }))
      }))
    }))
  }
}))


// Mock puppeteer-config for CTA analysis tests
jest.mock('@/lib/puppeteer-config', () => ({
  createPuppeteerBrowser: jest.fn(() => Promise.resolve({
    newPage: jest.fn(() => Promise.resolve({
      setViewport: jest.fn(),
      goto: jest.fn(),
      setContent: jest.fn(),
      evaluate: jest.fn(() => Promise.resolve([])),
      screenshot: jest.fn(() => Promise.resolve(Buffer.from('fake-screenshot'))),
      url: jest.fn(() => 'https://example.com'),
      viewport: jest.fn(() => ({ width: 1920, height: 1080 })),
    })),
    close: jest.fn(),
  }))
}))

// Suppress console.log during tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}