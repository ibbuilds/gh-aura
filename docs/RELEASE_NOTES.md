# GH Aura 1.4.0

**Focus: make a GitHub portfolio easier to assess for a specific engineering role.**

The existing \`gh-aura audit\` command now includes an evidence-based *first-minute hiring-manager review*. It does **not** assign a person's value, predict interviews or call the profile “hireable” with a fabricated percentage.

## Install

Requires Node.js 22+. Download \`gh-aura-1.4.0.tgz\` from this GitHub Release, verify its \`SHA256SUMS.txt\`, then install:

\`\`\`bash
npm install --global ./gh-aura-1.4.0.tgz
gh-aura init YOUR_USERNAME
\`\`\`

This is a GitHub Release, not an npm registry publication.

## New: role-oriented audit

\`\`\`bash
gh-aura config set editorial.targetRole "Backend Engineer"
gh-aura audit --inspect 3

# Or target a different role for one read-only command
gh-aura audit --goal "Platform Engineer" --inspect 3 --json
\`\`\`

The review examines:
- Explicit target role **as an aspiration**, never a current title claim.
- Public bio, a readable profile README, short selected projects and contact links.
- Conservative keyword alignment of public repository metadata to the target role.
- Optional README presence/setup/usage heading clues for a few projects.
- Missing and **unknown** project signals, including unverified code correctness, testing, CI and individual ownership.

Every check explains its evidence, state and next action. **No code quality, experience level or hiring result is inferred from stars, repo size, contribution density or other vanity metrics.** Unavailable private work is not penalized as inactivity.

## Editorial/research context

The separate industry-profile research remains a **presentation reference**, not a copywriting database or hiring success model. Its employer-affiliated cohort does not establish verified current employment. GH Aura continues to support \`minimal\`, \`regular\`, \`flashy\` and \`--visual 0..100\`.

## Boundaries

The audit is read-only, retains existing API request/response budgets and cache behavior and needs no paid service or AI model. Personal profile publication still requires separate preview and explicit approval. GH Aura cannot grant achievements, fabricate a contribution timeline, change GitHub profile pins through an unsupported API or guarantee employment.

Read [the hiring-readiness methodology](https://github.com/ibbuilds/gh-aura/blob/main/docs/HIRING_READINESS.md).

Release gate: cross-platform Node 22/24 tests, packed CLI smoke test, real **read-only** GitHub integration and a guarded GitHub Release with checksums.
