import { readFileSync, statSync } from 'node:fs';
import { TextDecoder } from 'node:util';
import { selectFeatured } from './engine.mjs';
import { md, repoUrl } from './text.mjs';

const MAX_POSTING = 64 * 1024;

// Vocabulary is transparent and intentionally narrow. Matches are NOT proof
// of competence, employment, certification or interview eligibility.
const TERMS = [
  ['typescript', 'TypeScript', [/\btypescript\b/i]],
  ['javascript', 'JavaScript', [/\bjavascript\b/i, /\becmascript\b/i]],
  ['python', 'Python', [/\bpython\b/i]],
  ['java', 'Java', [/\bjava\b/i]],
  ['golang', 'Go', [/\bgolang\b/i, /\bGo(?:lang)?\s+(?:language|development|services)\b/]],
  ['rust', 'Rust', [/\brust\b/i]],
  ['csharp', 'C#', [/\bc#\b/i, /\bcsharp\b/i, /\bc-sharp\b/i, /\.net\b/i]],
  ['react', 'React', [/\breact(?:\.js|js)?\b/i]],
  ['nextjs', 'Next.js', [/\bnext(?:\.js|js)\b/i]],
  ['vue', 'Vue', [/\bvue(?:\.js|js)?\b/i]],
  ['angular', 'Angular', [/\bangular\b/i]],
  ['nodejs', 'Node.js', [/\bnode(?:\.js|js)\b/i]],
  ['sql', 'SQL', [/\bsql\b/i]],
  ['postgresql', 'PostgreSQL', [/\bpostgre(?:sql|s)\b/i]],
  ['mysql', 'MySQL', [/\bmysql\b/i]],
  ['redis', 'Redis', [/\bredis\b/i]],
  ['mongodb', 'MongoDB', [/\bmongodb\b/i]],
  ['docker', 'Docker', [/\bdocker\b/i]],
  ['kubernetes', 'Kubernetes', [/\bkubernetes\b/i, /\bk8s\b/i]],
  ['terraform', 'Terraform', [/\bterraform\b/i]],
  ['aws', 'AWS', [/\baws\b/i, /\bamazon web services\b/i]],
  ['azure', 'Azure', [/\bazure\b/i]],
  ['gcp', 'Google Cloud', [/\bgcp\b/i, /\bgoogle cloud\b/i]],
  ['linux', 'Linux', [/\blinux\b/i]],
  ['graphql', 'GraphQL', [/\bgraphql\b/i]],
  ['grpc', 'gRPC', [/\bgrpc\b/i]],
  ['rest', 'REST APIs', [/\brest(?:ful)?\s+apis?\b/i]],
  ['microservices', 'Microservices', [/\bmicroservices?\b/i]],
  ['testing', 'Automated testing', [/\b(?:unit|integration|automated|end.to.end|e2e)\s+test(?:ing|s)?\b/i]],
  ['cicd', 'CI/CD', [/\bci\s*\/\s*cd\b/i, /\bcontinuous integration\b/i]],
  ['observability', 'Observability', [/\bobservability\b/i, /\bmonitoring\b/i, /\bopentelemetry\b/i]],
  ['security', 'Security', [/\b(?:application|software|cloud|api)\s+security\b/i]],
  ['backend', 'Backend', [/\bback[ -]?end\b/i]],
  ['frontend', 'Frontend', [/\bfront[ -]?end\b/i]],
  ['distributed', 'Distributed systems', [/\bdistributed systems?\b/i]],
];

const hasTerm = (text, expressions) => expressions.some((expression) => expression.test(text));

export function readJobPosting(file) {
  if (typeof file !== 'string' || !file.trim()) throw new Error('Specify a local job description with --job FILE.');
  const size = statSync(file).size;
  if (!Number.isFinite(size) || size < 1 || size > MAX_POSTING) {
    throw new Error('Job description must contain 1–65536 bytes of UTF-8 text.');
  }
  const bytes = readFileSync(file);
  let content;
  try { content = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('Job description must use valid UTF-8.'); }
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(content)) {
    throw new Error('Job description must be plain text without control characters.');
  }
  if (!content.trim()) throw new Error('Job description is blank.');
  return content.replace(/\r\n/g, '\n');
}

export function matchJobPosting(jobText, snapshot, config) {
  if (typeof jobText !== 'string' || !jobText.trim() || Buffer.byteLength(jobText) > MAX_POSTING) {
    throw new Error('A non-empty local job description under 64 KiB is required.');
  }
  const selected = selectFeatured(snapshot, config);
  const stories = config.profile.projectStories || [];
  const requirements = [];
  for (const [id, label, patterns] of TERMS) {
    if (!hasTerm(jobText, patterns)) continue;
    const evidence = [];
    for (const repo of selected) {
      const metadata = [repo.name, repo.description, repo.language, ...(repo.topics || [])].filter(Boolean).join(' ');
      const story = stories.find((x) => [repo.name, repo.full_name]
        .some((name) => name.toLowerCase() === x.repo.toLowerCase()));
      const owned = [story?.problem, story?.contribution, story?.tradeoffs, story?.outcome].filter(Boolean).join(' ');
      if (hasTerm(metadata, patterns)) evidence.push({
        project: repo.full_name, url: repoUrl(repo),
        kind: 'public-repository-metadata',
        meaning: 'Metadata mention only; code, authorship and proficiency not verified.',
      });
      if (story && hasTerm(owned, patterns)) evidence.push({
        project: repo.full_name, url: story.proof || repoUrl(repo),
        kind: 'user-supplied-project-story',
        meaning: 'User-supplied statement; independent verification not established.',
      });
    }
    requirements.push({
      id, label,
      state: evidence.some((x) => x.kind === 'public-repository-metadata')
        ? 'mentioned-in-public-metadata'
        : evidence.length ? 'user-claimed' : 'not-observed-in-selected-projects',
      evidence,
    });
  }
  const matched = requirements.filter((x) => x.evidence.length);
  return {
    purpose: 'Local job-description keyword-to-portfolio evidence map, not an employment or hiring prediction.',
    source: 'local-user-supplied-job-description',
    targetRole: config.editorial.targetRole || config.showcase.goal || null,
    postingStored: false,
    postingSentToGitHub: false,
    recognizedTerms: requirements.length,
    selectedPublicProjects: selected.map((repo) => repo.full_name),
    requirements,
    summary: {
      withSomeEvidence: matched.length,
      notObservedInSelectedProjects: requirements.length - matched.length,
      note: 'Missing mentions are NOT proof of missing expertise. Text matches are NOT verification of skill.',
    },
    nextSteps: requirements.length ? [
      'Confirm which posting requirements are mandatory; keyword detection does not distinguish requirements from preferences.',
      'Explain your actual contribution, trade-offs and proof links for relevant selected projects.',
      'For non-observed terms, assess relevant private work or experience without disclosing confidential source.',
    ] : [
      'No supported skill/domain keywords were recognized. Read the posting manually; do not infer a zero skill match.',
    ],
    limitations: [
      'Only a transparent, limited vocabulary of technology and domain terms is recognized; no semantic understanding.',
      'No inference of job level, hiring odds, personal expertise, verified employer, or test execution.',
      'Selected repositories only; work outside public GitHub is unknown. No job-posting text is sent to GitHub.',
      'The input posting is never included verbatim in output or stored by GH Aura.',
    ],
  };
}

export function renderJobMatch(report) {
  const lines = ['## Local job description evidence map', '',
    'This comparison is based on a local job posting. It is not a skill certification or hiring probability.', '',
    'Recognized technical terms: ' + report.recognizedTerms, ''];
  if (report.requirements.length) {
    lines.push('| Requirement mentioned | Portfolio evidence | Selected repositories |',
      '| --- | --- | --- |');
    for (const item of report.requirements) {
      const linkProjects = [...new Map(item.evidence.map((x) => [x.project,
        '[' + md(x.project) + '](' + x.url + ')'])).values()];
      lines.push('| ' + md(item.label) + ' | ' + item.state +
        ' | ' + (linkProjects.join(', ') || 'Not observed — not proof of absence') + ' |');
    }
    lines.push('');
  } else lines.push('No vocabulary matches were detected. Review the full posting yourself.', '');
  lines.push(...report.nextSteps.map((x) => '- ' + md(x)), '',
    'The posting remains local. Repository metadata and personal stories do not establish technical competence.', '');
  return lines.join('\n');
}
