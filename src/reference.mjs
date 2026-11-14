/**
 * Offline structural reference for GitHub PROFILE presentation.
 *
 * Cohort A: 100 company-affiliated engineering accounts selected by three public
 * signals. Neither public org membership nor self-reported role/company is
 * verified current employment.
 *
 * Cohort B: 16 accounts linked to employer-controlled engineering author pages.
 * Those assertions can become outdated; they are not employment/background checks.
 *
 * Never copy biography text, infer personal seniority or predict hiring outcomes.
 */
const examples = [
  ['newren','GitHub','https://github.blog/author/newren/'],
  ['erik-krogh','GitHub','https://github.blog/author/erikkrogh/'],
  ['francinelucca','GitHub','https://github.blog/author/francinelucca/'],
  ['dmabuada','GitHub','https://github.blog/author/dmabuada/'],
  ['vdye','GitHub','https://github.blog/author/vdye/'],
  ['alexus37','GitHub','https://github.blog/author/alexus37/'],
  ['joshblack','GitHub','https://github.blog/author/joshblack/'],
  ['aneubeck','GitHub','https://github.blog/author/aneubeck/'],
  ['NellWhite','GitHub','https://github.blog/author/nellwhite/'],
  ['dtaivpp','GitHub','https://github.blog/author/dtaivpp/'],
  ['gorzell','GitHub','https://github.blog/author/gorzell/'],
  ['khxu','GitHub','https://github.blog/author/khxu/'],
  ['brittanyellich','GitHub','https://github.blog/author/brittanyellich/'],
  ['cheshire137','GitHub','https://github.blog/author/cheshire137/'],
  ['IEvangelist','Microsoft','https://github.blog/author/levangelist/'],
  ['Sergio0694','Microsoft','https://devblogs.microsoft.com/dotnet/author/sergiopedri/'],
];

export const PROFESSIONAL_EXAMPLES = Object.freeze(examples.map(([login,company,companySource]) =>
  Object.freeze({
    login, company, profileUrl: 'https://github.com/' + login,
    companySource,
    evidence: login === 'Sergio0694'
      ? 'Employer author page + matching public GitHub self-description, not an employer-linked account'
      : 'Employer-owned author source includes or corroborates the GitHub account',
    notes: 'Employment assertion may be historical; source is not payroll verification.',
  })));

/** Primary structural reference; 100-person legacy and employer-source cohorts remain separately documented. */
export const ORDINARY_REFERENCE = Object.freeze({
  "id": "ordinary-visibility-company-engineers-200-2026-11-12",
  "observedAt": "2026-11-12T05:56:50.023Z",
  "sampleSize": 200,
  "companyCount": 35,
  "completeRunRequests": 145,
  "criteria": "200 public company-org members with matching self-reported employer and engineering role; <=2000 visible followers; not certified employment or a representative engineering sample.",
  "observations": {
    "withBio": 200,
    "withWebsite": 120,
    "withPins": 157,
    "medianPins": 4,
    "rootReadmesObserved": 69,
    "readmeWords": {
      "median": 54
    },
    "readmesWithoutImages": 33,
    "readmesWithStatCards": 7,
    "readmesWithLinks": 57
  },
  "followerBands": {
    "0-99": 133,
    "100-499": 46,
    "500-2000": 21
  },
  "companyCounts": {
    "Shopify": 7,
    "Netflix": 9,
    "Datadog": 6,
    "Uber": 11,
    "Atlassian": 8,
    "Salesforce": 5,
    "Canonical": 9,
    "Grafana": 15,
    "DigitalOcean": 5,
    "MongoDB": 7,
    "Vercel": 9,
    "Stripe": 4,
    "Supabase": 5,
    "NVIDIA": 6,
    "JetBrains": 6,
    "Databricks": 4,
    "Postman": 11,
    "Gitpod": 1,
    "Gradle": 6,
    "GitHub": 2,
    "Google": 9,
    "Docker": 4,
    "Dropbox": 1,
    "Microsoft": 7,
    "Elastic": 4,
    "Twilio": 2,
    "Airbnb": 1,
    "Netlify": 1,
    "HashiCorp": 14,
    "GitLab": 1,
    "Amazon": 4,
    "Sourcegraph": 1,
    "Tailscale": 5,
    "Mozilla": 5,
    "Cloudflare": 5
  },
  "source": "https://github.com/ibbuilds/gh-aura/blob/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research/ordinary-engineers-200.json",
  "sourceBlob": "6bd0775f29d05b7c57515b147cd64bd80e046cc1",
  "method": "https://github.com/ibbuilds/gh-aura/blob/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research/ORDINARY_STUDY.md",
  "limitations": "A purposive sample, not an employment-verification or hiring-outcome study. Public company-org memberships may include external collaborators; employer and role are self-listed and potentially stale. Followers <=2000 is an arbitrary visibility filter, not an engineering ranking. Only root HEAD:README.md was inspected. No biographies copied."
});

export const PROFILE_REFERENCE = Object.freeze({
  id: 'company-associated-engineering-profiles-2026-11-11',
  observedAt: '2026-11-11T22:32:00.683Z',
  sampleSize: 100,
  companyCount: 21,
  completeRunRequests: 74,
  criteria: 'Public company GitHub-org membership + matching self-listed company + self-listed engineering role. These are three public signals, not certified employment.',
  observations: {
    withBio: 100, withWebsite: 59, withPins: 75, medianPins: 4,
    rootReadmesObserved: 38,
    readmeWords: { median: 41 },
    readmesWithoutImages: 20, readmesWithStatCards: 3, readmesWithLinks: 28,
  },
  companyCounts: {
    Shopify: 5, Vercel: 9, Netflix: 6, Datadog: 5, Uber: 7,
    Grafana: 12, DigitalOcean: 5, Stripe: 4, Supabase: 4, NVIDIA: 4,
    GitHub: 2, Google: 7, Docker: 4, Microsoft: 5, Elastic: 3,
    Airbnb: 1, HashiCorp: 9, GitLab: 1, Amazon: 1, Mozilla: 4, Cloudflare: 2,
  },
  employerSourced: {
    observedAt: '2026-11-11T22:35:54.693Z', sampleSize: 16, companyCount: 2,
    completeRunRequests: 2,
    observations: {
      withBio: 9, withWebsite: 7, withPins: 12, medianPins: 3,
      rootReadmesObserved: 7, medianReadmeWords: 43,
      readmesWithoutImages: 2, readmesWithLinks: 5, readmesWithStatCards: 2,
    },
    criteria: 'Employer-owned engineering author/staff pages; GitHub login linked or corroborated, with source and observation date. Employer assertion may go stale.',
    source: 'https://github.com/ibbuilds/gh-aura/blob/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research/employer-observations.json',
    roster: 'https://github.com/ibbuilds/gh-aura/blob/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research/employer-sourced.json',
    sourceBlob: '7273b8c61bb331e9c6bd0aa52db56c42d75181f6',
  },
  source: 'https://github.com/ibbuilds/gh-aura/blob/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research/company-profiles.json',
  sourceBlob: 'adfc2182373987db1a63a18f0ab50f9c772810ff',
  method: 'https://github.com/ibbuilds/gh-aura/blob/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research/INDUSTRY_STUDY.md',
  limitations: 'Not a hiring-outcome study, employer-verification service or representative survey. Company and role are self-reported in the 100-person cohort; public organization members may be external collaborators. Employer pages can be stale. Root README.md only. No biographies copied.',
});

/**
 * Run entirely offline. References are examples of structural PRESENTATION, not
 * models of a user's achievements or current employment.
 */
export function referenceReport(company = '') {
  if (typeof company !== 'string' || company.length > 100) throw new Error('Company filter must be short text.');
  const filter = company.trim().toLowerCase();
  const selected = PROFESSIONAL_EXAMPLES.filter((x) => !filter || x.company.toLowerCase().includes(filter));
  const affiliated = Object.entries(ORDINARY_REFERENCE.companyCounts)
    .filter(([name]) => !filter || name.toLowerCase().includes(filter))
    .map(([companyName,count]) => ({ company: companyName, count, classification: 'dual public signal; employment unverified' }));
  return {
    title: 'GH Aura — professional profile references',
    asOf: ORDINARY_REFERENCE.observedAt,
    cohort: { sampleSize: ORDINARY_REFERENCE.sampleSize,
      companyCount: ORDINARY_REFERENCE.companyCount,
      criteria: ORDINARY_REFERENCE.criteria,
      structure: ORDINARY_REFERENCE.observations, affiliated,
      followerBands: ORDINARY_REFERENCE.followerBands, source: ORDINARY_REFERENCE.source },
    employerSourced: {
      sampleSize: PROFILE_REFERENCE.employerSourced.sampleSize,
      criteria: PROFILE_REFERENCE.employerSourced.criteria,
      structure: PROFILE_REFERENCE.employerSourced.observations,
      examples: selected,
    },
    methodology: ORDINARY_REFERENCE.method,
    limitations: ORDINARY_REFERENCE.limitations,
  };
}

export function renderReferenceReport(data) {
  const lines = [
    '# GH Aura — professional profile references', '',
    String(data.cohort.sampleSize) + ' ordinary-visibility company-associated engineering accounts from ' + data.cohort.companyCount + ' organizations.',
    String(data.employerSourced.sampleSize) + ' additional employer-sourced author profiles. Neither cohort predicts hiring.',
    '',
    '## Employer-sourced profile examples', '',
  ];
  if (!data.employerSourced.examples.length) lines.push('No employer-sourced examples match this company filter.', '');
  for (const entry of data.employerSourced.examples) {
    lines.push('- [' + entry.login + '](' + entry.profileUrl + ') (' + entry.company +
      ') — [employer source](' + entry.companySource + ')');
  }
  lines.push('', '## Public affiliation signals by company', '');
  if (!data.cohort.affiliated.length) lines.push('No profiles for this filter in the company-affiliated sample.', '');
  for (const entry of data.cohort.affiliated) lines.push('- ' + entry.company + ': ' + entry.count + ' public profiles (employment unverified)');
  lines.push('', 'Method: ' + data.methodology, '',
    'Limitations: ' + data.limitations, '',
    'These are sources for structural guidance, not biographies to copy or credentials to imitate.', '');
  return lines.join('\n');
}
