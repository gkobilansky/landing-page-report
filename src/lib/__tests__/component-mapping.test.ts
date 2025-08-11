import { 
  mapComponentNames, 
  validateComponentName, 
  isValidComponent,
  getCanonicalComponentNames,
  ComponentMappingError 
} from '../component-mapping';

describe('Component Name Mapping', () => {
  describe('mapComponentNames', () => {
    it('should map canonical names correctly', () => {
      expect(mapComponentNames('speed')).toBe('speed');
      expect(mapComponentNames('fonts')).toBe('fonts');
      expect(mapComponentNames('images')).toBe('images');
      expect(mapComponentNames('cta')).toBe('cta');
      expect(mapComponentNames('whitespace')).toBe('whitespace');
      expect(mapComponentNames('social')).toBe('social');
    });

    it('should map legacy synonyms to canonical names', () => {
      // Legacy speed synonyms
      expect(mapComponentNames('pageSpeed')).toBe('speed');
      
      // Legacy singular forms to plural
      expect(mapComponentNames('font')).toBe('fonts');
      expect(mapComponentNames('image')).toBe('images');
      
      // Legacy whitespace synonyms
      expect(mapComponentNames('spacing')).toBe('whitespace');
      
      // Legacy social proof synonyms
      expect(mapComponentNames('socialProof')).toBe('social');
    });

    it('should handle special case "all" component', () => {
      expect(mapComponentNames('all')).toBe('all');
    });

    it('should be case insensitive', () => {
      expect(mapComponentNames('SPEED')).toBe('speed');
      expect(mapComponentNames('Speed')).toBe('speed');
      expect(mapComponentNames('FONTS')).toBe('fonts');
      expect(mapComponentNames('CTA')).toBe('cta');
      expect(mapComponentNames('WhiteSpace')).toBe('whitespace');
      expect(mapComponentNames('SOCIAL')).toBe('social');
    });

    it('should handle whitespace in input', () => {
      expect(mapComponentNames(' speed ')).toBe('speed');
      expect(mapComponentNames('\tfonts\n')).toBe('fonts');
      expect(mapComponentNames(' CTA ')).toBe('cta');
    });

    it('should throw ComponentMappingError for unknown components', () => {
      expect(() => mapComponentNames('unknown')).toThrow(ComponentMappingError);
      expect(() => mapComponentNames('invalid')).toThrow(ComponentMappingError);
      expect(() => mapComponentNames('xyz')).toThrow(ComponentMappingError);
    });

    it('should throw ComponentMappingError for empty or null input', () => {
      expect(() => mapComponentNames('')).toThrow(ComponentMappingError);
      expect(() => mapComponentNames('   ')).toThrow(ComponentMappingError);
      expect(() => mapComponentNames(null as any)).toThrow(ComponentMappingError);
      expect(() => mapComponentNames(undefined as any)).toThrow(ComponentMappingError);
    });

    it('should include helpful error message with valid options', () => {
      try {
        mapComponentNames('badcomponent');
        fail('Expected ComponentMappingError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ComponentMappingError);
        if (error instanceof ComponentMappingError) {
          expect(error.message).toContain('badcomponent');
          expect(error.message).toContain('speed');
          expect(error.message).toContain('fonts');
          expect(error.message).toContain('images');
          expect(error.message).toContain('cta');
          expect(error.message).toContain('whitespace');
          expect(error.message).toContain('social');
        }
      }
    });
  });

  describe('validateComponentName', () => {
    it('should return true for valid canonical names', () => {
      expect(validateComponentName('speed')).toBe(true);
      expect(validateComponentName('fonts')).toBe(true);
      expect(validateComponentName('images')).toBe(true);
      expect(validateComponentName('cta')).toBe(true);
      expect(validateComponentName('whitespace')).toBe(true);
      expect(validateComponentName('social')).toBe(true);
      expect(validateComponentName('all')).toBe(true);
    });

    it('should return true for valid legacy synonyms', () => {
      expect(validateComponentName('pageSpeed')).toBe(true);
      expect(validateComponentName('font')).toBe(true);
      expect(validateComponentName('image')).toBe(true);
      expect(validateComponentName('spacing')).toBe(true);
      expect(validateComponentName('socialProof')).toBe(true);
    });

    it('should return false for invalid component names', () => {
      expect(validateComponentName('unknown')).toBe(false);
      expect(validateComponentName('invalid')).toBe(false);
      expect(validateComponentName('')).toBe(false);
      expect(validateComponentName(null as any)).toBe(false);
      expect(validateComponentName(undefined as any)).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(validateComponentName('SPEED')).toBe(true);
      expect(validateComponentName('Speed')).toBe(true);
      expect(validateComponentName('UNKNOWN')).toBe(false);
    });
  });

  describe('isValidComponent', () => {
    it('should be alias for validateComponentName', () => {
      expect(isValidComponent('speed')).toBe(validateComponentName('speed'));
      expect(isValidComponent('unknown')).toBe(validateComponentName('unknown'));
      expect(isValidComponent('fonts')).toBe(validateComponentName('fonts'));
    });
  });

  describe('getCanonicalComponentNames', () => {
    it('should return array of canonical component names', () => {
      const canonical = getCanonicalComponentNames();
      expect(canonical).toEqual(['speed', 'fonts', 'images', 'cta', 'whitespace', 'social']);
      expect(canonical).toHaveLength(6);
    });

    it('should not include "all" in canonical names', () => {
      const canonical = getCanonicalComponentNames();
      expect(canonical).not.toContain('all');
    });

    it('should return a new array each time (immutable)', () => {
      const canonical1 = getCanonicalComponentNames();
      const canonical2 = getCanonicalComponentNames();
      expect(canonical1).not.toBe(canonical2); // Different array instances
      expect(canonical1).toEqual(canonical2); // But same content
    });
  });

  describe('ComponentMappingError', () => {
    it('should be a custom error class', () => {
      const error = new ComponentMappingError('test message');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ComponentMappingError);
      expect(error.name).toBe('ComponentMappingError');
      expect(error.message).toBe('test message');
    });

    it('should have proper stack trace', () => {
      const error = new ComponentMappingError('test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ComponentMappingError');
    });
  });

  describe('Integration with existing component filtering', () => {
    it('should support the shouldRun pattern used in analyze route', () => {
      // Test that mapped names work with the shouldRun logic pattern
      const testShouldRun = (componentName: string, requestedComponent?: string) => {
        if (!requestedComponent) return true;
        if (requestedComponent === 'all') return true;
        
        const canonicalRequested = mapComponentNames(requestedComponent);
        const canonicalComponent = mapComponentNames(componentName);
        return canonicalRequested === canonicalComponent;
      };

      // Test canonical to canonical
      expect(testShouldRun('speed', 'speed')).toBe(true);
      expect(testShouldRun('fonts', 'fonts')).toBe(true);
      expect(testShouldRun('speed', 'fonts')).toBe(false);

      // Test legacy synonyms work
      expect(testShouldRun('speed', 'pageSpeed')).toBe(true);
      expect(testShouldRun('fonts', 'font')).toBe(true);
      expect(testShouldRun('images', 'image')).toBe(true);
      expect(testShouldRun('whitespace', 'spacing')).toBe(true);
      expect(testShouldRun('social', 'socialProof')).toBe(true);

      // Test "all" works
      expect(testShouldRun('speed', 'all')).toBe(true);
      expect(testShouldRun('fonts', 'all')).toBe(true);

      // Test undefined component (run all)
      expect(testShouldRun('speed')).toBe(true);
      expect(testShouldRun('fonts')).toBe(true);
    });

    it('should handle mixed case in shouldRun pattern', () => {
      const testShouldRun = (componentName: string, requestedComponent?: string) => {
        if (!requestedComponent) return true;
        if (requestedComponent.toLowerCase() === 'all') return true;
        
        const canonicalRequested = mapComponentNames(requestedComponent);
        const canonicalComponent = mapComponentNames(componentName);
        return canonicalRequested === canonicalComponent;
      };

      expect(testShouldRun('speed', 'SPEED')).toBe(true);
      expect(testShouldRun('fonts', 'Font')).toBe(true);
      expect(testShouldRun('whitespace', 'SPACING')).toBe(true);
      expect(testShouldRun('speed', 'ALL')).toBe(true);
    });
  });

  describe('Backwards compatibility', () => {
    it('should maintain compatibility with existing API calls', () => {
      // These are the exact component names currently used in the API tests
      expect(() => mapComponentNames('speed')).not.toThrow();
      expect(() => mapComponentNames('pageSpeed')).not.toThrow();
      expect(() => mapComponentNames('font')).not.toThrow();
      expect(() => mapComponentNames('image')).not.toThrow();
      expect(() => mapComponentNames('cta')).not.toThrow();
      expect(() => mapComponentNames('whitespace')).not.toThrow();
      expect(() => mapComponentNames('spacing')).not.toThrow();
      expect(() => mapComponentNames('social')).not.toThrow();
      expect(() => mapComponentNames('socialProof')).not.toThrow();
      
      // Verify they map to the expected canonical names
      expect(mapComponentNames('speed')).toBe('speed');
      expect(mapComponentNames('pageSpeed')).toBe('speed');
      expect(mapComponentNames('font')).toBe('fonts');
      expect(mapComponentNames('image')).toBe('images');
      expect(mapComponentNames('cta')).toBe('cta');
      expect(mapComponentNames('whitespace')).toBe('whitespace');
      expect(mapComponentNames('spacing')).toBe('whitespace');
      expect(mapComponentNames('social')).toBe('social');
      expect(mapComponentNames('socialProof')).toBe('social');
    });
  });
});

describe('Type Safety', () => {
  it('should work with TypeScript string literal types', () => {
    // These tests ensure our functions work with strict typing
    type ValidComponent = 'speed' | 'fonts' | 'images' | 'cta' | 'whitespace' | 'social' | 'all';
    type LegacyComponent = 'pageSpeed' | 'font' | 'image' | 'spacing' | 'socialProof';
    
    const testCanonical = (comp: ValidComponent) => mapComponentNames(comp);
    const testLegacy = (comp: LegacyComponent) => mapComponentNames(comp);
    
    expect(testCanonical('speed')).toBe('speed');
    expect(testCanonical('fonts')).toBe('fonts');
    expect(testLegacy('pageSpeed')).toBe('speed');
    expect(testLegacy('font')).toBe('fonts');
  });
}); 