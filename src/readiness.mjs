import { selectFeatured } from './engine.mjs';
import { repoUrl } from './text.mjs';

/**
 * A first-minute portfolio review, not an assessment of a person's employability.
 * Reports ONLY observable profile/metadata/README evidence and separates unknowns.
 */
export function hiringReview(snapshot, config) {
  const role = String(config.editorial?.targetRole || config.showcase.goal || '').trim();
  const login = snapshot.username;
  const profile = 'https://github.com/' + login;
  const bio = String(snapshot.user.bio || '').trim();
  const heading = String(config.profile.headline || '').trim();
  const about = String(config.profile.about || '').trim();
  const profileReadme = snapshot.profileReadme;
  const hasReadme = profileReadme && profileReadme.unknown !== true;
  const links = (config.profile.links || []).filter((x) => x?.url?.startsWith('https://'));
  const website = String(snapshot.user.blog || '');
  const showcase = selectFeatured(snapshot, config);

  const checks = [];
  const add = (id, label, state, observation, action, source, priority) => checks.push({
    id, label, state, observation, action, source, priority,
    confidence: state === 'unknown' ? 'unknown' : 'observed-or-user-supplied',
  });

  // A target role is a user preference, not a verified current job title.
  if (!role) {
    add('target-role', 'Intended role', 'unknown',
      'No target role is configured; the tool cannot assess relevance to a particular opening.',
      'Set editorial.targetRole (or pass --goal) to define the job this profile should support.',
      profile, 1);
  } else {
    add('target-role', 'Intended role', 'clear',
      'The declared application target is: ' + role + '. This is a preference, not an employment claim.',
      'Confirm that your profile headline and showcased work reflect this target without claiming a job you do not hold.',
      profile, 4);
  }

  if (!bio && !heading && !about) {
    add('positioning', 'First impression', 'needs-work',
      'No public bio or explicitly written profile positioning was found.',
      'Write one short, factual sentence about the engineering problems you can demonstrate.',
      profile, 1);
  } else if (!bio) {
    add('positioning', 'First impression', 'needs-work',
      'A draft headline/about exists in configuration, but the public GitHub bio is empty.',
      'Add a concise bio in GitHub profile settings. Local config is not published automatically.',
      profile, 2);
  } else {
    add('positioning', 'First impression', 'clear',
      'Public bio: ' + bio.slice(0, 240),
      'Confirm that it describes your actual work and the role you are applying for.',
      profile, 5);
  }

  if (profileReadme?.unknown) {
    add('navigation', 'Readable introduction', 'unknown',
      'The profile README could not be inspected; its absence is not established.',
      'Inspect the public username/username README manually before replacing it.',
      profile, 2);
  } else if (!hasReadme || !profileReadme.content?.trim()) {
    add('navigation', 'Readable introduction', 'needs-work',
      'No readable public profile README was observed in the expected location.',
      'Publish a concise introduction and links to two or three strong, inspectable projects.',
      profile, 2);
  } else {
    add('navigation', 'Readable introduction', 'clear',
      'A public profile README was observed. Its readability and factuality are not certified.',
      'Review the first screen for a clear focus and links to the most relevant work.',
      profileReadme.url || profile, 5);
  }

  if (!showcase.length) {
    add('showcase', 'Inspectible projects', 'needs-work',
      'No eligible public projects were selected for the first-minute showcase.',
      'Select two or three real projects (or meaningful external contributions) that demonstrate the target role.',
      profile + '?tab=repositories', 1);
  } else if (showcase.length === 1) {
    add('showcase', 'Inspectable projects', 'needs-work',
      'Only one featured public repository is available for the proposed introduction.',
      'Consider a second complementary project only if you have substantive work worth presenting.',
      repoUrl(showcase[0]), 3);
  } else {
    add('showcase', 'Inspectable projects', 'clear',
      showcase.length + ' public repositories can be highlighted. Actual pinned status must be checked in GitHub.',
      'Confirm they represent different skills relevant to your intended role and select the pins manually.',
      profile, 5);
  }

  const roleTerms = role.toLowerCase().split(/[^a-z0-9+#.]+/).filter((term) =>
    term.length > 2 && !['engineer', 'engineering', 'software', 'developer', 'dev', 'senior', 'junior', 'mid', 'level', 'specialist'].includes(term));
  if (!role) {
    add('role-fit', 'Role relevance', 'unknown',
      'A target role is required before comparing showcased projects with a job.',
      'Choose a target role and select projects for that audience.',
      profile, 2);
  } else if (!showcase.length) {
    add('role-fit', 'Role relevance', 'needs-work',
      'No projects were selected for a role-specific portfolio.',
      'Select public work you can explain and show to an interviewer.',
      profile + '?tab=repositories', 2);
  } else {
    const matched = showcase.filter((repo) => {
      const words = [repo.name, repo.description, repo.language, ...(repo.topics || [])].join(' ').toLowerCase();
      return roleTerms.some((term) => words.includes(term));
    });
    if (!roleTerms.length) {
      add('role-fit', 'Role relevance', 'unknown',
        'The configured role has no distinguishing keywords for this metadata-only comparison.',
        'Inspect project work directly and align it with a specific job description.',
        profile, 3);
    } else if (!matched.length) {
      add('role-fit', 'Role relevance', 'unknown',
        'No role keywords were detected in selected project metadata. This does not establish that the work is irrelevant.',
        'Describe the role-relevant decisions and technologies in project READMEs, or select stronger examples.',
        profile + '?tab=repositories', 2);
    } else {
      add('role-fit', 'Role relevance', 'clear',
        matched.length + ' selected repositories mention at least one role-related keyword in public metadata. Technical fit is unverified.',
        'Confirm that their actual code and your contribution demonstrate the target role.',
        repoUrl(matched[0]), 4);
    }
  }

  const projects = showcase.map((repo) => {
    const inspect = repo.inspection;
    const documentation = !inspect ? 'not-inspected' : inspect.state === 'missing' ? 'missing'
      : inspect.state === 'available' ? 'available' : 'unknown';
    const setup = inspect?.features?.installation === true;
    const usage = inspect?.features?.usage === true;
    const testing = inspect?.features?.testing === true;
    return {
      repository: repo.full_name,
      url: repoUrl(repo),
      description: repo.description || null,
      documentation,
      setupHeadingDetected: documentation === 'available' ? setup : null,
      usageHeadingDetected: documentation === 'available' ? usage : null,
      testingHeadingDetected: documentation === 'available' ? testing : null,
      testedCode: 'unknown',
      ciStatus: 'unknown',
      personalOwnershipOfWork: 'unverified',
      note: 'README headings and repository metadata are presentation signals, not proof of correct code or personal expertise.',
    };
  });

  const inspected = projects.filter((x) => x.documentation !== 'not-inspected');
  const docsProblems = inspected.filter((x) =>
    x.documentation === 'missing' ||
    (x.documentation === 'available' && !x.setupHeadingDetected && !x.usageHeadingDetected));
  if (!inspected.length) {
    add('project-onboarding', 'Project usability', 'unknown',
      'The proposed showcase project READMEs have not been inspected.',
      'Run audit --inspect 3 to check how a visitor would begin exploring your best work.',
      profile + '?tab=repositories', 2);
  } else if (docsProblems.length) {
    add('project-onboarding', 'Project usability', 'needs-work',
      docsProblems.length + ' of ' + inspected.length + ' inspected showcase projects lack a README or recognized setup/usage headings.',
      'Add a concrete problem statement, installation/usage instructions and a simple example to selected repos. Custom headings may already be sufficient.',
      docsProblems[0].url, 2);
  } else if (inspected.length < projects.length || inspected.some((x) => x.documentation === 'unknown')) {
    add('project-onboarding', 'Project usability', 'unknown',
      'Some selected projects remain uninspected or have unreadable READMEs.',
      'Inspect the remaining featured projects and manually verify setup instructions.',
      profile + '?tab=repositories', 2);
  } else {
    add('project-onboarding', 'Project usability', 'clear',
      'Inspected README files contain basic documentation signals; their accuracy and execution are not verified.',
      'Check examples, test commands and dependency requirements before sharing.',
      inspected[0].url, 4);
  }

  if (!links.length && !website) {
    add('contact', 'Contact path', 'needs-work',
      'No public portfolio/website field or user-configured contact link was observed.',
      'Add an appropriate professional contact link or portfolio URL if you want to be reachable.',
      profile, 3);
  } else {
    add('contact', 'Contact path', 'clear',
      'At least one external link is available; availability and ownership are not checked.',
      'Open it yourself to confirm that it works and is current.',
      profile, 5);
  }

  add('technical-evidence', 'Engineering depth', 'unknown',
    'This review does not execute projects, inspect architecture, tests or CI, or verify your personal contribution.',
    'For your strongest two projects, demonstrate what problem they solve, which trade-offs you made and how to run and test them.',
    projects[0]?.url || profile, 2);

  const actionable = checks.filter((item) => item.state !== 'clear')
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  return {
    purpose: 'First-minute engineering portfolio review; NOT a hiring probability, personal rating, or proof of competence.',
    targetRole: role || null,
    audience: 'Hiring manager or technical recruiter reviewing a GitHub portfolio.',
    observedAt: snapshot.observedAt,
    checks,
    featuredProjects: projects,
    actions: actionable.map((item) => ({ id: item.id, priority: item.priority, nextStep: item.action, source: item.source })),
    limitations: [
      'No inference of seniority, current employment, skills or code quality from stars, language or repository size.',
      'Project documentation detection uses headings and cannot certify runnable examples or correct tests.',
      'Private work and confidential commercial experience may be absent and must not be treated as no experience.',
      'Contribution squares, cosmetic badges, follower counts and daily streaks do not establish hiring suitability.',
      'Only a human reviewer can judge whether the actual work supports a job application.',
    ],
  };
}

export function renderHiringReview(review) {
  const lines = [
    '## First-minute hiring-manager review', '',
    'Target role: ' + (review.targetRole || 'Not set — configure editorial.targetRole or use --goal.'), '',
    'This is a readiness checklist, not a hiring score or employment prediction.', '',
  ];
  for (const c of review.checks) {
    lines.push('### ' + c.label + ' — ' + c.state, '',
      c.observation, '',
      '**Next:** ' + c.action, '',
      'Evidence: ' + c.source, '');
  }
  if (review.featuredProjects.length) {
    lines.push('### Featured project evidence', '',
      '| Project | README | Setup | Usage | Tests |', '| --- | --- | --- | --- | --- |');
    for (const p of review.featuredProjects) {
      const status = (v) => v === null ? 'not checked' : v ? 'heading found' : 'heading not found';
      lines.push('| [' + p.repository + '](' + p.url + ') | ' + p.documentation +
        ' | ' + status(p.setupHeadingDetected) + ' | ' + status(p.usageHeadingDetected) +
        ' | not verified |');
    }
    lines.push('', 'A README heading does not prove a project runs or is correctly tested.', '');
  }
  lines.push('### Important limits', '', ...review.limitations.map((x) => '- ' + x), '');
  return lines.join('\n');
}
