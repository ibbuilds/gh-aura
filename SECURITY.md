# Security

GH Aura is local-first. The MCP and Agent Skill are **read-only** for GitHub: they inspect, recommend, validate Markdown and compare drafts. They cannot run shell commands, approve, merge, publish or modify accounts.

## AI and user sources

- Curated entries contain URLs and license/maintenance caveats. **No remote asset is fetched, embedded or executed automatically**.
- Optional custom sources are loaded only from a user-configured local `GH_AURA_SOURCES_FILE` or explicit CLI `--catalog` file, limited to a bounded regular JSON file. MCP tools cannot select arbitrary file paths.
- User sources are labeled unverified. Third-party images/services require opt-in, rights checks and accessible text fallbacks.
- Profile facts and biography claims are labeled as public observations, user-supplied assertions or unknowns. A URL alone is not proof of employment or authorship.
- Never send `GH_TOKEN`, `GITHUB_TOKEN` or collaborator tokens to an AI model. A connected AI client may separately process returned profile data under its own privacy terms.

## Human-controlled publication

The owner **independently** saves and reviews Markdown, runs `gh-aura preview --file draft.md --save review.json` and confirms `gh-aura apply --review review.json --pr`. No agent tool creates approval codes or a publish review file. Publishing checks the current remote revision and stops on unexpected changes.

Other explicit writes: `work apply` proposes one unmerged documentation PR; `activity apply` and `badges auto apply` reuse one **owned, marked private workspace** with separately reviewed plans. No unrelated repository takeover, force push, unapproved deletion or automatic achievement guarantees.

MCP runs on local stdio with bounded JSON-RPC messages. GitHub rate limits apply; uncertain writes are never retried automatically. Report vulnerabilities privately, without sharing credentials.
