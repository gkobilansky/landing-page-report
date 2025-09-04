## Summary
- What change is being made and why?
- User impact or developer workflow improvements.

## Related Issues
- Closes #
- Related #

## Screenshots / Demos (UI changes)
- Before / After images or short clip.

## Local Validation Checklist
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm test` passes (add/update tests as needed)
- [ ] Verified key flows locally (dev server or API calls)

## App & Infra Checklist
- [ ] New env vars documented and added to `.env.local.example`
- [ ] Supabase changes documented; ran `supabase start` and `supabase migration up`
- [ ] Browserless key requirement considered for prod (`BLESS_KEY`); Vercel envs updated if needed
- [ ] `vercel.json` changes (if any) explained

## Analyzer-Specific Notes
- [ ] Considered 24h cache; tested with `forceRescan: true` when necessary
- [ ] API inputs/outputs remain backward compatible (or breaking changes documented)
- [ ] Updated docs: `CLAUDE.md` and/or `docs/analysis/*` (if behavior/architecture changed)

## Testing Notes
- Unit tests added/updated in `src/**/__tests__` or `*.test.ts(x)`
- Example API check (adjust as needed):
  ```bash
  curl -s -X POST http://localhost:3000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"url": "https://example.com", "component": "speed", "forceRescan": true}' | jq .summary
  ```

## Risk & Rollout
- Risks and mitigations:
- Manual test plan / affected areas:
- Rollback plan:

