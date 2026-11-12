# Release and external validation

**v1.16.0** — CI validates syntax, unit tests, packaged CLI and six Node/OS combinations. Live GitHub integration is **read-only**. No private remote write has been independently verified.

## External requirements

1. **GitHub admin:** protect `main`, require PRs and passing CI checks; [issue #47](https://github.com/ibbuilds/gh-aura/issues/47).
2. **Disposable GitHub account:** create one private GH Aura workspace; apply a tiny `activity` plan and a two-PR `badges auto --tier base` plan. Verify marker, ownership, privacy, retained files, idempotency and branch history; [#48](https://github.com/ibbuilds/gh-aura/issues/48).
3. **Second account:** if using `badges auto accounts`, confirm two distinct consenting accounts can read the exact same private marked repo, no token appears in logs, and no changes were made. This is only an authorization preflight.
4. **Actual outcomes:** verify profile contribution counts and Pull Shark, YOLO and Quickdraw on GitHub after propagation. If missing, **stop** before advancing to 1,024 PRs; [#53](https://github.com/ibbuilds/gh-aura/issues/53).
5. **Users:** independent, consent-based first-use study; [#49](https://github.com/ibbuilds/gh-aura/issues/49).
6. **Optional:** workspace cleanup must not delete shared activity; registry distribution and extra integrations are not release prerequisites.

## Current release rules

CI creates a tagged tarball and `SHA256SUMS.txt` only on a green `main` run with a new version. After verifying the new release assets, it deletes previous **published release objects**, preserving all historical Git tags and commits. If cleanup fails, CI fails; it never deletes tags or source history.

No automatic deletion of private workspaces, force pushes, paid APIs or synthetic badge claims.
