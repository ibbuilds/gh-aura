# GH Aura 1.1.0

A small, user-directed GitHub profile CLI. The core workflow is free: no subscription, paid API, hosted server, runtime dependencies or mandatory AI provider.

## Install

Requires Node.js 22+. Download `gh-aura-1.1.0.tgz` and install it:

```bash
npm install --global ./gh-aura-1.1.0.tgz
gh-aura init YOUR_USERNAME
gh-aura audit
gh-aura profile --output draft.md
gh-aura preview --file draft.md --save review.json
```

After reviewing the diff, publish with `gh-aura apply --review review.json`. Add `--pr` to open an unmerged PR instead. A token restricted to the profile repository is required for publication; it is authentication, not a paid plan.

## Changes

- Five-minute local caching and ETag revalidation reduce public API calls. Use `--fresh` to reload. Preview/apply always use live state.
- Commands skip unused profile README requests. Expensive timeline details are opt-in and bounded.
- `profile --keep` preserves existing text outside one managed region.
- `apply --pr` creates a reviewed branch and PR, never merges or overwrites conflicting branches.
- Achievement sources include review dates, prerequisites and manual verification steps; paid opportunities remain disabled by default.
- CI uses standard runners only in public repositories, without Actions artifact/cache uploads.

The original planning issues have implementation/disposition records in `docs/PRODUCT_PLAN.md`. Tests cover Node 22/24 on Linux, macOS and Windows, installed packages, isolated publication and live read-only GitHub integration. No personal profile is changed by tests.

GitHub still controls achievements and limits. Pins and account settings are manual. Annual history requires authenticated reads. No npm registry publication is configured. `SHA256SUMS.txt` contains the package checksum.
