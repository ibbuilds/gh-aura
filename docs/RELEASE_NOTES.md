# GH Aura v1.11.0

**Progress-aware GitHub achievement planning in one reusable private workspace.**

GH Aura remains a free, local-first CLI on Node.js 22+, without a mandatory AI provider, runtime dependencies, hosted service or subscription.

## Install

Download `gh-aura-1.11.0.tgz` with `SHA256SUMS.txt` from the GitHub release, verify the checksum and install:

```bash
npm install --global ./gh-aura-1.11.0.tgz
gh-aura init YOUR_USERNAME
```

Distributed via GitHub Releases, not the public npm registry.

## Supported private workspace achievement candidates

The versioned catalog maps nineteen achievement/highlight entries. **Pull Shark, YOLO and Quickdraw** remain the three categories with controllable private, self-owned PR/issue events. Other active achievements depend on real coauthors, third-party accepted answers, independent public stars or paid sponsorship; historical and program highlights cannot be manufactured by the workspace.

```bash
# First offline plan; approve its fingerprint explicitly before writing.
gh-aura badges auto --tier base --output first.json
gh-aura badges auto apply --review first.json --confirm FINGERPRINT

# Read-only summary of observed events.
gh-aura badges auto status

# Progress toward Bronze/Silver/Gold without manually guessing --start:
gh-aura badges auto next --tier bronze --output next.json
# After reviewing that exact new plan, independently approve another apply.
gh-aura badges auto apply --review next.json --confirm FINGERPRINT
```

The **new `auto next` command is read-only with respect to GitHub**. It checks the exact owned private GH Aura workspace, complete paginated PR and issue observations, full Git tree, gap-free merged exercise sequence and absent in-progress exercise branches. A mismatch or incomplete history stops the command; no speculative batch is created. When the reported local threshold is already reached, it returns an unverified target-reached status without writing a plan.

The planned per-run maximum remains 16 PR exercises, with SHA-256 fingerprint review before every remote write. Replayed plans skip existing completed exercises, and no unrelated repository is modified.

Quickdraw status now labels closures within five minutes as *timing candidates*, not confirmed GitHub achievements. Pull Shark levels (2, 16, 128 and 1,024 observed PRs) are planning heuristics, not guarantees of GitHub's internal eligible-event counter. GitHub may delay, withhold or change award rules.

CI tests local and simulated GitHub behavior on Node 22 and 24 across Linux, Windows and macOS; live integration is strictly **read-only**. A real private account verification remains necessary before claiming any achievement was awarded.

[Full achievement matrix](https://github.com/ibbuilds/gh-aura/blob/main/docs/ACHIEVEMENTS.md) · [Badge runner](https://github.com/ibbuilds/gh-aura/blob/main/docs/BADGE_RUN.md) · [Release validation](https://github.com/ibbuilds/gh-aura/blob/main/docs/RELEASE_READINESS.md)
