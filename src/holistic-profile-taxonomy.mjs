// Style vocabulary and profile components used by the reference index.
export const PROFILE_FACETS=Object.freeze([
  'avatar','profileHeader','biography','links','profileReadme',
  'pinnedRepositories','contributionCalendar','achievements','overallComposition',
]);
const cat=(id,title,about,checks)=>Object.freeze({id,title,about,checks:Object.freeze(checks)});
export const HOLISTIC_STYLES=Object.freeze([
  cat('native-no-readme','Native GitHub identity',
    'Avatar, public sidebar, pins and activity carry the profile; README may be absent.',
    ['avatar and sidebar coherence','pins and activity context','no forced README']),
  cat('minimal-text','Minimal text',
    'Sparse but intentional self-description and links, with an appropriately quiet visual system.',
    ['identity clarity','link relevance','content proportional to the owner']),
  cat('technical-editorial','Technical editorial',
    'A structured technical narrative that explains observable work and proof.',
    ['specific work','readable hierarchy','links to implementation']),
  cat('project-showcase','Project/product showcase',
    'A strong relationship between public pins, examples, project presentation and evidence.',
    ['project purpose','personal work distinctions','quality of pin selection']),
  cat('visual-illustrated','Illustrated visual identity',
    'Distinct, original imagery that supports the overall identity and inspectable work.',
    ['rights-cleared art','mobile and theme legibility','projects not eclipsed']),
  cat('terminal-code','Terminal or code-inspired',
    'Code and terminal motifs coherently tied to actual projects, not pasted ASCII gimmicks.',
    ['accessible code imagery','theme clarity','real tools and projects']),
  cat('data-dashboard','Data-rich dashboard',
    'Metrics, statistics and activity visuals intentionally support the narrative.',
    ['accurate metrics','non-misleading activity','external-service resilience']),
  cat('dynamic-content','Actively maintained content',
    'Current projects, writing or releases appear through reliable updates.',
    ['freshness','useful information','maintained automation']),
]);
export const PROFILE_PURPOSES=Object.freeze([
  'career','research','open-source','product','personal','educational',
]);
