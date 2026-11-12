# GH Aura v1.15.0

**Documentation and release maintenance.**

- Consolidated project documentation into short, task-oriented guides.
- Audited all four primary modules against tests and identified outstanding real-account validation.
- Kept **only the latest published GitHub Release** visible with downloadable assets. Historical Git tags and commits remain intact.
- Removed obsolete one-time CI branch-cleanup code. Runtime behavior and permission boundaries are unchanged.

**Requirements:** Node.js 22+; optional GitHub token; local Git for the opt-in `git-batch` strategy.

Install the tarball from [the latest release](https://github.com/ibbuilds/gh-aura/releases/latest); verify `SHA256SUMS.txt` before installing.

[Commands](CLI.md) · [Feature status](PRODUCT_PLAN.md) · [Security](../SECURITY.md)
