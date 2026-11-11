# Public-profile structural study

Observed on **2026-11-11 at 12:31:41 UTC**. The machine-readable observations are in [profiles.json](profiles.json); the collector is [research-profiles.mjs](../scripts/research-profiles.mjs).

## Selection

Twelve mature repositories were chosen explicitly: CPython, Rust, Go, Kubernetes, Node.js, VS Code, Vue, Svelte, Flask, scikit-learn, PyTorch and Rails. Fetch the first 20 public contributors from each, remove API-classified bots and a documented list of known legacy service accounts, deduplicate, then select round-robin until reaching 100 accounts. Contributor rank in the dataset is rank within each filtered eligible list, not an absolute GitHub leaderboard position.

This yields inspectable contribution evidence across several ecosystems. It does **not** verify identity, employment, seniority, hiring outcomes or that every remaining account represents one person. The sampling is purposive and favors established open-source activity. It is not representative of job seekers, all engineers, private-company work or all geographic/language groups.

## Collection and privacy

The completed collection used 12 REST requests for candidate lists and 20 GraphQL requests containing five profiles each: **32 read requests**. Earlier collector-debugging runs were separate; 32 is not the total development-session request count. The optional collector has a hard 40-request budget and stops on API errors.

For each public account, record the source URL, selection project, presence of bio/website, up to six public pinned repositories and structural features of `HEAD:README.md` in `USER/USER` when accessible. Do not store names, bios, contact addresses, README prose, photos or private repository data. Observed README blobs have source hashes for provenance.

Only the exact root `README.md` path is examined. Absence at that path does not prove that a profile has no README under another supported spelling/path. Word counts are approximate whitespace-based counts after removing selected markup, not multilingual linguistic analysis. Image/link/stat-card detectors are heuristics.

## Results

| Observation | Count / denominator |
| --- | --- |
| Bio present | 58 / 100 |
| Website present | 56 / 100 |
| At least one public repository pin | 72 / 100 |
| Median number of pins, including zero-pin accounts | 4 |
| Root profile README observed | 17 / 100 |
| Observed READMEs with links | 13 / 17 |
| Observed READMEs without images | 11 / 17 |
| Observed READMEs with detected external stat cards | 4 / 17 |
| Approximate README words: 25th / 50th / 75th percentile | 18 / 50 / 147, among 17 READMEs |

The committed aggregate is checked against the source dataset and its Git blob hash in automated tests. The runtime ships the small aggregate, not this dataset, and does not recollect profiles on user commands.

## Interpretation and product decisions

Visible projects and concise copy are reasonable presentation options; elaborate graphics are not a universal characteristic of this cohort. No correlation with interview outcomes was measured, much less causation. Recognized contributors can rely on a reputation that a new applicant does not possess. A job seeker may therefore need *more* explanation of their actual work, not an imitation of a well-known maintainer's terse profile.

GH Aura keeps a restrained default, preserves selectable richer styles, prioritizes inspectable project evidence and asks the user to confirm their own contributions. Its default editorial word target and visual thresholds are explicit product decisions, not statistically validated hiring rules. It never copies cohort biographies, recommends contribution-calendar targets from them or labels an account's worth.

GitHub's own [resume/profile tutorial](https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume) independently emphasizes concise presentation, relevant showcased projects and documentation that visitors can understand. This is complementary guidance, not validation of the cohort.

## Reproduce deliberately

```bash
# Optional research only; requires an authenticated read token.
node scripts/research-profiles.mjs
```

Inspect changed observations and update the aggregate/source hash explicitly. This is not a CI cron job, a hidden user-data collection service or a prerequisite for ordinary use.
