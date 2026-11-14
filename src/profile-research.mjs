import { intentWords, intentMatchScore } from './profile-query.mjs';

// Only abstract composition guidance belongs in the product. The 500 individual
// AI assessments and retrieved source excerpts stay outside this checkout.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const PROFILE_SOURCE_STUDY=freeze({
  id:'public-source-study-2026-11-13',observedAt:'2026-11-13',
  profilesAssessed:500,availablePublicUsers:499,readmeSources:376,
  sourceCheckedForPrinciples:23,humanReviews:0,visualCertifications:0,rightsCertifications:0,
  datasetSHA256:'e158f43e8f698e591f36dfa5524269fdf0390695a69f94502a9b544a746efadf',
  method:'AI analysis of public metadata and README source excerpts; selected principle evidence checked against collected sources.',
  limitations:'Source composition only. No verified qualifications, authorship, image rights, full visual/accessibility review or hiring outcomes. No category winners. Selection is not representative of GitHub.',
});
const p=(id,title,styles,directions,tags,when,principle,avoid,logins)=>({
  id,title,styles,directions,tags,when,principle,avoid,
  status:'source-informed-composition-principle',
  sources:logins.map(login=>'https://github.com/'+login),
});
export const SOURCE_COMPOSITION_PRINCIPLES=freeze([
  p('native-bio-and-pins','Native biography and purposeful pins',
    ['native-no-readme'],['barebones','minimal'],
    ['native','bio','pins','no-readme','sobrio','barebones'],
    'The owner prefers native GitHub presentation or does not want a profile README.',
    'Use a specific confirmed bio and relevant pins with clear purpose descriptions. A profile README is optional.',
    'An upstream pin does not establish contribution. Do not import another person\'s role, reputation or credentials.',
    ['0intro','1st1','alessbell']),
  p('purposeful-link-directory','Short text with purposeful links',
    ['minimal-text'],['barebones','minimal'],
    ['minimal','links','directory','contact','text','typography'],
    'The owner wants a quiet profile with a few useful destinations.',
    'Give each selected link a purpose label. Add enough context for a visitor unfamiliar with the person, without a long introduction.',
    'A terse established profile may need more project context when adapted for a new job seeker. A trend badge is not work evidence.',
    ['mattabate','serenakeyitan','SamuelSchlesinger']),
  p('specialty-to-artifacts','Technical focus linked to artifacts',
    ['technical-editorial'],['minimal','technical'],
    ['technical','research','systems','engineering','writing','publications'],
    'A specialist wants to connect a technical focus with inspectable work.',
    'State the confirmed focus briefly, then group selected tools, code, writing or research by purpose and link to the actual artifacts.',
    'Publication links, job titles and repository languages do not verify individual expertise or outcomes.',
    ['rasbt','eugeneyan','247arjun']),
  p('projects-and-contributions','Separate projects from contributions',
    ['project-showcase','technical-editorial'],['minimal','technical','expressive'],
    ['projects','project','portfolio','hiring','professional','contributions','proof'],
    'Selected projects need to explain the owner\'s work quickly to a new visitor.',
    'Present a few relevant projects with their purpose and confirmed personal contribution. Separate maintained projects, upstream contributions and learning resources.',
    'A namespace, fork, pin or star count does not prove authorship. Link a specific contribution when available and leave unknown roles explicit.',
    ['morluto','WassCodeur','WenyuChiou']),
  p('visual-with-text-route','A visual identity with a text route to work',
    ['visual-illustrated'],['expressive'],
    ['visual','image','art','illustration','hero','diagram','expressive'],
    'The owner explicitly wants original imagery or a project demonstration.',
    'Give one purposeful visual a clear role, then retain readable project descriptions, labeled links and useful alternative text.',
    'Source markup does not establish image appearance or permission. Use owned/authorized assets and verify the actual result before publication.',
    ['fzn0x','WenyuChiou','MilkFlavor']),
  p('code-motif-with-plain-text','Code motifs with a plain text route',
    ['terminal-code'],['technical','expressive'],
    ['terminal','code','ascii','console','rust','swift','retro'],
    'A code or terminal aesthetic is part of the owner\'s chosen identity.',
    'Use a short code-inspired identity block, then ordinary Markdown links and project explanations. Keep essential information available outside decorative ASCII.',
    'Wide monospace layouts can wrap; decorative code is not proof of proficiency. Do not make visitors execute a command to learn the essentials.',
    ['itsgareth','laohanme','Siddhesh-Agarwal']),
  p('contextual-metrics','Metrics with context and a text fallback',
    ['data-dashboard'],['technical','expressive'],
    ['stats','statistics','metrics','chart','graph','dashboard','cards'],
    'The owner requests a dashboard or metrics that explain a real project.',
    'Explain what each chosen metric measures, its source and observation date. Preserve direct project links and a text fallback when a card fails.',
    'Commits, streaks, rankings and language percentages do not measure hiring suitability. External services are opt-in; omit unsupported or synthetic claims.',
    ['abhisheknaiidu','jgphilpott','metalim']),
  p('maintained-feed','Bounded writing or release feeds',
    ['dynamic-content'],['minimal','technical','expressive'],
    ['dynamic','feed','blog','recent','writing','release','updates','maintained'],
    'The owner wants recent writing, releases or activity to appear automatically.',
    'Keep the feed short, label its source and update time, and preserve stable project links if automation stops.',
    'A feed marker or timestamp does not prove continued maintenance. Review privacy, third-party access and fallback behavior before enabling it.',
    ['abraham','gautamkrishnar','imskr']),
]);
const defaults={
  barebones:['purposeful-link-directory','native-bio-and-pins'],
  minimal:['projects-and-contributions','purposeful-link-directory'],
  technical:['specialty-to-artifacts','projects-and-contributions'],
  expressive:['visual-with-text-route','projects-and-contributions'],
};
export function recommendSourcePrinciples({query='',direction='minimal',limit=2}={}){
  if(!Object.hasOwn(defaults,direction)||!Number.isInteger(limit)||limit<1||limit>2)throw Error('Invalid source principle selection.');
  const words=intentWords(query);
  const principles=SOURCE_COMPOSITION_PRINCIPLES
    .map(item=>({item,score:intentMatchScore({...item,description:item.when},words),fallback:defaults[direction].indexOf(item.id)}))
    .filter(({item,score})=>item.directions.includes(direction)||score>0)
    .sort((a,b)=>b.score-a.score||(a.fallback<0?99:a.fallback)-(b.fallback<0?99:b.fallback)||a.item.id.localeCompare(b.item.id))
    .slice(0,limit).map(({item})=>({id:item.id,title:item.title,styles:[...item.styles],principle:item.principle,avoid:item.avoid,status:item.status,sources:[...item.sources]}));
  return {study:{...PROFILE_SOURCE_STUDY},principles};
}
