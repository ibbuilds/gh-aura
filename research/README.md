# Design references

Research helps find examples; it does not add a corpus to the product.

1. `gh-aura sources categories --json` lists the eight categories.
2. `gh-aura sources profiles --category terminal-code --json` returns specific profiles.
3. The AI reads those profiles and composes an original design for the user. `sources design --query "restrained terminal" --json` selects a category, examples and compatible techniques in one call.

The compact index lives in [profile-patterns.mjs](../src/profile-patterns.mjs). It preserves the eight original references and supports secondary categories. Links are reading references; they do not grant rights to text, images or credentials. Inspect the current profiles when using them.

Historical datasets, collectors and reports remain recoverable at commit [d978bbae0234b30390885fc17bb7f2b6d52bc21b](https://github.com/ibbuilds/gh-aura/tree/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research). `npm run test:research` verifies that archive in a temporary directory, without network access or packaging it, then removes the export. If a clone is missing the checkpoint:

    git fetch origin d978bbae0234b30390885fc17bb7f2b6d52bc21b

The AI analysis corpus remains local by the owner's decision and is not used in profile generation.
