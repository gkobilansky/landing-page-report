import {
  CanonicalComponentName,
  LegacyComponentName,
  ValidComponentName,
  COMPONENT_NAME_MAPPING,
  CANONICAL_COMPONENT_NAMES,
  isValidComponentName as isValidComponentNameTypeGuard
} from '@/types/components';

/**
 * Custom error class for component mapping errors
 */
export class ComponentMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComponentMappingError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ComponentMappingError.prototype);
  }
}

/**
 * Maps any valid component name to its canonical form
 * 
 * @param componentName - The component name to map (case-insensitive)
 * @returns The canonical component name
 * @throws ComponentMappingError if the component name is invalid
 * 
 * @example
 * mapComponentNames('speed') => 'speed'
 * mapComponentNames('pageSpeed') => 'speed'
 * mapComponentNames('font') => 'fonts'
 * mapComponentNames('IMAGES') => 'images'
 */
export function mapComponentNames(componentName: string): CanonicalComponentName | 'all' {
  // Handle null/undefined input
  if (!componentName) {
    throw new ComponentMappingError(
      `Component name is required. Valid options: ${CANONICAL_COMPONENT_NAMES.join(', ')}, all`
    );
  }

  // Normalize input: trim whitespace and convert to lowercase
  const normalizedName = componentName.trim().toLowerCase();
  
  // Handle empty string after trimming
  if (!normalizedName) {
    throw new ComponentMappingError(
      `Component name cannot be empty. Valid options: ${CANONICAL_COMPONENT_NAMES.join(', ')}, all`
    );
  }

  // Handle special case 'all'
  if (normalizedName === 'all') {
    return 'all';
  }

  // Check if it's already a canonical name
  if (CANONICAL_COMPONENT_NAMES.includes(normalizedName as CanonicalComponentName)) {
    return normalizedName as CanonicalComponentName;
  }

  // Check if it's a legacy name that needs mapping
  const legacyMappingKey = Object.keys(COMPONENT_NAME_MAPPING).find(
    key => key.toLowerCase() === normalizedName
  ) as LegacyComponentName | undefined;

  if (legacyMappingKey) {
    return COMPONENT_NAME_MAPPING[legacyMappingKey];
  }

  // Invalid component name
  throw new ComponentMappingError(
    `Unknown component: '${componentName}'. Valid options: ${CANONICAL_COMPONENT_NAMES.join(', ')}, all, or legacy aliases: ${Object.keys(COMPONENT_NAME_MAPPING).join(', ')}`
  );
}

/**
 * Validates if a component name is valid (canonical, legacy, or 'all')
 * 
 * @param componentName - The component name to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * validateComponentName('speed') => true
 * validateComponentName('pageSpeed') => true  
 * validateComponentName('invalid') => false
 */
export function validateComponentName(componentName: string): boolean {
  try {
    mapComponentNames(componentName);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Alias for validateComponentName for backwards compatibility
 */
export const isValidComponent = validateComponentName;

/**
 * Returns an array of all canonical component names
 * 
 * @returns A new array containing all canonical component names
 * 
 * @example
 * getCanonicalComponentNames() => ['speed', 'fonts', 'images', 'cta', 'whitespace', 'social']
 */
export function getCanonicalComponentNames(): CanonicalComponentName[] {
  return [...CANONICAL_COMPONENT_NAMES];
}

/**
 * Type-safe function to check if a component should run based on the request
 * This replaces the inline shouldRun logic in the API route
 * 
 * @param componentName - The component to check (should be canonical)
 * @param requestedComponent - The component requested by the user (can be any valid name)
 * @returns true if the component should run, false otherwise
 * 
 * @example
 * shouldRunComponent('speed', 'pageSpeed') => true
 * shouldRunComponent('fonts', 'font') => true
 * shouldRunComponent('speed', 'fonts') => false
 * shouldRunComponent('speed', 'all') => true
 * shouldRunComponent('speed', undefined) => true
 */
export function shouldRunComponent(
  componentName: CanonicalComponentName, 
  requestedComponent?: string
): boolean {
  // If no component specified, run all
  if (!requestedComponent) {
    return true;
  }

  try {
    const canonicalRequested = mapComponentNames(requestedComponent);
    
    // Special case for 'all'
    if (canonicalRequested === 'all') {
      return true;
    }
    
    // Check if the canonical forms match
    return componentName === canonicalRequested;
  } catch (error) {
    // If the requested component is invalid, don't run anything
    return false;
  }
}

/**
 * Gets a human-readable list of all valid component names for error messages
 * 
 * @returns A formatted string listing all valid component options
 */
export function getValidComponentNamesHelp(): string {
  const canonical = CANONICAL_COMPONENT_NAMES.join(', ');
  const legacy = Object.keys(COMPONENT_NAME_MAPPING).join(', ');
  return `Canonical: ${canonical}. Legacy aliases: ${legacy}. Special: all`;
} 