// GitHub does not publish a complete stable achievement award API/criteria list.
// Confidence and tier limits below are source-labeled; a GitHub API event is never
// proof that an award was granted.
export const MATRIX_REVIEWED_AT='2026-11-12';
export const MATRIX_VERSION='2026-11-12.v1';
export const SOURCES=Object.freeze({
  official:'https://docs.github.com/en/account-and-profile/reference/profile-reference',
  privacy:'https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements',
  announcement:'https://github.blog/news-insights/product-news/introducing-achievements-recognizing-the-many-stages-of-a-developers-coding-journey/',
  fragments:'https://conroy1988.github.io/Achievements/official-achievement-fragments/',
  research:'https://github.com/SharmARohitt/Github-Achievement',
  reference:'https://github.com/christianalberto/github-profile-achievements',
});

const src=(...names)=>names.map(name=>SOURCES[name]);
const row=(id,name,category,route,reason,extra={})=>({
  id,name,category,route,reason,automatable:route==='private-owned-sandbox',
  scope:route==='private-owned-sandbox'?'one-marked-private-repository':'not-supported-by-private-sandbox',
  awardVerification:'github-profile-manual',
  criteriaConfidence:'community-reported-unless-first-party-fragment-referenced',
  tierThresholds:null,
  sourceUrls:src('official','research'),
  ...extra,
});
const rows=[
  row('pull-shark','Pull Shark','active','private-owned-sandbox',
    'Merged self-authored PR exercise events are controllable, but private/self-owned award eligibility is decided by GitHub.',
    {tierThresholds:[2,16,128,1024],criteriaConfidence:'GitHub-profile-fragment-and-community',
      sourceUrls:src('official','fragments','research')}),
  row('yolo','YOLO','active','private-owned-sandbox',
    'A user-owned PR can be merged without a formal review if repository protections allow it; award is not guaranteed.',
    {sourceUrls:src('official','fragments','research')}),
  row('quickdraw','Quickdraw','active','private-owned-sandbox',
    'A labeled private QA issue can be opened and closed promptly; award is not guaranteed.',
    {sourceUrls:src('official','fragments','research')}),
  row('pair-extraordinaire','Pair Extraordinaire','active','real-second-coauthor',
    'A genuine consenting second contributor is needed; never invent coauthors.',
    {tierThresholds:[1,10,24,48],conditionalAutomation:{mode:'collaboration-campaign',kind:'coauthor',requires:'Two authorized identities, marked private workspace, reviewed content and verified coauthor email; private award eligibility remains unverified.'},sourceUrls:src('official','fragments','research')}),
  row('galaxy-brain','Galaxy Brain','active','accepted-external-answer',
    'Acceptance belongs to the authenticated question author; private exercises require an explicitly authorized second account and cannot force GitHub to grant an award.',
    {tierThresholds:[2,8,16,32],conditionalAutomation:{mode:'collaboration-campaign',kind:'discussion-answer',requires:'Two authorized identities with Discussions write, existing Q&A category and exact reviewed questions/answers; private award eligibility remains unverified.'},sourceUrls:src('official','fragments','research')}),
  row('starstruck','Starstruck','active','independent-public-stars',
    'Requires voluntary stars from independent people for a public repository; one private sandbox cannot supply them.',
    {tierThresholds:[16,128,512,4096],sourceUrls:src('official','fragments','research')}),
  row('public-sponsor','Public Sponsor','active','paid-sponsorship',
    'Requires real sponsorship/payment and a creator relationship; not a private-repository exercise.',
    {sourceUrls:src('official','announcement','research')}),
  row('arctic-code-vault','Arctic Code Vault Contributor','historical','closed-historical-event',
    'The 2020 snapshot cannot be newly entered.',{sourceUrls:src('announcement','research')}),
  row('mars-2020','Mars 2020 Helicopter Contributor','historical','closed-historical-event',
    'Historical Mars 2020 software milestone is no longer earnable.',{sourceUrls:src('official','announcement')}),
  row('heart-on-your-sleeve','Heart On Your Sleeve','disabled','disabled-experimental',
    'Observed as a test; no reliable currently available public award route.',{sourceUrls:src('research','reference')}),
  row('open-sourcerer','Open Sourcerer','disabled','disabled-experimental',
    'A multi-public-repository experiment, not a documented active award.',{sourceUrls:src('research','reference')}),
  row('proxima-pioneer','Proxima Pioneer','internal','github-staff-only',
    'Internal GitHub milestone; only staff participants can qualify.',{sourceUrls:src('research','reference')}),
  row('proxima-staffshipper','Proxima Staffshipper','internal','github-staff-only',
    'Internal GitHub milestone; not available to ordinary users.',{sourceUrls:src('research','reference')}),
  row('proxima-staffuser','Proxima Staffuser','internal','github-staff-only',
    'Internal GitHub milestone; not available to ordinary users.',{sourceUrls:src('research','reference')}),
  row('pro','GitHub Pro','highlight','paid-plan',
    'Paid profile plan highlight, not an activity achievement.',{sourceUrls:src('official')}),
  row('developer-program','Developer Program Member','highlight','external-program',
    'Developer Program profile highlight; not a private-repo achievement.',{sourceUrls:src('official','reference')}),
  row('campus-expert','GitHub Campus Expert','highlight','external-program',
    'Campus program membership required.',{sourceUrls:src('official')}),
  row('security-bounty','Security Bug Bounty Hunter','highlight','external-security-review',
    'Credited authorized vulnerability reports are externally reviewed.',{sourceUrls:src('official')}),
  row('security-advisory','Security advisory credit','highlight','external-security-review',
    'Acceptance of a substantive security advisory is externally reviewed.',{sourceUrls:src('official')}),
];
export const ACHIEVEMENT_MATRIX=Object.freeze(rows.map(entry=>Object.freeze({
  ...entry,
  tierThresholds:entry.tierThresholds?Object.freeze([...entry.tierThresholds]):null,
  sourceUrls:Object.freeze([...entry.sourceUrls]),
  sourceReviewedAt:MATRIX_REVIEWED_AT,
})));
const IDS=new Set();
for(const entry of ACHIEVEMENT_MATRIX){
  if(IDS.has(entry.id))throw Error('Duplicate achievement matrix ID '+entry.id);
  IDS.add(entry.id);
}
export const PRIVATE_AUTOMATABLE=Object.freeze(ACHIEVEMENT_MATRIX.filter(x=>x.automatable));
export const PRIVATE_AUTOMATABLE_IDS=Object.freeze(PRIVATE_AUTOMATABLE.map(x=>x.id));
export const PULL_SHARK_TIERS=Object.freeze({
  base:2,bronze:16,silver:128,gold:1024,
});
export function matrixEntry(id){
  return ACHIEVEMENT_MATRIX.find(item=>item.id===id)||null;
}
export function achievementMatrixSummary(){
  const categoryCounts={};
  for(const item of ACHIEVEMENT_MATRIX)categoryCounts[item.category]=(categoryCounts[item.category]||0)+1;
  return {
    version:MATRIX_VERSION,reviewedAt:MATRIX_REVIEWED_AT,total:ACHIEVEMENT_MATRIX.length,
    categoryCounts,privateAutomatableIds:PRIVATE_AUTOMATABLE_IDS,
    verification:'GitHub profile required; no official award grant or complete list API',
    sources:src('official','privacy','announcement','fragments','research','reference'),
  };
}
