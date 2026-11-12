# Project evidence inspection

The optional deep inspection is designed to help a hiring manager verify useful repo signals without treating stars, green squares or source language as proof of engineering ability.

## Commands

```bash
# Suggested shortlist and first-minute review, with source-file evidence
gh-aura audit --inspect 3 --deep 2

# Rank projects by evidence relevant to a role
gh-aura showcase --goal "backend engineer" --inspect 3 --deep 2

# Export the observed source paths to your external writer
gh-aura brief --deep 2 --output brief.json
```

`--inspect N` reads selected project README files, and `--deep N` (0–5) fetches the Git tree for the selected public repositories. User-selected featured repositories are inspected before auto-ranked suggestions. Each request is subject to the same API request, response byte and cache budgets. Nothing executes untrusted code or downloads source-file content.

## Signals and their limits

| Detected feature | What it tells us | What it cannot tell us |
| --- | --- | --- |
| Test/spec filenames | Possible automated test suite exists | Whether tests run, pass, cover meaningful behavior |
| CI workflow filenames | Automation config exists | Whether workflows succeed or branch protection is enforced |
| Package/build manifests | Possible dependency/build environment | Whether install/build succeeds or software is secure |
| Architecture/ADR paths | Technical documentation may be available | Whether reasoning, design, or implementation is sound |
| Example/demo source files | There are possible runnable examples | Whether examples work or solve the stated user problem |
| License path | A license file is present | Whether it grants specific rights without reading it |

All matches include public GitHub source URLs. Files absent from a **truncated** Git tree are **unknown**, not reported missing. A repository that became private cannot be newly inspected through a previously public listing; authenticated reads recheck visibility.

## Scoring

Repository ranking now uses observed tests/CI/manifests as modest **presentation-evidence** signals instead of relying almost completely on repository size or primary language. Popularity remains a low-weight supplemental input.

**Important:** Scores are relative suggestions for what to showcase, NOT a technical-quality grade or likelihood of being hired. A small new project can be more relevant than a popular fork; actual ownership remains an explicit user claim requiring review.

## API budget

Default deep scan is **0**; one optional Git tree request per selected repository plus visibility checks when using an authenticated token. Trees can be large: streamed JSON above the configured 2 MiB per-response limit stops rather than returning partial misleading data. Set `--budget N` to control requests and `--stats` to observe actual consumption.

## Next

The user can provide confirmed personal contribution notes and a job description to explain why each project matters. We will not attempt to infer actual authorship or validate code correctness from filenames alone.
