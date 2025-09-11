import { CTA_DICTIONARY, CTA_HELPERS } from '@/lib/cta-dictionary'

describe('CTA dictionary logo/name filtering', () => {
  test('does not filter common CTA text like "Join Waitlist" as a logo', () => {
    const text = 'Join Waitlist'
    const isLogo = CTA_HELPERS.matchesAnyPattern(text, CTA_DICTIONARY.LOGO_PATTERNS as unknown as RegExp[])
    expect(isLogo).toBe(false)
  })

  test('still filters explicit logo phrases', () => {
    const text = 'ACME logo'
    const isLogo = CTA_HELPERS.matchesAnyPattern(text, CTA_DICTIONARY.LOGO_PATTERNS as unknown as RegExp[])
    expect(isLogo).toBe(true)
  })

  test('filters all-caps brand abbreviations', () => {
    const text = 'IBM'
    const isLogo = CTA_HELPERS.matchesAnyPattern(text, CTA_DICTIONARY.LOGO_PATTERNS as unknown as RegExp[])
    expect(isLogo).toBe(true)
  })
})

describe('CTA dictionary phrases include waitlist CTAs', () => {
  test('includes "join waitlist" phrase', () => {
    const contains = CTA_DICTIONARY.PRIMARY_CTA_PHRASES.some(p => p.includes('join waitlist'))
    expect(contains).toBe(true)
  })
})

