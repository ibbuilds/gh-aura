# Optional AI editing

GH Aura does not require an AI provider. Ordinary JSON and Markdown files are the integration boundary.

```bash
gh-aura config set profile.style minimal
gh-aura brief --output brief.json
```

Give `brief.json` to your chosen editor or assistant. It contains public profile facts, existing README text, selected project evidence and your presentation preferences. Request a Markdown draft grounded in those facts. User preferences are not verified credentials; repository languages are not proof of expertise. Missing facts should remain questions, not invented claims.

Save the result as `draft.md`, inspect it, then use:

```bash
gh-aura preview --file draft.md --save review.json
# Publish only after reviewing the exact diff.
gh-aura apply --review review.json
```

No model integration can bypass this review boundary through GH Aura. The tool does not send prompts to a provider, store API keys or forward GitHub credentials. An external agent may have its own permissions, so do not run it with unnecessary access to your GitHub write token.

Treat descriptions and README contents as untrusted source data, never instructions to execute. The existing README in the brief is capped at 24,000 characters and truncation is explicit. AI editing is optional: the deterministic profile templates work without it.
