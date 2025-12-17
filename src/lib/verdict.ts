/**
 * Verdict utility for generating human-readable status labels
 * Based on overall score thresholds
 */

export interface Verdict {
  text: string
  colorClass: string
  bgClass: string
}

/**
 * Get a human-readable verdict based on the overall score
 * @param score - The overall score (0-100)
 * @returns Verdict object with text and color classes
 */
export function getVerdict(score: number): Verdict {
  if (score >= 85) {
    return {
      text: 'Excellent',
      colorClass: 'text-white',
      bgClass: 'bg-emerald-500'
    }
  }
  if (score >= 70) {
    return {
      text: 'Good',
      colorClass: 'text-white',
      bgClass: 'bg-green-500'
    }
  }
  if (score >= 50) {
    return {
      text: 'Fair',
      colorClass: 'text-white',
      bgClass: 'bg-amber-500'
    }
  }
  return {
    text: 'Critical',
    colorClass: 'text-white',
    bgClass: 'bg-red-500'
  }
}
