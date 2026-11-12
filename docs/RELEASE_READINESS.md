# GH Aura — release readiness and external validation

**Status: v1.9.0, 2026-11-12.** This is an operator checklist, not a declaration of completed production validation. GitHub CI checks syntax, unit tests, package tests, six platform combinations and live **read-only** integration; it does not create or delete private GitHub repositories.

## 1. Repository governance — account administrator required

On [repository rulesets](https://github.com/ibbuilds/gh-aura/settings/rules), create an active branch ruleset for `main`:

- Require pull requests before merging (at least one independent approval for production changes) and up-to-date required status checks.
- Require `Public GitHub integration (read-only)` and the six matrix Node 22/24 × Linux/macOS/Windows checks, choosing the exact check names GitHub offers.
- Block force pushes and protected-branch deletion; apply rules to administrators where supported and disallow bypass by default.
- Verify protection in Settings after saving; `main` was unprotected at review time. The current GitHub connection cannot administer branch rulesets.

The one-time cleanup in CI is limited to this repository, a deliberately prefixed main-branch commit, named expected branch SHAs and exclusion of active PR branches. Verify that targeted refs actually disappear; no routine automatic cleanup is scheduled.

## 2. Real private GitHub writes — not yet observed

Use **a dedicated disposable GitHub test account with its own restricted token**, never a production repository. Do not run mutation tests in ordinary CI. Record the date, installed CLI version/commit, permissions (not token contents), sanitized test repository links and outcomes.

1. Verify `gh-aura activity plan` makes no network requests. Produce a small plan dated within the disposable account's lifetime, with `--density 1`, and inspect its fingerprint before applying.
2. Apply to one **new** private workspace with the account's ID-based noreply email. Confirm the planned commits, the `GH-AURA-PRIVATE-WORKSPACE-V1` README marker and one push. **Do not infer graph attribution from successful pushes.**
3. Verify wrong fingerprints, unrelated owners, unverified author emails, unavailable email permissions and existing repositories refuse writes. If a push errors after creation, manually inspect its state before any retry; never force-push.
4. In that **same private workspace**, plan `gh-aura badges auto --pulls 1 --output badges.json`, apply the reviewed fingerprint and inspect the single generated PR merge and optional issue close.
5. Apply a second non-overlapping `activity` date plan to the **same** workspace. Verify fast-forward ancestry, retained badge files and one additional push; reject repeated paths and changed remote revisions. Reapply the badge plan: completed exercises should not be duplicated. Confirm public and unmarked repositories refuse modification.
6. **Only after reviewing all results**, remove disposable repositories manually using the test account. Do not publish sensitive account data or private URLs.

Current tests in `tests/calendar.test.mjs` and `tests/badge-run.test.mjs` use a local Git bare repository and simulated GitHub API endpoints. Until real tests are performed with explicit account authorization, remote write results remain **unverified**.

## 3. Optional cleanup — not automated

No automatic repository deletion is implemented. The shared workspace may contain historical synthetic practice and PR/issue exercises; GitHub has not guaranteed that graph counts or achievement evidence survive deletion. A future badge-only cleanup flow must identify a disposable repo with **no activity files**, require an independent user check of achievement visibility, and require separate exact-name confirmation with administrative permission. Do not grant the normal CLI token delete permissions by default.

## 4. First-use validation — independent human participants required

Follow the existing [human validation protocol](HUMAN_VALIDATION.md) with at least five consenting external developers across different experience levels. Ask each to install from a GitHub release and complete four independent read-only tasks: inspect authentic activity, explore badges' eligibility caveats, draft a README, and rank public pins.

Record task completion, time, errors, and confusion between authentic portfolio evidence and synthetic sandbox exercises. Do not collect tokens, private repositories, names or personal profile writes. Publish only anonymized aggregate observations with sample size and date. No study has been run as part of this patch.

## 5. Distribution — no npm registry publication

The supported distribution remains the [GitHub release tarball](https://github.com/ibbuilds/gh-aura/releases/latest), checked against SHA256SUMS. npm publication requires explicit package-name ownership and maintainer registry authorization, MFA/trusted publishing, a final package audit, and a publication/rollback policy. It is **not performed** by this repository change and is not required for a GitHub release.

## Open external gates

- A repository administrator must enable and verify branch protection.
- The private remote-write workflows need a controlled real GitHub account validation.
- The independent human usability study has not been performed.
- npm registry publication is intentionally not configured.
