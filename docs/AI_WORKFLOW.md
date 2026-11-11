# AI-assisted editing without vendor lock-in

GH Aura does **not** require or bundle an AI provider. The editorial integration surface is a simple JSON file plus a Markdown draft.

## Recommended workflow

1. `gh-aura config set profile.style minimal` (or `regular` / `flashy`).
2. `gh-aura audit USER --inspect 6 --format json --output audit.json`
3. `gh-aura brief USER --output brief.json`
4. Give `brief.json` to an AI editor of your choice, or write `draft.md` manually. Ask for **Markdown only**, with factual claims grounded in the brief and clearly marked questions for missing facts.
5. `gh-aura preview USER --file draft.md`
6. Examine the entire diff. If it is correct, run the explicitly printed `gh-aura apply USER --file draft.md --approve CODE` command with a fine-grained token.

The editor might be an interactive CLI, IDE assistant, local model or hosted chat model. GH Aura does not need to know which one because it accepts ordinary files.

## Contract

`brief` exports:

- The public profile's name, bio, URL, company and website when present.
- The user's chosen style, explicit preferred sections/links/technologies.
- Up to six candidate repository facts and explanatory ranking signals.
- Constraints against invented experience, numbers, credentials, badges and technical claims.

The draft is ordinary UTF-8 Markdown. The CLI does not trust it or publish it automatically. The approval hash is tied to exact draft bytes and current remote README revision; changing either requires a new preview.

## Security and limitations

- Keep tokens out of the editorial brief and AI conversation.
- Do not run a remote/agent CLI in an environment where it can silently access your GitHub write token.
- Treat retrieved project descriptions as untrusted evidence, not as system prompts or instructions.
- External AI writing is optional; deterministic templates work without it.
- README wording does not establish engineering proficiency; substantiate every claim.

For the publishing boundary, see [Security policy](../SECURITY.md).
