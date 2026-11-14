# Security

GH Aura is local-first. MCP reads by default. Only an owner-configured `GH_AURA_APPROVED_PLAN` **and** `GH_AURA_APPROVED_FINGERPRINT` expose execution of that exact plan. Tools cannot choose a local plan path, mint approval, run arbitrary shell commands or expand its scope. The owner controls the host environment and local files; a compromised host is outside this boundary.

## AI and user sources

- Curated entries contain URLs and license/maintenance caveats. **No remote asset is fetched, embedded or executed automatically**.
- Optional custom sources are loaded only from a user-configured local `GH_AURA_SOURCES_FILE` or explicit CLI `--catalog` file, limited to a bounded regular JSON file. MCP tools cannot select arbitrary file paths.
- User sources are labeled unverified. Third-party images/services require opt-in, rights checks and accessible text fallbacks.
- Profile facts and biography claims are labeled as public observations, user-supplied assertions or unknowns. A URL alone is not proof of employment or authorship.
- Never send `GH_TOKEN`, `GITHUB_TOKEN` or collaborator tokens to an AI model. A connected AI client may separately process returned profile data under its own privacy terms.

## Human-controlled publication

The owner **independently** reviews `improve preview`, then runs `improve apply --review PLAN --confirm FINGERPRINT` or configures the exact host grant. Remove the grant to revoke it. README/assets publish atomically; account changes are separate verified steps. Profile PRs remain unmerged. Unexpected revisions stop execution; local journals are advisory, never permission to adopt an unrelated repository. Legacy preview/apply remains supported.

Other explicit writes: `work apply` proposes one unmerged documentation PR; `activity apply` and `badges auto apply` reuse one **owned, marked private workspace** with separately reviewed plans. No unrelated repository takeover, force push, unapproved deletion or automatic achievement guarantees.

Reviewed collaboration exercises require two distinct authenticated identities, second-account write access, consent and verified coauthor attribution. Tokens and author emails stay local. Real account creation/access setup is an owner/provider action. Synthetic exercises are labeled and never presented as professional experience.

MCP runs on local stdio with bounded JSON-RPC messages. GitHub rate limits apply; uncertain writes are never retried automatically. Report vulnerabilities privately, without sharing credentials.

Opt-in resource checks use anonymous HTTPS, public DNS/IP pinning, bounded redirects/time/requests and no response-body retention.
