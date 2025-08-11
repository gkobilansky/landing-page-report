# Findings

Key deficiencies and opportunities to improve consistency, informativeness, and rigor.

## Consistency
- ✅ **COMPLETED**: Component filter mismatch resolved: API now accepts canonical names (`speed|fonts|images|cta|whitespace|social`) with legacy synonym mapping.
- **DEPRIORITIZED**: Overall score includes default-zero modules for component-only runs; dilutes results. (Not used in production currently)
- ✅ **COMPLETED**: Letter grades removed from module outputs and API responses; numeric scores now used consistently.
- ✅ **COMPLETED**: Component name validation implemented with helpful error messages for unknown components.
- ✅ **COMPLETED**: Module output contracts standardized: all modules now return `loadTime` field consistently; images module returns `applicable=false` and `score=null` when no images found.
- **NEXT PRIORITY**: Error handling varies; some modules swallow errors, others may bubble and fail the route.

## Rigor
- Page speed metrics approximations (CLS/TBT, LCP) are rough; no Lighthouse/PSI fallback in route.
- Whitespace pixel threshold fixed (240) rather than calibrated; dark themes can be penalized.
- CTA/social proof classification can produce false positives; above-the-fold checks are single-viewport only.
- Images: “no images” returns 100 rather than “N/A”; conflates absence with perfection.

## Performance and reliability
- Each module launches its own browser; route executes modules serially.
- Single desktop viewport; no mobile view where above-the-fold is critical.
- Caching is URL-based only; partial/component runs not clearly marked in storage.

## Database and reporting
- Per-module version/config/confidence not stored; hard to audit or compare across runs.
- Issues are unstructured strings; no codes/severity/evidence references for analytics.

## Documentation drift
- Component names differ between docs and implementation.
- No doc that clearly separates current behavior from roadmap and tasks. 