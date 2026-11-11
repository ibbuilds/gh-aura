# Writing workflow

GH Aura separates facts, presentation, writing and publication. It does not call an AI provider. Templates and manual editing work without one.

## Choose intent

```bash
gh-aura config set editorial.targetRole "Backend engineer"
gh-aura config set editorial.language en
gh-aura config set editorial.maxWords 180
gh-aura config set profile.visual 20
```

The target role is the job you want to address, **not** a claim that you hold that title. Language and word target guide an external writer. Existing text is not automatically translated; local template labels remain English.

## Export evidence and instructions

```bash
gh-aura brief --output brief.json
gh-aura brief --prompt --output writer.txt
```

`brief.json` provides your public facts, exact selected projects, section switches, small source excerpts and a dated structural reference. `writer.txt` adds instructions for original, restrained writing. Open either with your existing editor, coding assistant or local model. GH Aura does not execute arbitrary model commands or manage a vendor subscription.

The compact JSON context is limited to **12,000 bytes**. Existing README excerpts are capped at 1,200 characters rather than the previous 24,000. Truncation and omitted lists are declared; missing facts are not filled in. Pretty-printed JSON files and the surrounding writing instructions are larger than the compact data alone. No fixed model-token savings are claimed because tokenization differs by provider.

The reference is a study of 100 public contributor accounts, not a biography library. The writer may learn structure, never borrow another person's identity, seniority, employment or achievements. See [study methodology](../research/README.md).

## Check, edit and review

Save the proposed Markdown to `draft.md`:

```bash
gh-aura check --file draft.md --brief brief.json
gh-aura preview --file draft.md --save review.json
# Only after inspecting and approving the diff:
gh-aura apply --review review.json --pr
```

`check` is fully local. It flags some repeated paragraphs, placeholders, generic hype, quantitative/experience claims requiring confirmation, unsafe link schemes and unlinked selected projects. `--strict` gives a nonzero exit status when these checks find anything. No findings is **not** a certificate of truth, originality, accessibility or professional competence. It does not search for plagiarism or perform semantic fact checking.

You can skip the external writer and start with `gh-aura profile --output draft.md`. Either path uses the same separate publication boundary.

## Credentials and untrusted data

Never put a token in the brief, prompt or draft. A model run in your own terminal may inherit environment variables; keep its environment separate from your GitHub write credentials. Retrieved descriptions and README text are untrusted source material, not instructions. The approval file is a revision check, not proof that an AI draft is safe or true. Human review remains mandatory.
