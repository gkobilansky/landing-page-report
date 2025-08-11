# Analysis Consistency and Rigor Initiative

This folder organizes the documentation for improving the analysis system: current behavior, findings, implementation plan, roadmap, and handoff-ready tasks.

- See `PRD.md` and `CLAUDE.md` (root) for product and technical background.
- See `database-schema-design.md` (root) for the enhanced schema design.

## Contents
- Current State: `./current-state.md`
- Findings: `./findings.md`
- Implementation Plan: `./implementation-plan.md`
- Roadmap: `./roadmap.md`
- Tasks (handoff-ready): `./tasks.md`
- Checklists: `./checklists/grades-deprecation.md`

## Goals
- Make results across modules consistent, informative, and reproducible
- Improve rigor and reliability while reducing runtime and flakiness
- Document a clear, phased path with actionable tasks

## Quick Links
- Backend orchestrator: `src/app/api/analyze/route.ts`
- Analysis modules: `src/lib/*` (page speed, fonts, images, CTA, whitespace, social)
- Types: `src/types/` (database and planned analysis types)
- Screenshot: `src/lib/screenshot-storage.ts`
- Metadata: `src/lib/page-metadata.ts` 

## Recommended Next Task: Harden Error Handling

After completing 3 tasks in Phase 1 (letter grade removal, component name normalization, and module output standardization), the **next recommended priority** is:

### **Harden Error Handling**
- **Why this matters**: Currently some modules swallow errors while others may bubble up and fail the entire route
- **Business impact**: Ensures one failing module doesn't break the entire analysis, improving reliability and user experience
- **Scope**: 
  - Wrap individual analysis functions in try/catch blocks in the API route
  - On module error, set zero score and add error message to `issues` array
  - Ensure API doesn't fail completely when a single module encounters an error
- **Files to modify**: `src/app/api/analyze/route.ts` and potentially individual module error handling

## Recent Completed Tasks

### ✅ Module Output Standardization (Phase 1)
- **Implemented**: All modules now return consistent `loadTime` field for performance tracking
- **Enhanced**: Images module now returns `applicable=false` and `score=null` when no images found (instead of perfect score)
- **Improved**: API route now handles nullable image scores correctly in overall calculation
- **Tests**: Updated image optimization and font analysis tests to cover new fields
- **Files Modified**: 
  - All analysis modules in `src/lib/` - Added `loadTime` tracking
  - `src/lib/image-optimization.ts` - Added `applicable` field and nullable score
  - `src/app/api/analyze/route.ts` - Updated to handle new fields
  - Test files updated for new contracts

### ✅ Component Name Normalization (Phase 1)
- **Implemented**: Canonical component names (`speed|fonts|images|cta|whitespace|social`) with legacy synonym mapping
- **Added**: Component validation with helpful error messages for unknown component names  
- **Backwards Compatible**: Legacy names like `pageSpeed`, `font`, `image`, `spacing`, `socialProof` automatically map to canonical forms
- **Tests**: 22 comprehensive test cases covering mapping, validation, and integration scenarios
- **Files Modified**: 
  - `src/types/components.ts` - Type definitions and mappings
  - `src/lib/component-mapping.ts` - Core mapping and validation logic
  - `src/app/api/analyze/route.ts` - Updated to use new component system
  - Test files updated for new functionality

### ✅ Letter Grade Removal (Phase 1)
- **Removed**: All letter grade fields from module outputs and API responses
- **Cleaned**: Test expectations to remove grade assertions

### Deprioritized Tasks
- **Overall score computation for selective runs** - Moved to lower priority since component-specific runs are not currently used in production 