import { resolve } from 'node:path';
import { loadConfig } from './config.mjs';
import { emit } from './output.mjs';
import { readDraft } from './workflow.mjs';
import { wholeProfileContext } from './profile-context.mjs';
import { scanPublicProjects, inspectPublicProject, inspectCurrentPins } from './profile-projects.mjs';
import { makeWholeProfileSpec, inspectWholeProfile, prepareProfilePlan, previewWholeProfilePlan,
  readProfileJSON, validateProfilePlan, executeProfilePlan,profileExecutionStatus } from './profile-plan.mjs';

export async function runImprove(options) {
  const [action = 'spec', positionalUser] = options.positional;
  const config = loadConfig(options.config);
  const user = options.user || positionalUser || config.user;
  if (options.user && positionalUser && options.user.toLowerCase() !== positionalUser.toLowerCase()) throw Error('Conflicting usernames.');
  if (action === 'spec') return emit(makeWholeProfileSpec(options.spec ? readProfileJSON(options.spec) : {}, config), options);
  if (action === 'context') return emit(await wholeProfileContext(user,options.spec?readProfileJSON(options.spec):{},{config}),options);
  if (action === 'inspect') return emit(await inspectWholeProfile(user), options);
  if (action === 'projects') return emit(await scanPublicProjects(user,{goal:options.goal||config.showcase.goal,
    cursor:options.cursor===undefined?1:Number(options.cursor),pages:options.pages===undefined?5:Number(options.pages),
    inspect:options.inspect===undefined?3:Number(options.inspect)}), options);
  if (action === 'project') return emit(await inspectPublicProject(options.repo), options);
  if (action === 'pins') return emit(await inspectCurrentPins(user), options);
  if (action === 'plan') {
    const spec = makeWholeProfileSpec(options.spec ? readProfileJSON(options.spec) : {}, config);
    return emit(await prepareProfilePlan(user, spec, options.file ? readDraft(options.file) : undefined, { delivery: options.delivery }), options);
  }
  if (!options.review) throw Error('Supply --review PLAN.json.');
  const plan = validateProfilePlan(readProfileJSON(options.review));
  if (user && user.toLowerCase() !== plan.username.toLowerCase()) throw Error('Review belongs to another account.');
  if (action === 'preview') return emit(previewWholeProfilePlan(plan), options);
  if (action === 'authorize') {
    if (options.confirm !== plan.fingerprint) throw Error('Inspect the plan and confirm its exact fingerprint.');
    return emit({ purpose: 'Owner-configured host grant; never create this approval through an agent tool.',
      mcpEnvironment: { GH_AURA_APPROVED_PLAN: resolve(options.review), GH_AURA_APPROVED_FINGERPRINT: plan.fingerprint },
      next: 'The owner configures these values in the MCP host to permit only this exact plan. Remove them to revoke the grant.' }, options);
  }
  if (action === 'apply') return emit(await executeProfilePlan(plan, options.confirm), options);
  if (action === 'status') return emit(profileExecutionStatus(plan),options);
  throw Error('Use improve spec, inspect, plan, preview, authorize, apply or status.');
}
