import { intentWords, intentMatchScore } from './profile-query.mjs';

// Editorially curated *composition references*, not reusable templates or an endorsement
// of any person's claims, employers, drawings, badges or online reputation.
// The full corpus is preserved at the immutable checkpoint linked in research/README.md.
export const PROFILE_SHORTLIST_VERSION='2026-11-12.v1';
export const PROFILE_SHORTLIST_STATUS='provisional-readme-only; holistic avatar/bio/pins/calendar/achievements/visual review missing';
const candidates=[
  {
    "id": "mattabate",
    "direction": "barebones",
    "title": "A purposeful link directory",
    "when": "Link-first profiles with existing external work",
    "learn": "Name each link for the work it leads to",
    "avoid": "Using only personal links when the visitor needs project evidence",
    "tags": [
      "links",
      "directory",
      "portfolio",
      "barebones",
      "sobrio",
      "minimal"
    ],
    "profileUrl": "https://github.com/mattabate",
    "readmeUrl": "https://github.com/mattabate/mattabate/blob/main/README.md",
    "origin": "user-supplied-reference"
  },
  {
    "id": "antfu",
    "direction": "barebones",
    "title": "Compact typographic navigation",
    "when": "Experienced makers with independently inspectable work",
    "learn": "A single quiet row of descriptive links",
    "avoid": "Assuming reputation can replace project explanations for beginners",
    "tags": [
      "links",
      "typography",
      "navigation",
      "minimalist",
      "barebones",
      "minimal",
      "sobrio"
    ],
    "profileUrl": "https://github.com/antfu",
    "readmeUrl": "https://github.com/antfu/antfu/blob/main/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "serenakeyitan",
    "direction": "minimal",
    "title": "Current project first",
    "when": "A brief intro with one strong current project",
    "learn": "A concise statement followed by an inspectable project link",
    "avoid": "Using trending badges as proof of competence",
    "tags": [
      "project",
      "minimal",
      "current",
      "agent",
      "open-source",
      "claro"
    ],
    "profileUrl": "https://github.com/serenakeyitan",
    "readmeUrl": "https://github.com/serenakeyitan/serenakeyitan/blob/main/README.md",
    "origin": "user-supplied-reference"
  },
  {
    "id": "rasbt",
    "direction": "minimal",
    "title": "Specialty and publications",
    "when": "Researchers and educators with substantial public work",
    "learn": "Explicit specialty plus books, research and code links",
    "avoid": "Presenting unverified experience or publications as credentials",
    "tags": [
      "research",
      "writing",
      "ai",
      "books",
      "educational",
      "minimal"
    ],
    "profileUrl": "https://github.com/rasbt",
    "readmeUrl": "https://github.com/rasbt/rasbt/blob/main/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "ferhatelmas",
    "direction": "minimal",
    "title": "Precise technical specialization",
    "when": "Engineers who want restrained, systems-focused text",
    "learn": "Explain what kind of systems are built and point to relevant code",
    "avoid": "Copying an employer or engineering-history claim",
    "tags": [
      "systems",
      "backend",
      "storage",
      "infrastructure",
      "text",
      "minimal"
    ],
    "profileUrl": "https://github.com/ferhatelmas",
    "readmeUrl": "https://github.com/ferhatelmas/ferhatelmas/blob/main/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "setu4993",
    "direction": "minimal",
    "title": "Research and output links",
    "when": "Researchers with publications and projects",
    "learn": "Keep separate paths to code, writing and publications",
    "avoid": "Treating linked writings as proof of technical authorship",
    "tags": [
      "research",
      "publications",
      "links",
      "minimal",
      "science"
    ],
    "profileUrl": "https://github.com/setu4993",
    "readmeUrl": "https://github.com/setu4993/setu4993/blob/main/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "benjamincanac",
    "direction": "minimal",
    "title": "Maintainer and flagship project",
    "when": "Maintainers of a recognizable project or library",
    "learn": "One sentence identifying maintainership and the main project",
    "avoid": "Replacing evidence with a third-party profile card",
    "tags": [
      "maintainer",
      "frontend",
      "vue",
      "nuxt",
      "project",
      "minimal"
    ],
    "profileUrl": "https://github.com/benjamincanac",
    "readmeUrl": "https://github.com/benjamincanac/benjamincanac/blob/main/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "guichristovao",
    "direction": "minimal",
    "title": "Two concrete projects",
    "when": "Job seekers or builders with a small portfolio",
    "learn": "Name two real projects and explain what each does",
    "avoid": "Assuming a badge row demonstrates engineering ability",
    "tags": [
      "android",
      "projects",
      "portfolio",
      "minimal",
      "proof",
      "hiring"
    ],
    "profileUrl": "https://github.com/guichristovao",
    "readmeUrl": "https://github.com/guichristovao/guichristovao/blob/main/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "SamuelSchlesinger",
    "direction": "technical",
    "title": "Research linked to contributions",
    "when": "Technical authors, formal methods and security",
    "learn": "Group research themes with specific code, learning and standards links",
    "avoid": "Copying affiliations, teaching claims or technical credentials",
    "tags": [
      "research",
      "cryptography",
      "formal",
      "technical",
      "projects",
      "proofs"
    ],
    "profileUrl": "https://github.com/SamuelSchlesinger",
    "readmeUrl": "https://github.com/SamuelSchlesinger/SamuelSchlesinger/blob/main/README.md",
    "origin": "user-supplied-reference"
  },
  {
    "id": "morluto",
    "direction": "technical",
    "title": "Technical work and research notes",
    "when": "Independent researchers with a range of experiments",
    "learn": "Organize projects by what they achieve and link to artifacts",
    "avoid": "Excessive project inventories and repetitive star counters",
    "tags": [
      "research",
      "reverse",
      "engineering",
      "projects",
      "technical",
      "ai"
    ],
    "profileUrl": "https://github.com/morluto",
    "readmeUrl": "https://github.com/morluto/morluto/blob/main/README.md",
    "origin": "user-supplied-reference"
  },
  {
    "id": "simonw",
    "direction": "technical",
    "title": "Meaningful automatically updated work",
    "when": "Active maintainers with a maintained publishing pipeline",
    "learn": "Present dated releases and writing when they inform visitors",
    "avoid": "Adding dynamic feeds without a real update mechanism",
    "tags": [
      "releases",
      "blog",
      "dynamic",
      "open-source",
      "maintenance",
      "technical"
    ],
    "profileUrl": "https://github.com/simonw",
    "readmeUrl": "https://github.com/simonw/simonw/blob/main/README.md",
    "origin": "external-curated-research"
  },
  {
    "id": "tannerlinsley",
    "direction": "technical",
    "title": "Ecosystem map",
    "when": "Maintainers overseeing multiple related libraries",
    "learn": "Group related products by purpose with direct documentation links",
    "avoid": "Listing technology names without showing authored work",
    "tags": [
      "ecosystem",
      "library",
      "project",
      "typescript",
      "frontend",
      "open-source"
    ],
    "profileUrl": "https://github.com/tannerlinsley",
    "readmeUrl": "https://github.com/tannerlinsley/tannerlinsley/blob/master/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "eugeneyan",
    "direction": "technical",
    "title": "Research and recent writing",
    "when": "Applied research practitioners and technical writers",
    "learn": "Combine clear research focus with useful publications",
    "avoid": "Asserting employer, publication or scale claims without proof",
    "tags": [
      "research",
      "machine",
      "learning",
      "writing",
      "technical",
      "articles"
    ],
    "profileUrl": "https://github.com/eugeneyan",
    "readmeUrl": "https://github.com/eugeneyan/eugeneyan/blob/master/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "hamelsmu",
    "direction": "technical",
    "title": "Focused technical narrative",
    "when": "Consultants, specialists and book authors",
    "learn": "Connect specialty to concrete teaching, writing and artifacts",
    "avoid": "Using book covers or publication claims without authorization",
    "tags": [
      "engineering",
      "evals",
      "consulting",
      "articles",
      "teaching",
      "technical"
    ],
    "profileUrl": "https://github.com/hamelsmu",
    "readmeUrl": "https://github.com/hamelsmu/hamelsmu/blob/main/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "martincostello",
    "direction": "technical",
    "title": "Contributions across organizations",
    "when": "Open-source maintainers and collaborators",
    "learn": "Make upstream maintenance and contributed code traceable",
    "avoid": "Equating any GitHub project link with personal authorship",
    "tags": [
      "contributions",
      ".net",
      "dotnet",
      "open-source",
      "maintainer",
      "technical"
    ],
    "profileUrl": "https://github.com/martincostello",
    "readmeUrl": "https://github.com/martincostello/martincostello/blob/main/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "jeroenvervaeke",
    "direction": "technical",
    "title": "Career context plus links to code",
    "when": "Practitioners with a verified engineering timeline",
    "learn": "Show what technologies were used and provide project links",
    "avoid": "Copying role/seniority claims or padding background",
    "tags": [
      "rust",
      "backend",
      "career",
      "portfolio",
      "technical"
    ],
    "profileUrl": "https://github.com/jeroenvervaeke",
    "readmeUrl": "https://github.com/jeroenvervaeke/jeroenvervaeke/blob/master/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "WenyuChiou",
    "direction": "expressive",
    "title": "Domain-specific visual storytelling",
    "when": "Researchers with rights-cleared diagrams and artwork",
    "learn": "Visualize the problem and connect illustrations to evidence",
    "avoid": "Copying original art or confusing a profile with a standalone website",
    "tags": [
      "research",
      "illustration",
      "diagram",
      "storytelling",
      "expressive",
      "visual"
    ],
    "profileUrl": "https://github.com/WenyuChiou",
    "readmeUrl": "https://github.com/WenyuChiou/WenyuChiou/blob/main/README.md",
    "origin": "user-supplied-reference"
  },
  {
    "id": "fzn0x",
    "direction": "expressive",
    "title": "Code-like identity",
    "when": "Builders asking for a memorable terminal-inspired identity",
    "learn": "Make the introduction resemble structured code without copying source",
    "avoid": "Automated counters and typing widgets as default decorations",
    "tags": [
      "terminal",
      "code",
      "bio",
      "identity",
      "expressive",
      "creative"
    ],
    "profileUrl": "https://github.com/fzn0x",
    "readmeUrl": "https://github.com/fzn0x/fzn0x/blob/main/README.md",
    "origin": "user-supplied-reference"
  },
  {
    "id": "orhun",
    "direction": "expressive",
    "title": "Tool-shaped visual identity",
    "when": "Terminal and systems developers with visual artifacts",
    "learn": "Match visual motion and themes to an actual project",
    "avoid": "Many badges, animated graphics and statistics by default",
    "tags": [
      "terminal",
      "rust",
      "animated",
      "expressive",
      "technical"
    ],
    "profileUrl": "https://github.com/orhun",
    "readmeUrl": "https://github.com/orhun/orhun/blob/master/README.md",
    "origin": "external-curated-research"
  },
  {
    "id": "cathrynlavery",
    "direction": "expressive",
    "title": "Story-driven builder portfolio",
    "when": "Indie makers with distinct projects and a personal journey",
    "learn": "Explain the transition from motivation to shipped products",
    "avoid": "Borrowing quantified business outcomes or unrelated stat graphics",
    "tags": [
      "product",
      "builder",
      "startup",
      "portfolio",
      "narrative",
      "expressive"
    ],
    "profileUrl": "https://github.com/cathrynlavery",
    "readmeUrl": "https://github.com/cathrynlavery/cathrynlavery/blob/main/README.md",
    "origin": "external-curated-research"
  },
  {
    "id": "dereknguyen269",
    "direction": "expressive",
    "title": "Single original hero then projects",
    "when": "Independent builders with rights-owned visual branding",
    "learn": "A custom header should introduce linked, inspectable work",
    "avoid": "Turning the README into a marketing splash without evidence",
    "tags": [
      "hero",
      "banner",
      "tools",
      "products",
      "developer",
      "visual",
      "expressive"
    ],
    "profileUrl": "https://github.com/dereknguyen269",
    "readmeUrl": "https://github.com/dereknguyen269/dereknguyen269/blob/master/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "mokkapps",
    "direction": "expressive",
    "title": "Real product screenshot gallery",
    "when": "Product-oriented freelancers and UI builders",
    "learn": "Use actual product images alongside specific links and descriptions",
    "avoid": "Stock banners, unmaintained screenshots or remote asset reliance",
    "tags": [
      "screenshots",
      "portfolio",
      "vue",
      "nuxt",
      "product",
      "expressive",
      "visual"
    ],
    "profileUrl": "https://github.com/mokkapps",
    "readmeUrl": "https://github.com/Mokkapps/mokkapps/blob/master/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "davidgcs",
    "direction": "expressive",
    "title": "Structured visual portfolio",
    "when": "Full-stack makers with several distinct work streams",
    "learn": "Organize identity, work and contacts with intentional spacing",
    "avoid": "Overcrowded social buttons, icons or redundant cards",
    "tags": [
      "portfolio",
      "frontend",
      "fullstack",
      "visuals",
      "links",
      "expressive"
    ],
    "profileUrl": "https://github.com/davidgcs",
    "readmeUrl": "https://github.com/davidgcs/davidgcs/blob/main/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "natemoo-re",
    "direction": "expressive",
    "title": "Design engineering voice",
    "when": "Design engineers whose work has a strong visual identity",
    "learn": "Use concise personal voice to support public design artifacts",
    "avoid": "Importing expressive symbols, identity or claims from the source",
    "tags": [
      "design",
      "engineering",
      "astro",
      "creative",
      "narrative",
      "expressive"
    ],
    "profileUrl": "https://github.com/natemoo-re",
    "readmeUrl": "https://github.com/natemoo-re/natemoo-re/blob/master/README.md",
    "origin": "independent-verified-research"
  },
  {
    "id": "sreeram-venkitesh",
    "direction": "expressive",
    "title": "Open-source evidence with selective visuals",
    "when": "Community contributors documenting upstream work",
    "learn": "Place verified contributions and release work before decorative content",
    "avoid": "Using achievements or logos as substitutes for contribution proof",
    "tags": [
      "kubernetes",
      "cloud",
      "open-source",
      "community",
      "expressive",
      "technical"
    ],
    "profileUrl": "https://github.com/sreeram-venkitesh",
    "readmeUrl": "https://github.com/sreeram-venkitesh/sreeram-venkitesh/blob/master/README.md",
    "origin": "independent-verified-research"
  }
];
export const CURATED_PROFILE_PATTERNS=Object.freeze(candidates.map(entry=>Object.freeze({
  ...entry,tags:Object.freeze([...entry.tags]),
  status:PROFILE_SHORTLIST_STATUS,
  license:'Public README is a reading reference only; never copy text, artwork or other assets.',
})));
const directions=new Set(['barebones','minimal','technical','expressive']);
const safeQuery=query=>{
  if(typeof query!=='string'||query.length>400||/[\x00-\x1f\x7f]/.test(query))
    throw Error('Profile reference query must be plain text up to 400 characters.');
  return query;
};
export function getCuratedProfile(id){
  const item=CURATED_PROFILE_PATTERNS.find(x=>x.id.toLowerCase()===String(id||'').toLowerCase());
  if(!item)throw Error('Unknown curated profile; run sources profiles.');
  return item;
}
export function listCuratedProfiles({direction='',query=''}={}){
  safeQuery(query);
  if(direction&&!directions.has(direction))throw Error('Invalid profile reference direction.');
  const words=intentWords(query);
  const score=item=>intentMatchScore({...item,description:item.when+' '+item.learn},words);
  const profiles=CURATED_PROFILE_PATTERNS.filter(item=>
    (!direction||item.direction===direction) && (!words.length||score(item)>0));
  return {version:PROFILE_SHORTLIST_VERSION, total:profiles.length,
    corpusCount:100,approval:'Legacy 25 examples are provisional README-only choices, NOT best full profiles; holistic 500-profile curation pending',
    profiles, notice:'Original READMEs and claims are not templates or verified credentials.'};
}
// For briefs and agents, expose at most two *relevant* composition records. Never
// inject the full catalog, copied text, images or even a single pending research entry.
export function recommendCuratedPatterns({query='',direction='minimal',limit=2}={}){
  safeQuery(query);
  if(!directions.has(direction))throw Error('Invalid profile reference direction.');
  if(!Number.isInteger(limit)||limit<1||limit>2)throw Error('Only 1–2 profile patterns may be recommended.');
  const words=intentWords(query);
  const candidates=CURATED_PROFILE_PATTERNS.filter(item=>item.direction===direction)
    .map((item,index)=>({item,index,score:intentMatchScore({...item,
      description:item.when+' '+item.learn},words)}))
    .sort((a,b)=>b.score-a.score||a.index-b.index);
  const matches=words.length?candidates.filter(x=>x.score>0):candidates;
  return {version:PROFILE_SHORTLIST_VERSION,direction,query,
    profiles:matches.slice(0,limit).map(({item})=>({
      id:item.id,readmeUrl:item.readmeUrl,title:item.title,learn:item.learn,
      when:item.when,avoid:item.avoid,status:item.status,
    })),note:'LEGACY README-only pilot, not 25 best full profiles. Examples require avatar, bio, pins, contribution graph, achievements and rendered-layout review. Never copy source text or art.'};
}
