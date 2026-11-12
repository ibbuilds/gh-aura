# Release and independent validation

**v1.18.0** — Tests cover Node 22/24 on Linux, Windows and macOS, offline installed CLI, local MCP, real bare Git/mocked GitHub and **read-only** public GitHub integration.

## Product gates

- [x] Source library, bilingual search and an explicitly opt-in, bounded user catalog.
- [x] Composable techniques with GitHub rendering, licensing and accessibility notes.
- [x] Original biography voice, perspective, focus, owner claims and verified-evidence caveats.
- [x] ProfileSpec refinements, portable AI briefs, MCP read-only tools and user-gated publishing.
- [ ] Test complete tasks in three actual MCP/Skill agent clients and five independent users — [#61](https://github.com/ibbuilds/gh-aura/issues/61), [#49](https://github.com/ibbuilds/gh-aura/issues/49).
- [ ] Test a rendered README for each design direction against GitHub desktop/mobile themes and verify external URLs/licenses.

## GitHub gates

- [ ] Protect `main` with required CI/PR checks — [#47](https://github.com/ibbuilds/gh-aura/issues/47).
- [ ] Validate one real, marked private Activity/Badges workspace — [#48](https://github.com/ibbuilds/gh-aura/issues/48).
- [ ] Verify actual awarded achievements — [#53](https://github.com/ibbuilds/gh-aura/issues/53).

The release job publishes a verified tarball/checksum only after green CI, then deletes older published release *objects*, preserving Git tags and commits. No npm registry publication or paid AI service.
