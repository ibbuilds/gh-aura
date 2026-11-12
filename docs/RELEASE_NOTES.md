# GH Aura 1.7.0

**Simple, explicit GitHub profile CLI with a 200-account ordinary-visibility engineering reference.** Node.js 22+, no paid API, runtime dependency, hosted dashboard, compulsory AI or background process.

## Install

Download the attached `gh-aura-1.7.0.tgz` and `SHA256SUMS.txt` from this GitHub Release. Verify the checksum, then run:

```bash
npm install --global ./gh-aura-1.7.0.tgz
gh-aura init YOUR_USERNAME
```

The tarball is published through GitHub Releases, not the public npm registry.

## What's new

- **200 public ordinary-visibility professional profile references.** A dated, manually executed research run examined 1,040 accounts and selected 200 from 35 company organizations. Selection required publicly visible company-organization membership plus matching self-described employer and engineering role, with a 2,000-follower cap to reduce celebrity-heavy sampling. These signals do **not** certify current employment, competence or hiring outcomes.
- **Bounded, sourced research.** The study used 145 GitHub HTTP requests, kept public links and profile-structure observations rather than copied biographies, and lives outside the installable package. Runtime generation makes **zero research-profile API calls**.
- **Four simple optional command aliases.** `activity`, `badges`, `readme`, and `pins` preserve every existing advanced command. Their simplified usage is documented and tested.
- **Updated editorial context.** `brief` uses aggregate presentation patterns from the 200-person sample and a separate 16-person employer-owned author source, without copying profiles or automatically declaring jobs, skills, achievements or historical experience.

## Simple workflow

```bash
gh-aura init YOUR_USERNAME
gh-aura activity 2022
gh-aura activity 2020..2024
gh-aura badges free
gh-aura readme minimal --output draft.md
gh-aura pins --goal "backend engineer"

# Publish a profile change only when the complete diff is approved:
gh-aura preview --file draft.md --save review.json
gh-aura apply --review review.json --pr
```

These are shortcuts for existing `contributions`, `achievements`, `profile` and `showcase`. They do not add extra API requests, create automatic contributions or award badges. GitHub controls its contribution calendar, achievements and pinned repository UI.

## Verified behavior

The release is gated on syntax checks, offline tests, package installation, and live read-only GitHub integration across Node.js 22/24 and Linux/macOS/Windows. No person's GitHub profile or contribution history is modified during tests.

The research sample is **not** an interview experiment. It is a transparent presentation study, and source membership/company fields can be outdated. The owner selected this approach in preference to a human hiring-manager study; GH Aura does not claim recruitment outcome improvements.

[Primary study method](https://github.com/ibbuilds/gh-aura/blob/main/research/ORDINARY_STUDY.md) · [Security](https://github.com/ibbuilds/gh-aura/blob/main/SECURITY.md) · [CLI reference](https://github.com/ibbuilds/gh-aura/blob/main/docs/CLI.md)
