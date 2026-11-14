// Deterministic request-count benchmark, not a claim about every user's latency.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getSnapshot } from '../src/github.mjs';
import { ReadCache } from '../src/cache.mjs';
import { ReadSession } from '../src/session.mjs';
import { DEFAULT_CONFIG } from '../src/config.mjs';
import { editorialBrief } from '../src/brief.mjs';
import { wholeProfileContext,nativeProfileDraft } from '../src/profile-context.mjs';
import { inspectWholeProfile } from '../src/profile-plan.mjs';
import { makeProfileSpec } from '../src/agent-profile.mjs';
import { inspectPublicProject } from '../src/profile-projects.mjs';

function fixtureFetch() {
  return async (url) => {
    const path = new URL(url).pathname;
    let value;
    if (path === '/users/example') value = { login: 'example', type: 'User', name: 'Example', bio: 'Builds API tools.', public_repos: 2 };
    else if (path === '/users/example/repos') value = [
      { name: 'example', full_name: 'example/example', private: false, fork: false, size: 10 },
      { name: 'tool', full_name: 'example/tool', private: false, fork: false, size: 10, language: 'TypeScript', description: 'An API tool.', topics: ['api'], pushed_at: '2026-11-01', stargazers_count: 0 },
    ];
    else if (path === '/repos/example/example') value = {id:1,full_name: 'example/example', private: false,default_branch:'main' };
    else if (path === '/repos/example/example/contents/README.md') value = {type:'file',path:'README.md',sha:'a'.repeat(40),encoding: 'base64', content: Buffer.from('# Example\n').toString('base64'), size: 10 };
    else if (path === '/repos/example/example/git/ref/heads/main')value={object:{sha:'b'.repeat(40)}};
    else if (path === '/repos/example/tool')value={name:'tool',full_name:'example/tool',private:false,default_branch:'main',description:'An API tool.'};
    else if (path === '/repos/example/tool/readme')value={encoding:'base64',content:Buffer.from('# API tool\n\n## Usage\n').toString('base64')};
    else if (path === '/repos/example/tool/git/trees/main')value={truncated:false,tree:[{path:'package.json',type:'blob'}]};
    else throw new Error('Unexpected fixture request: ' + path);
    return new Response(JSON.stringify(value), { headers: { etag: '"fixture"' } });
  };
}
export async function measureWholeProfile(){
  const oldSession=new ReadSession({fetch:fixtureFetch()}),options={fetch:oldSession.fetch,token:''};
  await getSnapshot('example',{...options,includeProfile:true});
  await inspectWholeProfile('example',options);await inspectPublicProject('example/tool',options);
  const spec={composition:makeProfileSpec({goal:'API',featured:['example/tool'],maxProjects:1})};
  const context=await wholeProfileContext('example',spec,{fetch:fixtureFetch(),token:''});
  const draft=await nativeProfileDraft('example',spec,{fetch:fixtureFetch(),token:''});
  return {fixture:'One owned project, public profile README, no private/pinned GraphQL access',
    previousContextRequests:oldSession.requests,currentContextRequests:context.usage.networkRequests,nativeDraftRequests:draft.usage.networkRequests,
    contextBytes:Buffer.byteLength(JSON.stringify(context)),draftBytes:Buffer.byteLength(draft.markdown),
    limitations:'Deterministic fixture measurements only; no universal latency or model-token claim.'};
}

export async function measure() {
  const directory = mkdtempSync(join(tmpdir(), 'gh-aura-benchmark-'));
  try {
    const legacy = new ReadSession({ fetch: fixtureFetch() });
    await getSnapshot('example', { token: '', fetch: legacy.fetch, includeProfile: true });
    const cold = new ReadSession({ fetch: fixtureFetch() });
    const snapshot = await getSnapshot('example', { token: '', fetch: cold.fetch, cache: new ReadCache({ directory }), includeProfile: false });
    const warm = new ReadSession({ fetch: fixtureFetch() });
    await getSnapshot('example', { token: '', fetch: warm.fetch, cache: new ReadCache({ directory }), includeProfile: false });
    snapshot.profileReadme = { content: 'Existing text. '.repeat(5000) };
    const brief = editorialBrief(snapshot, structuredClone(DEFAULT_CONFIG));
    assert.equal(legacy.requests, 4);
    assert.equal(cold.requests, 2);
    assert.equal(warm.requests, 0);
    assert.equal(brief.existingReadme.content.length, 1200);
    assert.ok(Buffer.byteLength(JSON.stringify(brief)) <= 12000);
    return { fixture: 'Unauthenticated public account, two repositories, existing profile README, no extra inspection',
      profileGeneration: { previousReadPlanRequests: legacy.requests, currentColdRequests: cold.requests, currentWarmRequests: warm.requests },
      editorialContext: { previousExistingReadmeCharacterCap: 24000, currentExistingReadmeCharacterCap: 1200, measuredBriefBytes: Buffer.byteLength(JSON.stringify(brief)), maximumCompactBriefBytes: 12000 },
      wholeProfile:await measureWholeProfile(),limits: 'Fixture request counts and JSON byte sizes, not universal latency, RSS or model-token savings.' };
  } finally { rmSync(directory, { recursive: true, force: true }); }
}
if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) console.log(JSON.stringify(await measure(), null, 2));
