import { loadConfig } from '../config.mjs';
import { applyProfile, previewProfile, profileTarget, readDraft, readReview, saveReview } from '../workflow.mjs';
import { emit, loginFor } from '../output.mjs';

/** Kept separate from analysis and AI context; always uses live revision checks. */
export async function run(command, options) {
  let user, draft, approval;
  if (command === 'apply' && options.review) {
    if (options.file || options.approve || options.config) throw new Error('--review cannot be combined with --file, --approve or --config.');
    const review = readReview(options.review);
    if ((options.user || options.positional[0]) && loginFor(options, { user: review.user }).toLowerCase() !== review.user.toLowerCase()) throw new Error('Review belongs to a different user.');
    user = review.user; draft = readDraft(review.file); approval = review.approval;
  } else {
    user = loginFor(options, loadConfig(options.config));
    draft = readDraft(options.file); approval = options.approve;
    if (command === 'apply' && !approval) throw new Error('Publishing requires --approve from preview, or --review FILE.');
  }
  const target = await profileTarget(user);
  if (command === 'preview') {
    emit(previewProfile(target, draft));
    if (options.save) {
      saveReview(options.save, target, options.file, draft, options.force);
      emit('Review saved. Run apply --review with that file only after inspecting this diff.');
    }
    return;
  }
  const apply = options.pr ? (await import('../pull-request.mjs')).proposeProfile : applyProfile;
  const result = await apply(target, draft, approval);
  emit(options.format === 'json' ? result : result.message + (result.pullRequest || result.commit ? '\n' + (result.pullRequest || result.commit) : ''));
}
