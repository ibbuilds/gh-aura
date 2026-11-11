// Community-reported achievement triggers. GitHub controls eligibility and awarding.
// There is no complete official, stable list of award thresholds.
export const ACHIEVEMENTS = [
  {
    name: 'Pull Shark',
    availability: 'community-reported as available',
    how: 'Have genuine pull requests merged. Work on useful bug fixes, documentation, tests, or features.',
    caveat: 'Reported tiers and counts can change; a merged PR is not a guaranteed badge.',
  },
  {
    name: 'Pair Extraordinaire',
    availability: 'community-reported as available',
    how: 'Co-author an actual change with another contributor and merge it through a genuine PR.',
    caveat: 'Only attribute real co-authors; the badge may not be awarded for every qualifying-looking event.',
  },
  {
    name: 'Galaxy Brain',
    availability: 'community-reported as available',
    how: 'Give useful answers in Q&A Discussions that maintainers accept.',
    caveat: 'Another person decides whether your answer is accepted.',
  },
  {
    name: 'Starstruck',
    availability: 'community-reported as available',
    how: 'Publish useful repositories that other developers choose to star.',
    caveat: 'Stars come from other people and cannot be guaranteed.',
  },
  {
    name: 'Quickdraw',
    availability: 'community-reported as available',
    how: 'Historically associated with closing an issue or PR shortly after opening it.',
    caveat: 'Do not generate trivial issues or PRs just to trigger a badge.',
  },
  {
    name: 'YOLO',
    availability: 'community-reported as available',
    how: 'Historically associated with merging a PR without a review.',
    caveat: 'Unreviewed merges can harm code quality. Do not weaken review requirements to farm this badge.',
  },
  {
    name: 'Public Sponsor',
    availability: 'community-reported as available',
    how: 'Support an eligible developer or project through GitHub Sponsors if you genuinely want to.',
    caveat: 'May require payment; not an engineering skill credential.',
  },
  {
    name: 'Arctic Code Vault Contributor',
    availability: 'historical — unavailable to new participants',
    how: 'Historical GitHub archive event.',
    caveat: 'Cannot newly earn this time-limited achievement.',
  },
  {
    name: 'Mars 2020 Helicopter Contributor',
    availability: 'historical — unavailable to new participants',
    how: 'Historical GitHub/NASA event.',
    caveat: 'Cannot newly earn this time-limited achievement.',
  },
];

export const ACHIEVEMENT_SOURCES = [
  'https://docs.github.com/en/account-and-profile/reference/profile-reference',
  'https://github.com/christianalberto/github-profile-achievements',
];

export function renderAchievementsMarkdown() {
  const lines = ['# GH Aura achievement navigator', '',
    'GitHub awards achievements; GH Aura cannot grant them. Availability is community-reported, not guaranteed.',
    'No current badge status is inferred from the command alone.', ''];
  for (const item of ACHIEVEMENTS) {
    lines.push('## ' + item.name, '',
      '- Availability: ' + item.availability,
      '- Path: ' + item.how,
      '- Caveat: ' + item.caveat, '');
  }
  lines.push('## Sources', '', ...ACHIEVEMENT_SOURCES.map((link) => '- ' + link), '');
  return lines.join('\n').trim() + '\n';
}
