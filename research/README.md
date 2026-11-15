# Design references: 64 profiles

The active index contains 64 unique public profiles: exactly eight primary examples per style. Secondary styles describe hybrids without counting a person twice. Selection considers the actual presentation, readable project context and linked public work. Job titles, followers and stars do not determine inclusion.

## Selection criteria

The eight examples in each category were selected from the reviewed 100-profile pool using the same presentation criteria:

- Clear identity and purpose from the introduction, sidebar and project selection.
- Specific public work with direct source, demo, publication or contribution links.
- Readable hierarchy and useful information that is easy to scan.
- Coherent imagery and formatting that support the work instead of overwhelming it.
- Available references and resources at inspection time, with usable text context.

When examples teach a similar pattern, prefer the clearer project explanation and the more restrained presentation. Preserve different useful approaches within each style. This is an editorial selection using observable evidence, not an objective ranking of people or a hiring certificate. Each entry's `pattern` explains its presentation value; the agent inspects the current source before using it.

1. `gh-aura sources categories --json` lists the eight categories.
2. `gh-aura sources profiles --category terminal-code --json` returns specific profiles.
3. The AI reads those profiles and composes an original design for the user. `sources design --query "restrained terminal" --json` selects a category, examples and compatible techniques in one call.

The compact index lives in [profile-patterns.mjs](../src/profile-patterns.mjs). Each entry includes a presentation observation, a public work link and a check date. The original eight links remain visible in `sources categories --json` as provenance; six are in the current selection. Category browsing returns the balanced primary examples. Links are reading references; inspect the current profile, claims and asset rights before adapting an idea. Presentation selection does not verify credentials or hiring outcomes.

## Profiles by primary style

- **Native GitHub identity (8):** [0intro](https://github.com/0intro), [1st1](https://github.com/1st1), [bradfitz](https://github.com/bradfitz), [BurntSushi](https://github.com/BurntSushi), [michenriksen](https://github.com/michenriksen), [ajeetdsouza](https://github.com/ajeetdsouza), [leerob](https://github.com/leerob), [mdo](https://github.com/mdo).
- **Minimal text (8):** [mattabate](https://github.com/mattabate), [serenakeyitan](https://github.com/serenakeyitan), [antfu](https://github.com/antfu), [setu4993](https://github.com/setu4993), [benjamincanac](https://github.com/benjamincanac), [afender](https://github.com/afender), [pkosiec](https://github.com/pkosiec), [junegunn](https://github.com/junegunn).
- **Technical editorial (8):** [SamuelSchlesinger](https://github.com/SamuelSchlesinger), [rasbt](https://github.com/rasbt), [hamelsmu](https://github.com/hamelsmu), [martincostello](https://github.com/martincostello), [jeroenvervaeke](https://github.com/jeroenvervaeke), [jonhoo](https://github.com/jonhoo), [247arjun](https://github.com/247arjun), [RaoHai](https://github.com/RaoHai).
- **Project/product showcase (8):** [morluto](https://github.com/morluto), [tannerlinsley](https://github.com/tannerlinsley), [guichristovao](https://github.com/guichristovao), [rishavbharti](https://github.com/rishavbharti), [james-elicx](https://github.com/james-elicx), [twpayne](https://github.com/twpayne), [Shubhamsaboo](https://github.com/Shubhamsaboo), [DaniAkash](https://github.com/DaniAkash).
- **Illustrated visual identity (8):** [M0nica](https://github.com/M0nica), [RitvikDayal](https://github.com/RitvikDayal), [WenyuChiou](https://github.com/WenyuChiou), [viveknigam3003](https://github.com/viveknigam3003), [dereknguyen269](https://github.com/dereknguyen269), [EthanThatOneKid](https://github.com/EthanThatOneKid), [davidgcs](https://github.com/davidgcs), [b0o](https://github.com/b0o).
- **Terminal or code-inspired (8):** [fzn0x](https://github.com/fzn0x), [itsgareth](https://github.com/itsgareth), [laohanme](https://github.com/laohanme), [Zhenye-Na](https://github.com/Zhenye-Na), [willmcgugan](https://github.com/willmcgugan), [IllyaStarikov](https://github.com/IllyaStarikov), [guilyx](https://github.com/guilyx), [ddroid](https://github.com/ddroid).
- **Data-rich dashboard (8):** [lowlighter](https://github.com/lowlighter), [jstrieb](https://github.com/jstrieb), [metalim](https://github.com/metalim), [MacroPower](https://github.com/MacroPower), [orhun](https://github.com/orhun), [gaurav-gandhi-2411](https://github.com/gaurav-gandhi-2411), [guicaulada](https://github.com/guicaulada), [RMANOV](https://github.com/RMANOV).
- **Actively maintained content (8):** [simonw](https://github.com/simonw), [eugeneyan](https://github.com/eugeneyan), [rednafi](https://github.com/rednafi), [jbranchaud](https://github.com/jbranchaud), [tw93](https://github.com/tw93), [caarlos0](https://github.com/caarlos0), [JamesIves](https://github.com/JamesIves), [muesli](https://github.com/muesli).

Historical datasets, collectors and reports remain recoverable at commit [d978bbae0234b30390885fc17bb7f2b6d52bc21b](https://github.com/ibbuilds/gh-aura/tree/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research). `npm run test:research` verifies that archive in a temporary directory, without network access or packaging it, then removes the export. If a clone is missing the checkpoint:

    git fetch origin d978bbae0234b30390885fc17bb7f2b6d52bc21b

The AI analysis corpus remains local by the owner's decision and is not used in profile generation.
