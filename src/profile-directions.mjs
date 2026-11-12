/**
 * Creative directions are constraints for an optional AI writing prompt,
 * not fixed Markdown templates, copies of other people's profiles or claims.
 * Explicit user choices always win over the suggested composition.
 */
export const PROFILE_DIRECTIONS=Object.freeze({
  barebones:Object.freeze({
    label:'Barebones',voice:'plain and direct',
    composition:'One-line identity, 1–3 verified links or projects, and optional contact. Let GitHub pins and contribution history carry the rest.',
    visuals:'Text and native Markdown only; no badges, graphics, animated widgets, tables or counters by default.',
    priority:'Clarity, working links and evidence before any decoration.',
  }),
  minimal:Object.freeze({
    label:'Minimal',voice:'concise and professional',
    composition:'Brief specialty and focus, two evidence-backed projects, and one contact path. Use short paragraphs rather than a CV.',
    visuals:'Simple headings or short bullets. No forced diagrams, badges or metric tiles.',
    priority:'Relevant work and your verified contribution.',
  }),
  technical:Object.freeze({
    label:'Technical',voice:'specific, engineering-focused and restrained',
    composition:'Technical focus, 2–3 selected projects with purpose, contribution and inspectable proof; optional compact technology list.',
    visuals:'Readable Markdown and relevant links. Prefer code or demos only when they actually demonstrate a capability.',
    priority:'Architecture decisions, tests, actual work and reproducible outcomes.',
  }),
  expressive:Object.freeze({
    label:'Expressive',voice:'distinctive yet credible',
    composition:'A recognizable visual identity is optional; pair it with a short introduction, strong projects and clear contact.',
    visuals:'At most one deliberate hero image or visual element when supplied or approved by the user. Avoid GIF walls, trophy grids, excessive stats and copied themes.',
    priority:'Originality must not obscure the work or imply unearned credentials.',
  }),
});
export const PROFILE_DIRECTION_NAMES=Object.freeze(Object.keys(PROFILE_DIRECTIONS));
export function resolveProfileDirection(name='minimal') {
  if(typeof name!=='string'||!Object.hasOwn(PROFILE_DIRECTIONS,name))
    throw Error('editorial.direction must be barebones, minimal, technical or expressive.');
  return {name,...PROFILE_DIRECTIONS[name],
    customizations:'The user may override every section, link, length and visual preference. This is guidance for original composition, not a template.'};
}
