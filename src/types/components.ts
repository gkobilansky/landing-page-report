// Component name types for the analysis system

/**
 * Canonical component names as defined in the documentation
 * These are the standardized names that should be used throughout the system
 */
export type CanonicalComponentName = 
  | 'speed'      // Page speed analysis
  | 'fonts'      // Font usage analysis  
  | 'images'     // Image optimization analysis
  | 'cta'        // Call-to-action analysis
  | 'whitespace' // Whitespace and clutter analysis
  | 'social';    // Social proof analysis

/**
 * Legacy component names that are supported for backwards compatibility
 * These will be mapped to their canonical equivalents
 */
export type LegacyComponentName =
  | 'pageSpeed'   // Legacy alias for 'speed'
  | 'font'        // Legacy singular form of 'fonts'
  | 'image'       // Legacy singular form of 'images'
  | 'spacing'     // Legacy alias for 'whitespace'
  | 'socialProof'; // Legacy alias for 'social'

/**
 * Special component names
 */
export type SpecialComponentName = 'all'; // Run all components

/**
 * All valid component names (canonical + legacy + special)
 */
export type ValidComponentName = 
  | CanonicalComponentName 
  | LegacyComponentName 
  | SpecialComponentName;

/**
 * Component names that can be requested via API
 * Includes canonical names, legacy names, and 'all'
 */
export type RequestableComponentName = ValidComponentName;

/**
 * Mapping from legacy names to canonical names
 */
export const COMPONENT_NAME_MAPPING: Record<LegacyComponentName, CanonicalComponentName> = {
  pageSpeed: 'speed',
  font: 'fonts',
  image: 'images',
  spacing: 'whitespace',
  socialProof: 'social'
} as const;

/**
 * Array of all canonical component names
 */
export const CANONICAL_COMPONENT_NAMES: readonly CanonicalComponentName[] = [
  'speed',
  'fonts', 
  'images',
  'cta',
  'whitespace',
  'social'
] as const;

/**
 * Array of all legacy component names
 */
export const LEGACY_COMPONENT_NAMES: readonly LegacyComponentName[] = [
  'pageSpeed',
  'font',
  'image', 
  'spacing',
  'socialProof'
] as const;

/**
 * Array of all valid component names
 */
export const ALL_VALID_COMPONENT_NAMES: readonly ValidComponentName[] = [
  ...CANONICAL_COMPONENT_NAMES,
  ...LEGACY_COMPONENT_NAMES,
  'all'
] as const;

/**
 * Type guard to check if a string is a canonical component name
 */
export function isCanonicalComponentName(name: string): name is CanonicalComponentName {
  return CANONICAL_COMPONENT_NAMES.includes(name as CanonicalComponentName);
}

/**
 * Type guard to check if a string is a legacy component name
 */
export function isLegacyComponentName(name: string): name is LegacyComponentName {
  return LEGACY_COMPONENT_NAMES.includes(name as LegacyComponentName);
}

/**
 * Type guard to check if a string is a valid component name
 */
export function isValidComponentName(name: string): name is ValidComponentName {
  return ALL_VALID_COMPONENT_NAMES.includes(name as ValidComponentName);
} 